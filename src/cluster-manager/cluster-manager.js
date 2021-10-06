import { d2cClient } from '../apis/d2c-client';

const hostsToMonitor = [
  'hetzner-first',
  'hetzner-catalog',
  'accounting-nr',
  'do-sfo-01',
  'hetzner-03',
];

export async function fetchD2CServicesList() {
  const { hosts, containers } = await d2cClient.getEntities();
}

export async function fetchWeaveNetServiceList() {

}

export async function getClusterReport(d2cServices, weaveNetServices) {

}

export async function rebootWeaveNetOnHost() {

}

export async function processCluster() {
  const d2cServicesList = await fetchD2CServicesList();
  const weaveNetServicesList = await fetchWeaveNetServiceList();

  const report = await getClusterReport();

  report.clusterFailurePercentage >= 70
    ? await rebootWeaveNetOnHost('self')
    : await Promise.all(report.filter(({state}) => state === 'red').map(({ name }) => rebootWeaveNetOnHost(name)));
}
