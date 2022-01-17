export class Notifier {
  constructor(channels = [], levels = ['error']) {
    this.channels = channels;
    this.levels = levels;
  }

  write(level, title, payload) {
    if (!this.levels.includes(level)) {
      return;
    }

    Promise.allSettled(this.channels.map(c => c.write(level, title, payload))).then(res => {
      const failed = res.filter((v) => v.status === 'rejected');
      if (failed.length > 0) {
        console.log('Some channels failed to write message', failed);
      }
    });
  }


  debug(title, payload) {
    this.write('debug', title, payload)
  }

  info(title, payload) {
    this.write('info', title, payload)
  }

  error(title, payload) {
    this.write('error', title, payload)
  }
}
