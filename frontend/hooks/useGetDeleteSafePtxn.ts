import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { useCallback } from "react";
import { encodeUnsignedTransaction } from "algosdk";
import { errors, statuses } from "shared/constants";
import useSafeAuth from "./useSafeAuth";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import useLedger from "./useLedger";

const useGetDeleteSafePtxn = () => {
  const ss = new SafeService();

  const { authenticateSigner, generateToken, generateTokenForLedger } = useSafeAuth();
  const { connect, signTxns, sendTxns } = useLedger();

  const getVoteOrDeleteSafeTxn = useCallback(
    async (
      safe: Safe,
      activeAccount: any,
      setStepProgress: (value: React.SetStateAction<number>) => void,
      signTransactions: any,
      sendTransactions: any
    ) => {
      if (!activeAccount) throw new Error(errors.ERR_USE_WALLET_ACC_NOT_ACTIVE);

      try {
        await authenticateSigner(activeAccount.address, safe.appId);
      } catch (err) {
        if ("ledgerAddress" in activeAccount) {
          await generateTokenForLedger(activeAccount as LedgerAccount);
        } else {
          await generateToken(activeAccount.address, signTransactions);
        }
      }
      // verify safe ownership
      const { status } = await ss.verifySafeOwnership(safe, activeAccount.address);
      if (status === statuses.REQUIRE_OPTIN) throw new Error(errors.ERR_SAFE_OWNER_NOT_OPTED_IN);

      const ptxnData = await ss.getVoteOrDeleteSafeTxn(safe, activeAccount.address);
      setStepProgress(2);

      const encodedTxns = ptxnData.map((txn) => encodeUnsignedTransaction(txn));
      let obj;

      if ("ledgerAddress" in activeAccount) {
        const transport = await connect();

        if (transport === undefined) {
          throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
        }

        const signed = await signTxns(ptxnData, activeAccount);
        const { response: res, confirmation } = await sendTxns(signed);
        obj = { ptxnData, res, confirmation };
      } else {
        const signedTxns = await signTransactions(encodedTxns);
        const res = await sendTransactions(signedTxns, 10);
        obj = { ptxnData, res };
      }
      return obj;
    },
    []
  );
  return { getVoteOrDeleteSafeTxn };
};

export default useGetDeleteSafePtxn;
