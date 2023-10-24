import SafeService from "frontend/services/safe";
import { useCallback } from "react";
import NewSafe from "shared/interfaces/NewSafe";
import useSafeAuth from "./useSafeAuth";
import { errors } from "shared/constants";
import { encodeUnsignedTransaction } from "algosdk";
import { indexerClient } from "backend/connection/algorand";

const useSubmitCreateSafeTxns = () => {
  const ss = new SafeService();
  const indexer = indexerClient();
  const { generateToken } = useSafeAuth();

  const handleSubmitCreateSafeTxns = useCallback(
    async (
      safeName: string,
      threshold: number,
      owners: NewSafe["owners"],
      activeAccount: any,
      signTransactions: any,
      sendTransactions: any
    ) => {
      // ledger accounts cannot create / init safe
      if (!activeAccount) {
        throw new Error(errors.ERR_USE_WALLET_ACC_NOT_ACTIVE);
      }

      // create auth token
      await generateToken(activeAccount.address, signTransactions);

      const safeThreshold = typeof threshold === "string" ? Number(threshold) : threshold;

      const createSafeTxns = await ss.getCreateSafeTxn(activeAccount.address, safeName, safeThreshold, owners);

      if (createSafeTxns === null) throw new Error(errors.ERR_CREATE_SAFE_FAILED);

      // get create app txn ID
      const createSafeTxnId = createSafeTxns[1].txID();

      // sign and submit txns
      const encodedTxns = createSafeTxns.map((txn) => encodeUnsignedTransaction(txn));
      const signedTxns = await signTransactions(encodedTxns);

      const res = await sendTransactions(signedTxns, 10);
      if (res === undefined) throw new Error(errors.ERR_CREATE_SAFE_FAILED);

      // get safe ID
      const txnData = await indexer.lookupTransactionByID(createSafeTxnId).do();
      const safeID = Number(txnData.transaction["created-application-index"]);
      const newSafe = await ss.getSafe(safeID);

      // save in localstorage for recovery purposes
      localStorage.setItem(
        "temp-create-safe",
        JSON.stringify({
          appId: safeID,
          creator: activeAccount.address,
        })
      );

      // save the safe to db - you should have been authenticated already
      await ss.saveSafeToDatabase(activeAccount.address, newSafe);

      return {
        safe: newSafe,
        res,
      };
    },
    []
  );

  return handleSubmitCreateSafeTxns;
};

export default useSubmitCreateSafeTxns;
