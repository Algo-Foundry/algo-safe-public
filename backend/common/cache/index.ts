import { redis } from "backend/connection/redis";

const get = async (key: string): Promise<null> => {
  const value = await redis.get(key);
  if (value === null) return null;
  return JSON.parse(value);
};

const set = async <T>(key: string, fetcher: () => T, expires: number) => {
  const value = await fetcher();
  await redis.set(key, JSON.stringify(value), "EX", expires);
  return value;
};

const fetch = async <T>(key: string, fetcher: () => T, expires: number) => {
  const existing = await get(key);
  if (existing !== null) return existing;
  return set(key, fetcher, expires);
};

const setWithNoExpires = async <T>(key: string, fetcher: () => T) => {
  const value = await fetcher();
  await redis.set(key, JSON.stringify(value));
  return value;
};

const del = async (key: string) => {
  await redis.del(key);
};

export default { fetch, set, get, del, setWithNoExpires };
