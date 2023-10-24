import React, { createContext, useState, ReactNode } from "react";
import { AppConnectorsContextType } from "shared/interfaces";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";

export const AppConnectorsContext = createContext<AppConnectorsContextType | null>(null);

interface AppConnectorProviderProps {
  children: ReactNode;
}

export const AppConnectorProvider: React.FC<AppConnectorProviderProps> = ({ children }) => {
  const [appConnectors, setAppConnectors] = useState<Map<string, AppConnectorV2>>(new Map<string, AppConnectorV2>([]));

  return <AppConnectorsContext.Provider value={{ appConnectors, setAppConnectors }}>{children}</AppConnectorsContext.Provider>;
};
