import axios from 'axios';
import fs from 'fs/promises';
import ms from 'ms';
import { D2C } from '../config/config.js';
import { fileExists } from '../utils/file-exists.js';
import { error } from '../utils/throw.js';

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
  if (await fileExists(cacheFileName)) {
    const file = JSON.parse(await fs.readFile(cacheFileName, 'utf8'));
    if (file.expires_at > Date.now()) {
      return file.token;
    }
  }
  const result = await d2cApi.post('/login', {
    email: D2C.USER,
    password: D2C.PASS
  });
  if (!result.data.success) {
    error('D2C API failure: ' + result.data.error);
  }

  const { data: { member: { token } } } = result;

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
    const result = await d2cApi.get('/v1/acc/entities');
    const { data: { result: entities } } = result;
    // cache latest value in case d2c api stops working...
    fallbackEntities = entities;
    return entities
  } catch (e) {
    return fallbackEntities;
  }
}

export const d2cClient = {
  getEntities,
}
