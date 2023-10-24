import AppConnectorV2 from "frontend/services/safe/appConnectorV2";

interface AppConnectorsContextType {
  appConnectors: Map<string, AppConnectorV2>;
  setAppConnectors: React.Dispatch<React.SetStateAction<Map<string, AppConnectorV2>>>;
}

export default AppConnectorsContextType;
