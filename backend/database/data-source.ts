import "reflect-metadata";
import { DataSource } from "typeorm";
import AppConfig from "config/appConfig";
import { PendingTransaction } from "./entity/PendingTransaction";
import { Safe } from "./entity/Safe";
import { SafeMigration } from "./entity/SafeMigration";
import { AppAccount } from "./entity/AppAccount";

const MysqlDataSource = new DataSource({
  type: "mysql",
  host: AppConfig.dbHost,
  port: Number(AppConfig.dbPort),
  username: AppConfig.dbUser,
  password: AppConfig.dbPass,
  database: AppConfig.dbName,
  synchronize: AppConfig.dbSyncronize == "true" ? true : false,
  logging: false,
  entities: [PendingTransaction, Safe, SafeMigration, AppAccount],
  subscribers: [],
  migrations: [],
  connectorPackage: "mysql2",
});

const getDataSource = async () => {
  if (!MysqlDataSource.isInitialized) {
    return await MysqlDataSource.initialize();
  } else {
    await MysqlDataSource.synchronize();
  }

  return MysqlDataSource;
};

export const AppDataSource = {
  getDataSource,
};
