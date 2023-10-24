import path from "path";

class AppConfig {
  static mainNet = "MainNet";
  static testNet = "TestNet";
  static sandNet = "SandNet";

  static development = "development";
  static staging = "staging";
  static production = "production";

  // Redis envar
  static redisHost?: string = process.env.REDIS_HOST;
  static redisPort: string = process.env.REDIS_PORT || "6379";
  static redisFamily: string = process.env.REDIS_FAMILY || "4";
  static redisPassword?: string = process.env.REDIS_PASSWORD;

  // Other
  static rootPath: string = path.resolve(__dirname, "../");
  static appEnv: string = process.env.APP_ENV || "development";
  static allowedOrigins?: string = process.env.ALLOWED_ORIGINS;
  static appURL?: string = process.env.NEXT_PUBLIC_APP_URL;
  static expiryDays?: string = process.env.NEXT_PUBLIC_EXPIRY_DAYS || "30";

  // Database envar
  static dbConnection?: string = process.env.TYPEORM_CONNECTION;
  static dbHost?: string = process.env.TYPEORM_HOST;
  static dbPort: string = process.env.TYPEORM_PORT || "3306";
  static dbUser?: string = process.env.TYPEORM_USERNAME;
  static dbPass?: string = process.env.TYPEORM_PASSWORD;
  static dbName?: string = process.env.TYPEORM_DATABASE;
  static dbSyncronize: string = process.env.TYPEORM_SYNCHRONIZE || "true";
  static dbEntities?: string = process.env.TYPEORM_ENTITIES;

  // Algo envar
  static algoAddress: string = process.env.NEXT_PUBLIC_ALGOD_ADDRESS || "";
  static algoPort?: string = process.env.NEXT_PUBLIC_ALGOD_PORT;
  static algoToken: string = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  static algoAddress_testnet: string = process.env.NEXT_PUBLIC_ALGOD_ADDRESS_TESTNET || "";
  static algoPort_testnet: string = process.env.NEXT_PUBLIC_ALGOD_PORT_TESTNET || "";
  static algoToken_testnet: string = process.env.NEXT_PUBLIC_ALGOD_TOKEN_TESTNET || "";
  static algoAddress_mainnet: string = process.env.NEXT_PUBLIC_ALGOD_ADDRESS_MAINNET || "";
  static algoPort_mainnet: string = process.env.NEXT_PUBLIC_ALGOD_PORT_MAINNET || "";
  static algoToken_mainnet: string = process.env.NEXT_PUBLIC_ALGOD_TOKEN_MAINNET || "";

  // Indexer envar
  static indexerAddress?: string = process.env.NEXT_PUBLIC_INDEXER_ADDRESS;
  static indexerPort?: string = process.env.NEXT_PUBLIC_INDEXER_PORT;
  static indexerToken: string = process.env.NEXT_PUBLIC_INDEXER_TOKEN || "";
  static indexerAddress_testnet?: string = process.env.NEXT_PUBLIC_INDEXER_ADDRESS_TESTNET;
  static indexerPort_testnet: string = process.env.NEXT_PUBLIC_INDEXER_PORT_TESTNET || "";
  static indexerToken_testnet: string = process.env.NEXT_PUBLIC_INDEXER_TOKEN_TESTNET || "";
  static indexerAddress_mainnet?: string = process.env.NEXT_PUBLIC_INDEXER_ADDRESS_MAINNET;
  static indexerPort_mainnet: string = process.env.NEXT_PUBLIC_INDEXER_PORT_MAINNET || "";
  static indexerToken_mainnet: string = process.env.NEXT_PUBLIC_INDEXER_TOKEN_MAINNET || "";

  // Algod other
  static creatorMnemonic: string = process.env.CREATOR_MNEMONIC || "";
  static defaultLedger: string = process.env.NEXT_PUBLIC_DEFAULT_LEDGER || "SandNet";

  static isMainNet = () => this.defaultLedger === this.mainNet;
  static isTestNet = () => this.defaultLedger === this.testNet;
  static isSandNet = () => this.defaultLedger === this.sandNet;

  static isDevelopment = () => this.appEnv === this.development;
  static isStaging = () => this.appEnv === this.staging;
  static isProduction = () => this.appEnv === this.production;

  // Safe service
  static foundrySafeIdentifier?: string = process.env.NEXT_PUBLIC_FOUNDRY_SAFE_IDENTIFIER;
  static masterId = Number(process.env.NEXT_PUBLIC_FOUNDRY_MASTER_SAFE_APP_ID);
  static treasuryFee = Number(process.env.NEXT_PUBLIC_FOUNDRY_SAFE_CREATE_FEE);
  static minBalance = Number(process.env.NEXT_PUBLIC_FOUNDRY_SAFE_MIN_BALANCE);

  static safeApproval: string = process.env.NEXT_PUBLIC_SAFE_APPROVAL || "";
  static clearProg: string = process.env.NEXT_PUBLIC_CLEAR_PROG || "";

  static lsigTemplate: string = process.env.NEXT_PUBLIC_LSIG_TEMPLATE || "";

  static nfdUrlLookup: string = process.env.NEXT_PUBLIC_NFD_URL_LOOKUP || "";
  static nfdUrlLookup_testnet: string = process.env.NEXT_PUBLIC_NFD_URL_LOOKUP_TESTNET || "";

  static maxPtxn: number = Number(process.env.NEXT_PUBLIC_MAX_PTXN) || 21;
  static maxPtxnPerOwner: number = Number(process.env.NEXT_PUBLIC_MAX_PTXN_PER_OWNER) || 10;

  static masterHash: string = process.env.MASTER_HASH || "";
  static secretKey: string = process.env.SIGNATURE_SECRET_KEY || "";

  static safeGlobalStateUint = 6;
  static safeGlobalStateByteSlice = 58;
  static createSafeMinBalanceRequirement: number =
    100000 * 2 + 28500 * this.safeGlobalStateUint + 50000 * this.safeGlobalStateByteSlice;
  static optInSafeMinBalanceRequirement: number = 100000 + (25000 + 3500);

  // Hotjar
  static HJID = Number(process.env.NEXT_PUBLIC_HJID);
  static HJSV = Number(process.env.NEXT_PUBLIC_HJSV);

  // Discord Reimbursement Webhook
  static discordReimbursementWebhook?: string = process.env.NEXT_PUBLIC_DISCORD_REIMBURSEMENT_WEBHOOK;

  // Old safe check
  static safeMigrateCheck?: number = Number(process.env.NEXT_PUBLIC_SAFE_MIGRATE_CHECK);

  // Ipfs Url Gateway
  static ipfsUrlGateway: string = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "";

  //contact us mail setting
  static mailService: string = process.env.NEXT_PUBLIC_MAIL_SERVICE || "";
  static mailUser: string = process.env.NEXT_PUBLIC_MAIL_USER || "";
  static mailPassword: string = process.env.NEXT_PUBLIC_MAIL_PASS || "";
  static mailFrom: string = process.env.NEXT_PUBLIC_MAIL_FROM || "";
  static mailTo: string = process.env.NEXT_PUBLIC_MAIL_TO || "";
  static mailSubject: string = process.env.NEXT_PUBLIC_MAIL_SUBJECT || "";
}

export default AppConfig;
