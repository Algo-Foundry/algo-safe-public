import { useCallback } from "react";
import { SidebarAccount } from "shared/interfaces";
import algosdk, { encodeUnsignedTransaction } from "algosdk";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import useLedger from "./useLedger";
import SafeService from "frontend/services/safe";
import InitTxnAdmin from "shared/interfaces/SendTxnAdmin";
import { errors } from "shared/constants";

const ss = new SafeService();

const useSendTxAdmin = () => {
  const selectedAccount = useAppSelector<SidebarAccount | null>(getSelectedAccount);
  const { getAccount, signTxns, sendTxns, connect } = useLedger();

  const handleInitTxn = async (initTxnArgs: InitTxnAdmin) => {
    let initTxn;
    switch (initTxnArgs.functName) {
      case "treasuryUpdate":
        initTxn = await ss.masterUpdateTreasury(initTxnArgs.adminAddress, initTxnArgs.address as string);
        break;
      case "feeUpdate":
        initTxn = await ss.masterUpdateFee(initTxnArgs.adminAddress, initTxnArgs.amount as number);
        break;
      case "minUpdate":
        initTxn = await ss.masterUpdateMinTopup(initTxnArgs.adminAddress, initTxnArgs.amount as number);
        break;
      case "pkUpdate":
        initTxn = await ss.masterUpdatePublicKey(initTxnArgs.adminAddress, initTxnArgs.publicKey as string);
        break;
      default:
        break;
    }
    return initTxn;
  };

  const handleSendTxFromLedger = useCallback(
    async (initTxnArgs: InitTxnAdmin, setStepProgress: (value: React.SetStateAction<number>) => void) => {
      const initTxn = await handleInitTxn(initTxnArgs);
      if (!initTxn) return;

      const transport = await connect();
      if (transport === undefined) {
        throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
      }

      if (!selectedAccount?.ledgerAddress) return;
      const sender = await getAccount(selectedAccount.ledgerAddress, selectedAccount.address, selectedAccount.name);

      if (!sender) {
        throw new Error("No ledger account detected");
      }

      setStepProgress(2);

      const txns_grped = algosdk.assignGroupID([initTxn]);
      const signed = await signTxns(txns_grped, sender);
      const res = await sendTxns(signed);
      return res;
    },
    []
  );

  const handleSendTxFromHotWallet = useCallback(
    async (
      initTxnArgs: InitTxnAdmin,
      setStepProgress: (value: React.SetStateAction<number>) => void,
      signTransactions: any,
      sendTransactions: any
    ) => {
      const initTxn = await handleInitTxn(initTxnArgs);
      if (!initTxn) return;

      setStepProgress(2);
      const encodedTxns = encodeUnsignedTransaction(initTxn);
      const signedTxns = await signTransactions([encodedTxns]);
      const res = await sendTransactions(signedTxns, 10);
      return res;
    },
    []
  );

  return { handleSendTxFromLedger, handleSendTxFromHotWallet };
};

export default useSendTxAdmin;
