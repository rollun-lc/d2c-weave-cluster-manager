import execa from 'execa';
import { DEV } from '../config/config.js';
import { notifier } from '../../main.js';

async function getPeersList() {
  notifier.info('fetch weave peers');
  const args = DEV ? ['ssh', ['hetzner-04', 'weave', 'status', 'peers']] : ['weave', ['status', 'peers']];
  const { stdout: peersConnections } = await execa(...args);

  return [...new Set(peersConnections.trim().match(/([0-9a-f:]{17})\((.+)\)/gi))]
    .map(s => {
      const [, macAddr, name] = s.match(/^([0-9a-f:]{17})\((.+)\)$/i);
      return { macAddr, name }
    });
}

async function getDNSEntriesList() {
  notifier.info('fetch dns entries');
  const args = DEV ? ['ssh', ['hetzner-04', 'weave', 'status', 'dns']] : ['weave', ['status', 'dns']];
  const { stdout: dnsList } = await execa(...args);

  return dnsList
    .trim()
    .split('\n')
    .map(s => {
      const [name, /* ip */, /* containerId */, hostMacAddr] = s.split(/\s+/);

      return { name: name.replace(/-[0-9]$/, ''), hostMacAddr };
    })
    // leave only unique
    .filter(({ name: _name }, idx, arr) => arr.findIndex(({ name }) => _name === name) === idx);
}

export const weaveClient = {
  getPeersList,
  getDNSEntriesList,
};
