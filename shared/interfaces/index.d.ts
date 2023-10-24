export { default as Asset } from "./Asset";
export { default as PendingTxn } from "./PendingTxn";
export { default as Safe } from "./Safe";
export { default as TransactionBuilder } from "./TransactionBuilder";
export { default as Dapp } from "./Dapp";
export { default as Vote } from "./Vote";
export { default as DeleteRequest } from "./DeleteRequest";
export { default as UrgentRequest } from "./UrgentRequest";
export { default as ParsedPayload } from "./ParsedPayload";
export { default as LedgerAccount } from "./LedgerAccount";
export { default as SidebarAccount } from "./SidebarAccount";
export { default as DappRequest } from "./DappRequest";
export { default as AccountWithNFD } from "./AccountWithNFD";
export { default as SafeOwner } from "./SafeOwner";
export { default as DappTxn } from "./DappTxn";
export { default as SidebarAccountsContextType } from "./SidebarAccountsContextType";
export { default as AppConnectorsContextType } from "./AppConnectorsContextType";

export interface MenuItemDashboard {
  title: string;
  icon: string;
  link: string;
  child?: Array<MenuItemDashboard>;
  customActiveStyle?: Record<string, string>;
}

export interface txIds {
  // Safe Creation
  safeCreation: string;
  safeID: number;
  address?: string;
  // Safe Init - 4 atomix txs
  initGroup: string;
  creationFee: string;
  topUp: string;
  optin: string;
  initAppCall: string;
}
