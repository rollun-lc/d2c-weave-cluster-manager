import { d2cClient } from '../apis/d2c-client.js';
import { notifier } from '../../main.js';
import { weaveClient } from '../apis/weave-net-api.js';
import { fileExists } from '../utils/file-exists.js';
import fs from 'fs/promises';
import ms from 'ms';

const hostsToMonitor = [
  'hetzner-01-test',
  'hetzner-catalog',
  'accounting-nr',
  'hetzner-03',
];

export async function fetchD2CServicesList() {
  const { hosts, containers } = await d2cClient.getEntities();

  return hosts
    .filter(({ name }) => hostsToMonitor.includes(name))
    .map(({ name, id: hostId }) => ({
      name,
      services: [...new Set(containers.filter(({ host }) => host === hostId).map(({ name }) => name.replace(/-[0-9]$/, '')))]
    }));
}

export async function fetchWeaveNetServiceList() {
  const peersList = (await weaveClient.getPeersList()).filter(({ name }) => hostsToMonitor.includes(name));

  const dnsEntries = (await weaveClient.getDNSEntriesList()).filter(({ name }) => !name.startsWith('lsyncd-'));

  return peersList.map(({ name, macAddr }) => ({
    name,
    services: dnsEntries.filter(({ hostMacAddr }) => hostMacAddr === macAddr).map(({ name }) => name),
  }))
}

export async function getClusterReport(d2cServices, weaveNetServices) {
  const getHostRetriesFileName = (name) => `${name}_retries.txt`;
  const getHostRebootLockFileName = (name) => `${name}_reboot_lock.txt`;

  const hostsPromises = hostsToMonitor.map(async name => {
    const d2cHost = d2cServices.find(({ name: _name }) => name === _name);
    const weaveHost = weaveNetServices.find(({ name: _name }) => name === _name);

    const servicesAvailabilityPercentage = weaveHost
      // hosts in d2c that are present in weave dns / all services in d2c * 100
      ? d2cHost.services.filter(service => weaveHost.services.includes(service)).length / d2cHost.services.length * 100
      : 0;

    const retriesFile = getHostRetriesFileName(name);
    const rebootLockFile = getHostRebootLockFileName(name);
    let status = 'green';
    let retries = 0;

    // if available at least 50% of service in weave, status remains green
    if (servicesAvailabilityPercentage <= 50) {
      if (await fileExists(retriesFile)) { // just read a file and increment value with host state if it exists
        const prev = +(await fs.readFile(retriesFile, 'utf-8'));
        await fs.writeFile(retriesFile, `${prev + 1}`);
        retries = prev + 1;
      } else { // create a file with host state if there is no file
        await fs.writeFile(retriesFile, '0');
        retries = 0;
      }

      if (retries < 5) {
        status = 'yellow';
      } else {
        status = 'red';
      }
    }

    // if host status is green, cleanup all state files - rebootLock & retries file
    if (status === 'green') {
      (await fileExists(retriesFile)) && (await fs.unlink(retriesFile));
      (await fileExists(rebootLockFile)) && (await fs.unlink(rebootLockFile));
    }

    // reboot lock prevents VM from rebooting, if it was already rebooted
    let rebootLock = false;
    if (status === 'red') {
      if (await fileExists(rebootLockFile)) {
        rebootLock = true;
      } else {
        await fs.writeFile(rebootLockFile, '');
        setTimeout(async () => {
          // remove rebootLock after some time, to let host reboot one more time
          (await fileExists(rebootLockFile)) && (await fs.unlink(rebootLockFile));
        }, ms('44m'));
      }
    }


    return {
      name,
      status,
      available: servicesAvailabilityPercentage,
      rebootLock,
      retry: retries,
    }
  });

  const hosts = await Promise.all(hostsPromises);

  return {
    clusterFailurePercentage: hosts.filter(({ status }) => status === 'red').length / hosts.length * 100,
    hosts,
  }
}

export function printReport(report) {
  const level = report.clusterFailurePercentage >= 70 ? 'info' : 'debug';

  notifier[level](`Cluster report`, `
clusterFailurePercentage: ${report.clusterFailurePercentage}

${report.hosts.map(({ name, status, retry, available }) => `${name}: ${status} ${retry} ${available}%`).join('\n')}`)
}

export async function rebootWeaveNetOnHost(host) {
  if (host === 'self') {
    // additional logic for self reboot
    notifier.info('[FAKE] rebooting ' + host);
    return;
  }
  notifier.info('[FAKE] rebooting ' + host);
}

export async function processCluster() {
  const d2cServicesList = await fetchD2CServicesList();
  const weaveNetServicesList = await fetchWeaveNetServiceList();

  const report = await getClusterReport(d2cServicesList, weaveNetServicesList);

  printReport(report);

  report.clusterFailurePercentage >= 70
    ? await rebootWeaveNetOnHost('self')
    : await Promise.all(
      report.hosts
        .filter(({ status, rebootLock }) => status === 'red' && !rebootLock)
        .map(({ name }) => rebootWeaveNetOnHost(name))
    );
}
