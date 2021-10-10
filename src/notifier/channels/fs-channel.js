import fs from 'fs/promises';

export class FSChannel {
  async write(level, title, payload) {
    let body = `
-----------------------
${new Date().toISOString()}
[${level}]: ${title}`;

    if (payload) {
      body += '\n' + (typeof payload === 'object' ? JSON.stringify(payload, null, 1) : payload);
    }

    body += '\n-----------------------';

    await fs.appendFile('log.txt', body);
  }
}