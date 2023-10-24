import { useContext, useCallback } from "react";
import { AppConnectorsContext } from "frontend/services/provider/appConnectors.context";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import AppConnectorsContextType from "shared/interfaces/AppConnectorsContextType";

const useAppConnectors = () => {
  const { appConnectors, setAppConnectors } = useContext(AppConnectorsContext) as AppConnectorsContextType;

  const initConnectorForAccount = useCallback(async (selectedAccount: SidebarAccount) => {
    const apMap = new Map<string, AppConnectorV2>(appConnectors);
    let connector = apMap.get(selectedAccount.address);

    if (connector === undefined) {
      connector = new AppConnectorV2(selectedAccount);
      await connector.init();
    }

    apMap.set(selectedAccount.address, connector);

    setAppConnectors(apMap);
    return connector;
  }, []);

  return { initConnectorForAccount, appConnectors, setAppConnectors };
};

export default useAppConnectors;
