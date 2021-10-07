import axios from 'axios';
import fs from 'fs/promises';
import ms from 'ms';
import { D2C } from '../config';

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
  const { data: { member: { token } } } = await d2cApi.post('/login', {
    email: D2C.USER,
    password: D2C.PASS
  });
  await fs.writeFile(cacheFileName, JSON.stringify({
    token,
    // assume token valid for 3 hours
    expires_at: Date.now() + ms('3h')
  }));

  return token;
}

let fallbackEntities = null;

async function getEntities() {
  try {
    const { data: { result } } = d2cApi.get('/v1/acc/entities');
    // cache latest value in case d2c api stops working...
    fallbackEntities = result;
    return result
  } catch (e) {
    return fallbackEntities;
  }
}

export const d2cClient = {
  getEntities,
}
