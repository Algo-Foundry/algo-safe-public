import { algodClient, indexerClient } from "backend/connection/algorand";
import { Algodv2, Indexer } from "algosdk";
import Algosdk from "algosdk";
import { uitypes } from "shared/constants";
import axios from "axios";
import AppConfig from "config/appConfig";
import PriceService from "../price";
import { Asset } from "shared/interfaces";
import NftService from "../nft";

export default class AccountService {
  static algod: Algodv2 = algodClient();
  static indexer: Indexer = indexerClient();
  static ns: NftService = new NftService();

  static cacheAssets = async (assetDetail: Asset[], assetId: string) => {
    await axios.post(`${AppConfig.appURL}/api/app-account/cacheAssets`, { assetDetail, assetId });
  };

  static getCachedAssetDetail = async (assetId: string) => {
    const assetDetail = await axios.get(`${AppConfig.appURL}/api/app-account/getCachedAssets/${assetId}`);
    return assetDetail;
  };

  static getAccountInfo = async (accountAddresses: string) => {
    return await this.algod.accountInformation(accountAddresses).do();
  };

  static getMinBalance = async (accountAddresses: string) => {
    const accInfo = await this.getAccountInfo(accountAddresses);

    // accInfo.minBalance returns undefined so we will use accInfo["min-balance"] instead
    // @ts-ignore
    const minBalance = Number(accInfo["min-balance"]);
    const algoMinBalance = Algosdk.microalgosToAlgos(minBalance ?? 0); //convert microAlgos to Algos
    return {
      algoMinBalance,
    };
  };

  static lookupAccountAssets = async (accountAddresses: string) => {
    return await this.indexer.lookupAccountAssets(accountAddresses).do();
  };

  static lookupTransaction = async (txnId: string) => {
    return await this.indexer.lookupTransactionByID(txnId).do();
  };

  static getTransactionHistory = async (adr: string) => {
    const assetDetails = new Map<number, object>();
    type TxWithType = {
      txn: Algosdk.Transaction;
      "ui-type": string;
    };

    //subfunction to get asset info
    const getAssetInfo = async (assetID: number, assetsMap: Map<number, object>) => {
      if (assetID === 0 || assetsMap.has(assetID)) return;

      try {
        const newAsset = await AccountService.algod.getAssetByID(assetID).do();
        assetsMap.set(newAsset["index"], newAsset.params);
      } catch (e) {
        // ignore errors
      }
    };

    //subfunction to format txns
    const formatTxns = async (txns: any, assetsMap: Map<number, object>, adr: string) => {
      const txnDetails: TxWithType[] = [];
      for (const txn of txns) {
        switch (txn["tx-type"]) {
          case "pay":
            if (txn["payment-transaction"]["receiver"] === adr || txn["payment-transaction"]["close-remainder-to"] === adr) {
              txnDetails.push({ txn: txn, "ui-type": uitypes.UI_RECEIVE_ASSET });
            } else {
              txnDetails.push({ txn: txn, "ui-type": uitypes.UI_SEND });
            }
            break;
          case "axfer":
            if (txn["asset-transfer-transaction"]["amount"] > 0 && txn["asset-transfer-transaction"]["close-to"] === undefined) {
              if (txn["asset-transfer-transaction"]["receiver"] === adr) {
                txnDetails.push({ txn: txn, "ui-type": uitypes.UI_RECEIVE_ASSET });
              } else {
                txnDetails.push({ txn: txn, "ui-type": uitypes.UI_SEND });
              }
            } else if (
              txn["asset-transfer-transaction"]["close-to"] !== undefined &&
              txn["asset-transfer-transaction"]["close-to"] === adr
            ) {
              txnDetails.push({ txn: txn, "ui-type": uitypes.UI_RECEIVE_ASSET });
            } else if (
              txn["asset-transfer-transaction"]["amount"] === 0 &&
              txn["asset-transfer-transaction"]["close-to"] === undefined
            ) {
              txnDetails.push({ txn: txn, "ui-type": uitypes.UI_NEW_ASSET });
            } else {
              txnDetails.push({ txn: txn, "ui-type": uitypes.UI_REMOVE_ASSET });
            }
            await getAssetInfo(txn["asset-transfer-transaction"]["asset-id"], assetsMap);
            break;
          case "appl":
            for (const asset of txn["application-transaction"]["foreign-assets"]) {
              await getAssetInfo(asset, assetsMap);
            }
            if (txn["inner-txns"] !== undefined) {
              //recursive loop for "appl" txns
              const formattedTxns = await formatTxns(txn["inner-txns"], assetsMap, adr);
              txn["inner-txns"] = formattedTxns;
            }
            txnDetails.push({ txn: txn, "ui-type": uitypes.UI_APP_CALL });
            break;
          case "afrz":
            txnDetails.push({ txn: txn, "ui-type": uitypes.UI_OTHERS });
            await getAssetInfo(txn["asset-freeze-transaction"]["asset-id"], assetsMap);
            break;
          case "acfg":
            txnDetails.push({ txn: txn, "ui-type": uitypes.UI_OTHERS });
            if (txn["asset-config-transaction"]["asset-id"] === 0) {
              await getAssetInfo(txn["created-asset-index"], assetsMap);
            } else {
              await getAssetInfo(txn["asset-config-transaction"]["asset-id"], assetsMap);
            }
            break;
          default:
            txnDetails.push({ txn: txn, "ui-type": uitypes.UI_OTHERS });
            break;
        }
      }

      return txnDetails;
    };

    const { transactions } = await AccountService.indexer.searchForTransactions().address(adr).limit(200).do();

    let txnDetails: TxWithType[] = [];
    if (transactions.length !== 0) {
      txnDetails = await formatTxns(transactions, assetDetails, adr);
    }

    return { Transactions: txnDetails, Assets: assetDetails };
  };

