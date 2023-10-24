import React, { createContext, useState, useEffect, useRef, ReactNode } from "react";
import { sidebar } from "shared/constants";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import { useAppDispatch } from "frontend/redux/hooks";
import { setSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import SafeService from "../safe";
import { Account, useWallet } from "@txnlab/use-wallet";
import { setSigner, setAvailableSigners } from "frontend/redux/features/safe/safeSlice";
import { setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { LedgerAccount, SidebarAccount, SidebarAccountsContextType } from "shared/interfaces";

export const SidebarAccountsContext = createContext<SidebarAccountsContextType | null>(null);

const ss = new SafeService();

interface SidebarAccountProviderProps {
  children: ReactNode;
}

export const SidebarAccountProvider: React.FC<SidebarAccountProviderProps> = ({ children }) => {
  const { activeAccount, isReady } = useWallet();
  const [sidebarAccounts, setSidebarAccounts] = useState<SidebarAccount[]>([]);
  const [sidebarLedgers, setSidebarLedgers] = useState<SidebarAccount[]>([]);
  const [selected, setSelected] = useState<SidebarAccount | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(sidebar.SELECTED_SIDEBAR_ACCOUNT) || "");
    } catch (e) {
      return null;
    }
  });
  const selectedRefs = useRef(selected);
  const dispatch = useAppDispatch();
  const { appConnectors } = useAppConnectors();

  useEffect(() => {
    // filter ledgers
    const ledgers = sidebarAccounts.filter((acc) => acc.ledgerAddress !== undefined);
    setSidebarLedgers(ledgers as SidebarAccount[]);

    if (activeAccount && sidebarAccounts.length === 0) {
      setSelected(null);
      dispatch(setSelectedAccount(null));
      localStorage.removeItem(sidebar.SELECTED_SIDEBAR_ACCOUNT);
    }

    if (!selected && sidebarAccounts.length > 0) {
      setSelected(sidebarAccounts[0]);
      dispatch(setSelectedAccount(sidebarAccounts[0]));
      localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(sidebarAccounts[0]));
    }
  }, [JSON.stringify(sidebarAccounts)]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const prevSelected = selectedRefs.current as unknown as SidebarAccount;

    // disconnect all dapps
    const disconnectDapps = async (prevSelected: SidebarAccount, currSelected: SidebarAccount | null) => {
      if (prevSelected && prevSelected !== currSelected && appConnectors) {
        const connector = appConnectors.get(prevSelected?.address);
        if (connector) {
          await connector.disconnectAll();
        }
      }
    };

    const updateSelectedSafe = async () => {
      dispatch(setSelectedAccount(selected));
      localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(selected));

      // selected safe
      if (selected?.appId) {
        const selectedSafe = await ss.getSafe(selected.appId);
        dispatch(setSelectedSafe(selectedSafe));

        // fetch all available signers and set default signer
        let availSigners: unknown[] = [];

        // only ledgers, no hot wallets
        if (!activeAccount) {
          if (sidebarLedgers.length > 0) {
            availSigners = [...sidebarLedgers];
            dispatch(setSigner(availSigners[0] as LedgerAccount | Account));
          }
          dispatch(setAvailableSigners(availSigners as (LedgerAccount | Account)[]));
          return;
        } else {
          availSigners.push(activeAccount);

          if (selectedSafe.owners.length > 0) {
            // intersection between online accounts and safe owners
            sidebarLedgers.forEach((item) => {
              item && selectedSafe.owners.some((xitem) => Object.values(xitem).includes(item.address)) && availSigners.push(item);
            });
          }
          dispatch(setSigner(availSigners[0] as LedgerAccount | Account));
          dispatch(setAvailableSigners(availSigners as (LedgerAccount | Account)[]));
        }
      } else {
        // selected ledger
        dispatch(setSelectedSafe({}));
        dispatch(setSigner(null));
        dispatch(setAvailableSigners([]));
        return;
      }
    };

    updateSelectedSafe();
    disconnectDapps(prevSelected, selected);
    selectedRefs.current = selected;
  }, [JSON.stringify(selected), isReady, sidebarLedgers]);

  return (
    <SidebarAccountsContext.Provider
      value={{ sidebarAccounts, setSidebarAccounts, sidebarLedgers, setSidebarLedgers, selected, setSelected }}
    >
      {children}
    </SidebarAccountsContext.Provider>
  );
};
