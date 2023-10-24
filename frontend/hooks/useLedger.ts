import LedgerService from "frontend/services/ledger";
import { useCallback } from "react";
import algosdk from "algosdk";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import Algorand from "@ledgerhq/hw-app-algorand";
import { DappTxn } from "shared/interfaces";
import AccountService from "frontend/services/account";

const useLedger = () => {
  // handles functions related to ledger
  const ls = new LedgerService();

  const algod = ls.algod;
  const indexer = ls.indexer;
  const connect = useCallback(async () => await ls.connect(), [ls]);
  const setTransport = useCallback(async (transport: Algorand) => await ls.setTransport(transport), [ls]);
  const getAccount = useCallback(
    async (ledgerAddr: string, algoAddr: string, name: string) => await ls.getAccount(ledgerAddr, algoAddr, name),
    [ls]
  );
  const getAccountFromHardware = useCallback(async (ledgerAddr: string) => await ls.getAccountFromHardware(ledgerAddr), [ls]);
  const accountInfo = useCallback(async (address: string) => await ls.accountInfo(address), [ls]);
  const fetchAccounts = useCallback(async (page?: number) => await ls.fetchAccounts(page), [ls]);
  const fetchTransactions = useCallback(async (address: string) => await ls.fetchTransactions(address), [ls]);
  const fetchAssetBalances = useCallback(
    async (address: string, setTotalAssetCountMessage: React.Dispatch<React.SetStateAction<string>>) =>
      await AccountService.fetchAssetBalances(address, setTotalAssetCountMessage),
    [ls]
  );
  const signTxns = useCallback(
    async (txnsData: algosdk.Transaction[] | algosdk.TransactionWithSigner[], sender: LedgerAccount) =>
      await ls.signTxns(txnsData, sender),
    [ls]
  );
  const signDappTxns = useCallback(
    async (txnsData: DappTxn[], sender: LedgerAccount) => await ls.signDappTxns(txnsData, sender),
    [ls]
  );
  const sendTxns = useCallback(async (signed: Uint8Array | Uint8Array[]) => await ls.sendTxns(signed), [ls]);
  const sendAlgosTxn = useCallback(
    async (from: string, to: string, amount: number) => await ls.sendAlgosTxn(from, to, amount),
    [ls]
  );
  const sendAssetTxn = useCallback(
    async (from: string, to: string, amount: number, assetIndex: number) => await ls.sendAssetTxn(from, to, amount, assetIndex),
    [ls]
  );
  const closeAssetTxn = useCallback(
    async (ledgerAddress: string, amount: number, assetIndex: number, closeRemainderTo: string) =>
      await ls.closeAssetTxn(ledgerAddress, amount, assetIndex, closeRemainderTo),
    [ls]
  );
  const removeAssetTxn = useCallback(
    async (ledgerAddress: string, assetIndex: number) => await ls.removeAssetTxn(ledgerAddress, assetIndex),
    [ls]
  );
  const addAssetTxn = useCallback(
    async (ledgerAddress: string, assetIndex: number) => await ls.addAssetTxn(ledgerAddress, assetIndex),
    [ls]
  );

  return {
    algod,
    indexer,
    connect,
    setTransport,
    getAccount,
    getAccountFromHardware,
    accountInfo,
    fetchAccounts,
    fetchTransactions,
    fetchAssetBalances,
    signTxns,
    signDappTxns,
    sendTxns,
    sendAlgosTxn,
    sendAssetTxn,
    closeAssetTxn,
    removeAssetTxn,
    addAssetTxn,
  };
};

export default useLedger;
