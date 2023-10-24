import { algodClient, indexerClient } from "backend/connection/algorand";
import { Algodv2, Indexer } from "algosdk";
import axios from "axios";
import AppConfig from "config/appConfig";
import AccountService from "../account";

export default class PriceService {
  static algod: Algodv2 = algodClient();
  static indexer: Indexer = indexerClient();

  static fetchPrices = async (unitName: string) => {
    // fetch asset prices from coingecko
    try {
      const { data } = await axios.get(`${AppConfig.appURL}/api/fetch-price?ids=${unitName}`);
      return data.data;
    } catch (e) {
      return 0;
    }
  };

  static getCoinList = async () => {
    const { data } = await axios.get(`${AppConfig.appURL}/api/coin-list`);
    return data.data;
  };

  static getAssetPrices = async (assets: { "asset-id": number }[]) => {
    //get coin list
    const getCoinList = await this.getCoinList();
    const coinList = new Map();
    for (const coin of getCoinList) {
      coinList.set(coin.symbol.toLowerCase(), coin);
    }

    //get asset price
    const ids = ["algorand"];
    const unitNames = new Map();

    //get ids and unit names
    for (const a of assets) {
      const cachedAssetDetailResponse = await AccountService.getCachedAssetDetail(a["asset-id"] as unknown as string);
      const cachedAssetDetail = cachedAssetDetailResponse.data.data;
      if (cachedAssetDetail && cachedAssetDetail.assetDetail["unit-name"]) {
        const _ids = coinList.get(cachedAssetDetail.assetDetail["unit-name"].toLowerCase())?.id;
        if (_ids) {
          unitNames.set(_ids, cachedAssetDetail.assetDetail["unit-name"].toLowerCase());
          ids.push(_ids);
        }
        continue;
      }

      try {
        const asset = await this.algod.getAssetByID(a["asset-id"]).do();
        if (asset === undefined) continue;

        //lowercase unit name
        const _ids = coinList.get(asset.params["unit-name"].toLowerCase())?.id;
        if (_ids) {
          unitNames.set(_ids, asset.params["unit-name"].toLowerCase());
          ids.push(_ids);
        }
      } catch (error) {
        continue;
      }
    }
    const resIds = ids.join(",");

    //map prices
    const _getPrices = await this.fetchPrices(resIds);
    const _prices = new Map();
    for (const item in _getPrices) {
      if (item === "algorand") {
        _prices.set(item, _getPrices[item].usd);
        continue;
      }

      if (unitNames.has(item)) {
        const priceData = _getPrices[item].usd;
        _prices.set(unitNames.get(item), priceData);
      }
    }

    return _prices;
  };
}
