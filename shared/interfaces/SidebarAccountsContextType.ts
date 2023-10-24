import SidebarAccount from "./SidebarAccount";

interface SidebarAccountsContextType {
  sidebarAccounts: SidebarAccount[];
  setSidebarAccounts: React.Dispatch<React.SetStateAction<SidebarAccount[]>>;
  sidebarLedgers: SidebarAccount[];
  setSidebarLedgers: React.Dispatch<React.SetStateAction<SidebarAccount[]>>;
  selected: SidebarAccount | null;
  setSelected: React.Dispatch<React.SetStateAction<SidebarAccount | null>>;
}

export default SidebarAccountsContextType;
