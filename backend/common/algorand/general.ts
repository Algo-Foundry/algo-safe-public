import algosdk from "algosdk";
import { decodeString } from "shared/utils";
import { stateData, localStateData } from "./types";

const getAsset = async (client: algosdk.Algodv2, appIndex: number) => {
  const asset = client.getAssetByID(appIndex).do();

  return asset;
};

const getEntireGlobalState = async (client: algosdk.Algodv2, appIndex: number) => {
  return new Promise<Map<string, stateData>>((resolve, reject) => {
    client
      .getApplicationByID(appIndex)
      .do()
      .then((res) => {
        const app = res as algosdk.modelsv2.Application;
        if (!Object.keys(app.params).includes("global-state")) {
          reject("missing-global-state");
        }

        // create hashmap
        const gsmap = new Map<string, stateData>();

        // @ts-ignore
        const states = app.params["global-state"] || [];
        states.forEach((state: any) => {
          const stateKey = decodeString(state.key);

          let formattedValue;
          if (state.value.type === 1) {
            // decode bytes to get string value
            formattedValue = decodeString(state.value.bytes);
          } else {
            formattedValue = state.value.uint as number;
          }

          gsmap.set(stateKey, {
            key: stateKey,
            rawValue: state.value,
            formattedValue,
          });
        });

        resolve(gsmap);
      })
      .catch((err) => reject(err));
  });
};

const formatLocalState = (rawLS: any) => {
  const formattedLocalState: localStateData[] = rawLS.map((appinfo: any) => {
    // create hashmap
    const lsmap = new Map<string, stateData>();
    const appLocalState = appinfo["key-value"]?.map((state: any) => {
      const stateKey = decodeString(state.key);

      let formattedValue;
      if (state.value.type === 1) {
        // decode bytes to get string value
        formattedValue = decodeString(state.value.bytes);
      } else {
        formattedValue = state.value.uint as number;
      }

      lsmap.set(stateKey, {
        key: stateKey,
        rawValue: state.value,
        formattedValue,
      });

      return lsmap;
    });

    return {
      id: appinfo.id,
      localState: appLocalState,
    };
  });

  return formattedLocalState;
};

const getAccountLocalState = async (client: algosdk.Algodv2, accAddr: string) => {
  return new Promise<localStateData[]>((resolve, reject) => {
    client
      .accountInformation(accAddr)
      .do()
      .then((res) => {
        const acc = res as algosdk.modelsv2.Account;
        // @ts-ignore
        const appLocalStates = acc["apps-local-state"];

        const formattedLocalState = formatLocalState(appLocalStates);

        resolve(formattedLocalState);
      })
      .catch((err) => reject(err));
  });
};

export { getEntireGlobalState, getAccountLocalState, getAsset, formatLocalState };
