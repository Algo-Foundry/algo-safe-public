import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { useCallback } from "react";
import { errors } from "shared/constants";
import { encodeUnsignedTransaction } from "algosdk";

const useSubmitInitSafeTxns = () => {
  const ss = new SafeService();

  const handleSubmitInitSafeTxns = useCallback(
    async (safe: Safe, initBalance: number, activeAccount: any, signTransactions: any, sendTransactions: any) => {
      // ledger accounts cannot create / init safe
      if (!activeAccount) {
        throw new Error(errors.ERR_USE_WALLET_ACC_NOT_ACTIVE);
      }

      const initTxns = await ss.getInitializeSafeTxns(safe, activeAccount.address, initBalance);

      // sign and submit txns
      const encodedTxns = initTxns.map((txn) => encodeUnsignedTransaction(txn));
      const signedTxns = await signTransactions(encodedTxns);
      const res = await sendTransactions(signedTxns, 10);

      // Get all txn IDs - treasury payment, topup to safe, init app call
      const treasuryTxnID = initTxns[0].txID();
      const topupTxnID = initTxns[1].txID();
      const initAppCallTxnID = initTxns[2].txID();
      const initGroupID = initTxns[2].group?.toString("base64");

      return {
        res,
        treasuryTxnID,
        topupTxnID,
        initAppCallTxnID,
        initGroupID,
      };
    },
    []
  );

  return handleSubmitInitSafeTxns;
};

export default useSubmitInitSafeTxns;
