import algosdk from "algosdk";
import AppConfig from "config/appConfig";

const algodClient = () => {
  let client: algosdk.Algodv2;

  try {
    let token = AppConfig.algoToken;
    let address = AppConfig.algoAddress;
    let port = AppConfig.algoPort;

    switch (AppConfig.defaultLedger) {
      case AppConfig.mainNet:
        // is token json?
        try {
          token = JSON.parse(AppConfig.algoToken_mainnet);
        } catch (e) {
          token = AppConfig.algoToken_mainnet;
        }

        address = AppConfig.algoAddress_mainnet;
        port = AppConfig.algoPort_mainnet;
        break;
      case AppConfig.testNet:
        // is token json?
        try {
          token = JSON.parse(AppConfig.algoToken_testnet);
        } catch (e) {
          token = AppConfig.algoToken_testnet;
        }

        address = AppConfig.algoAddress_testnet;
        port = AppConfig.algoPort_testnet;
        break;
      default:
        break;
    }

    client = new algosdk.Algodv2(token, address, port);
  } catch (err) {
    // console.log("algodClient(): ", err);
  }

  return client!;
};

const getDefaultAlgodCredentials = () => {
  let token = AppConfig.algoToken;
  let address = AppConfig.algoAddress;
  let port = AppConfig.algoPort;

  switch (AppConfig.defaultLedger) {
    case AppConfig.mainNet:
      try {
        token = JSON.parse(AppConfig.algoToken_mainnet);
      } catch (e) {
        token = AppConfig.algoToken_mainnet;
      }

      address = AppConfig.algoAddress_mainnet;
      port = AppConfig.algoPort_mainnet;
      break;
    case AppConfig.testNet:
      try {
        token = JSON.parse(AppConfig.algoToken_testnet);
      } catch (e) {
        token = AppConfig.algoToken_testnet;
      }

      address = AppConfig.algoAddress_testnet;
      port = AppConfig.algoPort_testnet;
      break;
    default:
      break;
  }

  const setting = {
    network: AppConfig.defaultLedger.toLowerCase() || "",
    nodeServer: address || "",
    nodeToken: token || "",
    nodePort: port || "",
  };

  return setting;
};

const indexerClient = () => {
  let client: algosdk.Indexer;

  try {
    let token = AppConfig.indexerToken;
    let address = AppConfig.indexerAddress;
    let port = AppConfig.indexerPort;

    switch (AppConfig.defaultLedger) {
      case AppConfig.mainNet:
        // is token json?
        try {
          token = JSON.parse(AppConfig.indexerToken_mainnet);
        } catch (e) {
          token = AppConfig.indexerToken_mainnet;
        }

        address = AppConfig.indexerAddress_mainnet;
        port = AppConfig.indexerPort_mainnet;
        break;
      case AppConfig.testNet:
        // is token json?
        try {
          token = JSON.parse(AppConfig.indexerToken_testnet);
        } catch (e) {
          token = token = AppConfig.indexerToken_testnet;
        }

        address = AppConfig.indexerAddress_testnet;
        port = AppConfig.indexerPort_testnet;
        break;
      default:
        break;
    }

    client = new algosdk.Indexer(token, address, port);
  } catch (err) {
    // console.log("indexerClient(): ", err);
  }

  return client!;
};

export { algodClient, indexerClient, getDefaultAlgodCredentials };
