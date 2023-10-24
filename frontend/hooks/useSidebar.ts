import { useCallback, useContext, useEffect } from "react";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import axios from "axios";
import AppConfig from "config/appConfig";
import { SidebarAccountsContext } from "frontend/services/provider/sidebarAccounts.context";
import { sidebar } from "shared/constants";
import { useAppDispatch } from "frontend/redux/hooks";
import { setSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { SidebarAccountsContextType } from "shared/interfaces";

const useSidebar = () => {
  // functions related to updating sidebar
  const { sidebarAccounts, setSidebarAccounts, sidebarLedgers, selected, setSelected } = useContext(
    SidebarAccountsContext
  ) as SidebarAccountsContextType;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setSelectedAccount(selected));
  }, [JSON.stringify(selected)]);

  const clearSelected = useCallback(() => {
    if (selected && "appId" in selected) {
      dispatch(setSelectedSafe({}));
    }

    localStorage.removeItem(sidebar.SELECTED_SIDEBAR_ACCOUNT);
    setSelected(null);
    dispatch(setSelectedAccount(null));
  }, []);

  const saveList = useCallback(async (accounts: SidebarAccount[], address?: string) => {
    // replace duplicates with latest additions
    const seen = new Map();
    const filtered: SidebarAccount[] = [];
    accounts.forEach((acc, index) => {
      if (!seen.has(acc.address)) {
        filtered.push(acc);
        seen.set(acc.address, index);
      } else {
        filtered[seen.get(acc.address)] = acc;
      }
    });

    setSidebarAccounts(filtered);

    if (address !== undefined) {
      await axios.post(`${AppConfig.appURL}/api/app-account/save`, { address, accounts: filtered });
    } else {
      localStorage.setItem(sidebar.SIDEBAR_ACCOUNTS, JSON.stringify(filtered));
    }
  }, []);

  const getList = useCallback(async (address?: string) => {
    if (address !== undefined) {
      const { data } = await axios.get(`${AppConfig.appURL}/api/app-account/${address}`);
      data.data !== null ? setSidebarAccounts(data.data.accounts) : setSidebarAccounts([]);
      return data.data !== null ? data.data.accounts : [];
    } else {
      const appAccountsData = localStorage.getItem(sidebar.SIDEBAR_ACCOUNTS);

      if (!appAccountsData) {
        setSidebarAccounts([]);
        return [];
      }
      try {
        setSidebarAccounts(JSON.parse(appAccountsData));
        return JSON.parse(appAccountsData);
      } catch (e) {
        setSidebarAccounts([]);
        return [];
      }
    }
  }, []);

  const removeItem = useCallback(
    async (removeAddress: string, activeAddress?: string) => {
      // if (removeAddress === selected?.address) {
      //   clearSelected();
      // }
      const remainingAccounts = sidebarAccounts.filter((account: SidebarAccount) => account.address !== removeAddress);
      if (activeAddress) {
        await saveList(remainingAccounts, activeAddress);
      } else {
        await saveList(remainingAccounts);
      }
    },
    [selected, sidebarAccounts]
  );

  const renameLedger = useCallback(
    async (accounts: SidebarAccount[], ledgerAddress: string, newName: string, activeAddress?: string) => {
      const renameAccount = accounts.map((account: SidebarAccount) => {
        if (account.address === ledgerAddress) {
          return { ...account, name: newName };
        }
        return account;
      });

      if (activeAddress) {
        await saveList(renameAccount, activeAddress);
      } else {
        await saveList(renameAccount);
      }
    },
    []
  );

  const mergeSidebarAccounts = useCallback(async (address: string) => {
    // merge db sidebar accounts with sidebar accounts in localstorage
    const dbSidebarAccs = await getList(address);

    let lsSidebarAccs: SidebarAccount[] = [];
    try {
      lsSidebarAccs = JSON.parse(localStorage.getItem(sidebar.SIDEBAR_ACCOUNTS) || "");
    } catch (e) {
      // do nothing
    }

    if (lsSidebarAccs.length > 0) {
      const sidebarAccs = [...dbSidebarAccs, ...lsSidebarAccs];
      await saveList(sidebarAccs, address);

      // remove sidebar accounts in localstorage after merging
      localStorage.removeItem(sidebar.SIDEBAR_ACCOUNTS);
    }
  }, []);

  const setSidebarAccount = useCallback((selected: SidebarAccount) => {
    localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(selected));
    setSelected(selected);
  }, []);

  return {
    saveList,
    getList,
    sidebarAccounts,
    sidebarLedgers,
    selected,
    removeItem,
    renameLedger,
    mergeSidebarAccounts,
    setSidebarAccount,
    clearSelected,
  };
};

export default useSidebar;
