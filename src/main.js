// every 5 minutes
// - fetch all services & hosts from D2C API
// - fetch all hostnames & hosts, registered in weave net
// - compare
//     - If for some host we have more than 80% services unavailable, we consider this host unavailable (should be unavailable 5 time in a row to be considered unhealthy)
//     - If more than 50% of hosts are unavailable, consider cluster manager (this service) unhealthy and reboot the host
// If host considered unhealthy it will be rebooted by cluster manager
import { Notifier } from './notifier/notifier.js';
import { ConsoleChannel } from './notifier/channels/console-channel.js';
import { processCluster } from './cluster-manager/cluster-manager.js';
import ms from 'ms';
import { DEV } from './config/config.js';
import { FSChannel } from './notifier/channels/fs-channel.js';

export const notifier = new Notifier();
notifier.addChannel(!DEV ? new ConsoleChannel() : new FSChannel());

async function main() {
  try {
    notifier.info('Cluster process start');
    await processCluster();
    notifier.info('Cluster process finish');
  } catch (e) {
    notifier.error('Could not process cluster', e.stack);
  }
}

await main();

if (!DEV) {
  setInterval(async () => main(), ms('5m'));
}

