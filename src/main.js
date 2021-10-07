// every 5 minutes
// - fetch all services & hosts from D2C API
// - fetch all hostnames & hosts, registered in weave net
// - compare
//     - If for some host we have more than 80% services unavailable, we consider this host unavailable (should be unavailable 5 time in a row to be considered unhealthy)
//     - If more than 50% of hosts are unavailable, consider cluster manager (this service) unhealthy and reboot the host
// If host considered unhealthy it will be rebooted by cluster manager
import { Notifier } from './notifier/notifier';
import { ConsoleChannel } from './notifier/channels/console-channel';
import { processCluster } from './cluster-manager/cluster-manager';
import ms from 'ms';

export const notifier = new Notifier();
notifier.addChannel(new ConsoleChannel());

setTimeout(async () => {
  try {
    notifier.info('Cluster process start');
    await processCluster();
    notifier.info('Cluster process finish');
  } catch (e) {
    notifier.error('Could not process cluster', e.stack);
  }
}, ms('5m'))

