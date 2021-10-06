import axios from 'axios';
import fs from 'fs/promises';
import ms from 'ms';

const d2cApi = axios.create({
  baseURL: 'https://api.d2c.io',
  headers: {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
    "Content-Type": "application/json;charset=utf-8"
  }
});

d2cApi.interceptors.request.use(async config => {
  if (config.url === '/login') {
    return config;
  }
  const token = await getToken();
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

async function getToken() {
  const cacheFileName = '.d2c-auth-cache.json';
  if (fs.existsSync(cacheFileName)) {
    const file = JSON.parse(await fs.readFile(cacheFileName, 'utf8'));
    if (file.expires_at > Date.now()) {
      return file.token;
    }
  }
  const {data: {member: {token}}} = await d2cApi.post('/login', {
    email: process.env.D2C_EMAIL,
    password: process.env.D2C_PASSWORD
  });
  await fs.writeFile(cacheFileName, JSON.stringify({
    token,
    // assume token valid for 3 hours
    expires_at: Date.now() + ms('3h')
  }));

  return token;
}

async function getEntities() {
  return d2cApi.get('/v1/acc/entities').then(({data}) => data.result);
}

export const d2cClient = {
  getEntities,
}
