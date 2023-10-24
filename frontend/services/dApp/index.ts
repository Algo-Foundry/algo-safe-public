import AppConnectorV2 from "../safe/appConnectorV2";

export default class DappService {
  static getConnectedDapp = async (appConnector: AppConnectorV2, wc_id: string) => {
    const connectedV2Dapps = appConnector.getConnectedDapps();
    const connectedV1Dapps = appConnector.getConnectedV1Dapps();

    const v2Dapp = connectedV2Dapps.find((item) => item.topic === wc_id);
    const v1Dapp = connectedV1Dapps.find((item) => item.uid === wc_id);

    if (!v2Dapp && !v1Dapp) return null;

    if (v2Dapp) {
      return v2Dapp;
    }

    return v1Dapp;
  };
}
