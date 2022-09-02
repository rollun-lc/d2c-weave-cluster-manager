import { Notifier } from './src/notifier/notifier.js';
import { ConsoleChannel } from './src/notifier/channels/console-channel.js';
import { processCluster } from './src/cluster-manager/cluster-manager.js';
import ms from 'ms';
import { DEV } from './src/config/config.js';
import { FSChannel } from './src/notifier/channels/fs-channel.js';

export const notifier = DEV
  ? new Notifier([new ConsoleChannel()], ['debug', 'info', 'error'])
  : new Notifier([new FSChannel()], ['debug', 'info', 'error']);

async function main() {
  try {
    notifier.debug('Cluster process start');
    await processCluster();
    notifier.debug('Cluster process finish');
  } catch (e) {
    notifier.error('Could not process cluster', e.stack);
  }
}

await main();

if (!DEV) {
  setInterval(async () => main(), ms('5m'));
}