  static fetchAssetBalances = async (
    address: string,
    setTotalAssetCountMessage?: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const { assets } = await AccountService.lookupAccountAssets(address);
    // safe algos in usd
    const safeAcc = await AccountService.algod.accountInformation(address).do();
    const totalMicroAlgos = safeAcc.amount as number;

    // get verified asset
    const { data } = await axios.get(`${AppConfig.appURL}/api/verified-assets`);
    const assetMap = new Map();
    for (const asset of data.data) {
      assetMap.set(asset.asset_id, asset);
    }

    // get asset price
    const getPrices = await PriceService.getAssetPrices(assets);

    const priceAlgos = getPrices.get("algorand");

    // get set intial account value in USD
    let accountValue = (totalMicroAlgos / 1e6) * priceAlgos;

    // create asset for Algo token (do not use send asset txn for this)
    const algoAsset: Asset = {
      id: 0,
      decimals: 6,
      "default-frozen": false,
      name: "ALGO",
      "name-b64": "QUxHTw==",
      total: 0,
      "unit-name": "ALGO",
      "unit-name-b64": "QUxHTw==",
      value: accountValue,
      balance: totalMicroAlgos,
      url: "",
      price: Number(priceAlgos),
      isVerified: true,
      imgUrl: "/images/assets-icons/ALGO.svg",
    };

    //check available image
    const checkImage = async (assetId: string) => {
      const _checkImgUrl = `${AppConfig.appURL}/api/check-image?asset_id=${assetId}`;
      if (AppConfig.isMainNet()) {
        const { data } = await axios.get(_checkImgUrl);
        const isImage = data.data;
        return isImage;
      }
      return false;
    };

    //initial variables
    const imageUrl = "/images/assets-icons/CUSTOM.svg";
    const fullAssetDetails: Asset[] = [];
    const tokens: Asset[] = [];
    const nfts: Asset[] = [];
    if (assets !== undefined) {
      let loadedAssetCount = 1;
      for (const a of assets) {
        const cachedAssetDetailResponse = await AccountService.getCachedAssetDetail(a["asset-id"]);
        const message = loadedAssetCount.toString() + " / " + assets.length;
        if (setTotalAssetCountMessage) setTotalAssetCountMessage(message);
        loadedAssetCount += 1;
        const cachedAssetDetail = cachedAssetDetailResponse.data.data;
        if (cachedAssetDetail) {
          const assetDetails = cachedAssetDetail.assetDetail;

          // check if image is available
          const _checkImg = await checkImage(assetDetails.id);
          const _imgTemp = `https://assets.algoexplorer.io/asset-logo-${assetDetails.id}.image`;
          assetDetails.imgUrl = _checkImg ? _imgTemp : imageUrl;

          // get price
          const unitName = assetDetails["unit-name"]?.toLowerCase() || "";
          const _getPrice = getPrices.has(unitName) && unitName ? getPrices.get(unitName) : 0;
          assetDetails.price = _getPrice;

          assetDetails.isVerified = assetMap.has(assetDetails.id);
          assetDetails.balance = a["amount"];
          // Check if asset is NFT
          if (assetDetails && assetDetails.url && assetDetails.url.includes("ipfs://")) {
            nfts.push(assetDetails);
          } else {
            // update total account value in USD
            if (assetDetails["unit-name"] !== undefined) {
              const assetValue = (assetDetails.balance / Math.pow(10, assetDetails.decimals ?? 6)) * _getPrice;
              assetDetails.value = assetValue;
              accountValue += assetValue;
            }
            tokens.push(assetDetails);
          }

          fullAssetDetails.push(assetDetails);
          continue;
        }

        // No cached asset detail
        try {
          const asset = await AccountService.algod.getAssetByID(a["asset-id"]).do();

          if (asset === undefined) continue;

          // get price
          const _unitName = asset.params["unit-name"]?.toLowerCase() || "";
          const _getPrice = getPrices.has(_unitName) ? getPrices.get(_unitName) : 0;

          // fetch pricing for asset
          let assetValue: any;
          let isNft = false;
          if (asset.params.url && asset.params.url.includes("ipfs://")) {
            assetValue = 0;
            isNft = true;
          } else {
            const assetValue = (a["amount"] / Math.pow(10, asset.params.decimals ?? 6)) * _getPrice;
            accountValue += assetValue;
          }

          // check if image is available
          const _checkImg = await checkImage(a["asset-id"]);
          const _imgTemp = `https://assets.algoexplorer.io/asset-logo-${a["asset-id"]}.image`;
          const _imgUrl = _checkImg ? _imgTemp : imageUrl;

          let assetBalanceData = {
            id: a["asset-id"],
            ...asset.params,
            value: assetValue,
            balance: a["amount"],
            price: _getPrice,
            isVerified: assetMap.has(a["asset-id"]),
            imgUrl: _imgUrl,
          };

          fullAssetDetails.push(assetBalanceData);
          // assume assets with content are NFTs
          if (isNft) {
            if (assetBalanceData.id === 0) nfts.push(assetBalanceData);
            assetBalanceData = await AccountService.ns.formatNft(assetBalanceData.id, assetBalanceData);
            nfts.push(assetBalanceData);
          } else {
            tokens.push(assetBalanceData);
          }
          // cache asset details here
          await AccountService.cacheAssets(assetBalanceData, a["asset-id"]);
        } catch (e) {
          // ignore assets that are destroyed / do not exist
          continue;
        }
      }
    }

    // add algo asset
    fullAssetDetails.push(algoAsset);
    tokens.push(algoAsset);

    return {
      assets: fullAssetDetails,
      accountValue,
      tokens,
      nfts,
    };
  };
}
