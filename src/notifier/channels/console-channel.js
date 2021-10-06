export class ConsoleChannel {
  async write(level, title, payload = '') {
    console.log(`
    -----------------------
    ${new Date().toISOString()}
    [${level}]: ${title}
    
    ${payload}
    -----------------------`)
  }
}
