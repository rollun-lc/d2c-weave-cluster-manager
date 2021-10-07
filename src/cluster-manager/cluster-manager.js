import { d2cClient } from '../apis/d2c-client';
import execa from 'execa';

const hostsToMonitor = [
  'hetzner-first',
  'hetzner-catalog',
  'accounting-nr',
  'do-sfo-01',
  'hetzner-03',
];

export async function fetchD2CServicesList() {
  const { hosts, containers } = await d2cClient.getEntities();

  return hosts.map(({ name, id: hostId }) => ({
    name,
    services: [...new Set(containers.filter(({ host }) => host === hostId).map(({ name }) => name.replace(/-[0-9]$/, '')))]
  }));

}

export async function fetchWeaveNetServiceList() {
  const { stdout: peersConnections } = await execa('weave', ['status', 'peers']);

  const peersList = [...new Set(peersConnections.trim().match(/([0-9a-f:]{17})\((.+)\)/gi))]
    .map(s => {
      const [, macAddr, name] = s.match(/^([0-9a-f:]{17})\((.+)\)$/i);
      return { macAddr, name }
    });

  const { stdout: dnsList } = await execa('weave', ['status', 'peers']);


  const services = dnsList
    .trim()
    .split('\n')
    .map(s => {
      const [name, /* ip */, /* containerId */, hostMacAddr] = s.split(/\s+/);

      return { name: name.replace(/-[0-9]$/, ''), hostMacAddr };
    })
    // leave only unique
    .filter(({ name: _name }, idx, arr) => arr.findIndex(({ name }) => _name === name) === idx);

  return peersList.map(({ name, macAddr }) => ({
    name,
    services: services.filter(({ hostMacAddr }) => hostMacAddr === macAddr).map(({ name }) => name),
  }))
}

export async function getClusterReport(d2cServices, weaveNetServices) {

  const host = {
    name: '',
    status: 'green', // 'yellow' ,'red'
    retry: 0,
  }

  return {
    clusterFailurePercentage: 0,
    hosts: [host],
  }
}

export async function rebootWeaveNetOnHost() {

}

export async function processCluster() {
  const d2cServicesList = await fetchD2CServicesList();
  const weaveNetServicesList = await fetchWeaveNetServiceList();

  const report = await getClusterReport(d2cServicesList, weaveNetServicesList);

  report.clusterFailurePercentage >= 70
    ? await rebootWeaveNetOnHost('self')
    : await Promise.all(report.filter(({ state }) => state === 'red').map(({ name }) => rebootWeaveNetOnHost(name)));
}
