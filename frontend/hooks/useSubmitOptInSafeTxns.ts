import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { useCallback } from "react";
import useLedger from "./useLedger";
import { errors } from "shared/constants";
import { assignGroupID, encodeUnsignedTransaction } from "algosdk";
import LedgerAccount from "shared/interfaces/LedgerAccount";

const useSubmitOptInSafeTxns = () => {
  const ss = new SafeService();
  const { connect, signTxns, sendTxns, getAccountFromHardware } = useLedger();

  const handleOptInSafeTxns = useCallback(
    async (safe: Safe, activeAccount: any, signTransactions: any, sendTransactions: any) => {
      if (!activeAccount) {
        throw new Error(errors.ERR_USE_WALLET_ACC_NOT_ACTIVE);
      }
      const optInTxn = await ss.getOptIntoSafeTxn(safe, activeAccount.address);
      const encodedTxn = encodeUnsignedTransaction(optInTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      const response = await sendTransactions(signedTxns, 10);
      // remove any temp safes
      localStorage.removeItem("temp-create-safe");

      return response;
    },
    []
  );

  const handleOptInSafeTxnsViaLedger = useCallback(async (safe: Safe, ledgerAcc: LedgerAccount) => {
    // connect to ledger wallet
    const transport = await connect();

    if (transport === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    // verify if ledger Algo address is the same as the hardware
    const ledgerAcc_hw = await getAccountFromHardware(ledgerAcc.ledgerAddress);
    if (ledgerAcc_hw.address !== ledgerAcc.address) {
      throw new Error(errors.ERR_OPT_IN_SAFE_FAILED);
    }

    const optInTxn = await ss.getOptIntoSafeTxn(safe, ledgerAcc_hw.address);
    const grpTxn = assignGroupID([optInTxn]);
    const signedTxn = await signTxns(grpTxn, ledgerAcc_hw);
    const { response } = await sendTxns(signedTxn);

    // remove any temp safes
    localStorage.removeItem("temp-create-safe");

    return response;
  }, []);

  return { handleOptInSafeTxns, handleOptInSafeTxnsViaLedger };
};

export default useSubmitOptInSafeTxns;
