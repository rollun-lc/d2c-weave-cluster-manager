export class Notifier {
  constructor(channels = []) {
    this.channels = channels;
  }

  write(level, title, payload) {
    Promise.allSettled(this.channels.map(c => c.write(level, title, payload))).then(res => {
      const failed = res.filter((v) => v.status === 'rejected');
      if (failed.length > 0) {
        console.log('Some channels failed to write message', failed);
      }
    });
  }

  info(title, payload) {
    this.write('info', title, payload)
  }

  error(title, payload) {
    this.write('info', title, payload)
  }

  addChannel(channel) {
    if (this.channels.some(c => c === channel)) {
      return console.warn('channel already added');
    }
    this.channels.push(channel);
  }

  removeChannel(channel) {
    this.channels = this.channels.filter(c => c !== channel);
  }
}
