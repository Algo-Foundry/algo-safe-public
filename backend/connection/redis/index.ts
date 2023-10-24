import AppConfig from "config/appConfig";
import Redis from "ioredis";

export const redis = new Redis({
  port: parseInt(AppConfig.redisPort),
  host: AppConfig.redisHost,
  family: parseInt(AppConfig.redisFamily),
  password: AppConfig.redisPassword,
});
