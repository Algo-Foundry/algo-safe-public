import SafeService from "frontend/services/safe";
import { Dispatch, SetStateAction, useCallback } from "react";
import useSafeAuth from "frontend/hooks/useSafeAuth";
import { errors, statuses } from "shared/constants";
import { Transaction, encodeUnsignedTransaction } from "algosdk";
import { Safe } from "shared/interfaces";
import { useAppDispatch } from "frontend/redux/hooks";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { STATUS_READY } from "shared/constants/ptxn";
import useLedger from "./useLedger";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import useAppConnectors from "./useAppConnectors";

const usePtxnActions = () => {
  const ss = new SafeService();
  const { appConnectors } = useAppConnectors();

  const { authenticateSigner, generateTokenForLedger, generateToken } = useSafeAuth();
  const { connect, signTxns, sendTxns } = useLedger();

  const dispatch = useAppDispatch();

  const handlePtxnAction = useCallback(
    async (
      safe: Safe,
      activeAccount: any,
      signTransactions: any,
      sendTransactions: any,
      item: any,
      action: string,
      setPtxnData: ActionCreatorWithPayload<any, string>,
      setStepProgress?: (value: React.SetStateAction<number>) => void,
      setDataModal?: Dispatch<SetStateAction<any>>,
      setLoadingModalShow?: any,
      setTypeModal?: Dispatch<SetStateAction<string>>,
      setErrorDetails?: Dispatch<SetStateAction<string>>,
      setResponseModalShow?: Dispatch<SetStateAction<boolean>>,
      appConnector?: AppConnectorV2
    ) => {
      if (!activeAccount.address) throw new Error(errors.ERR_USE_WALLET_ACC_NOT_ACTIVE);

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

      const appGS = await ss.getSafeGlobalState(safe.appId);

      if (item.parsedPayload) {
        if (item.parsedPayload[0].payloadType === "asset-optin" && action === "execute") {
          const { enoughAlgos, minBalance } = await ss.enoughAlgosToHoldNewAsset(safe);
          if (!enoughAlgos) {
            if (setLoadingModalShow) setLoadingModalShow(false);
            if (setTypeModal) setTypeModal("fail");
            if (setErrorDetails)
              setErrorDetails(
                `Please ensure that you have at least ${(minBalance / 1e6).toFixed(
                  3
                )} Algos in the Safe before executing this transaction.`
              );
            if (setDataModal)
              setDataModal({
                type: "fail",
              });
            if (setResponseModalShow) setResponseModalShow(true);
            return;
          }
        }
      }

      let ptxnData: Transaction[] = [];

      switch (action) {
        case "reject":
          ptxnData = await ss.getVotePendingTxn(item, activeAccount.address, 0);
          break;
        case "confirm":
          ptxnData = await ss.getVotePendingTxn(item, activeAccount.address, 1);
          break;
        case "execute":
          ptxnData = await ss.getExecutePendingTxn(item, activeAccount.address);
          break;
        case "delete":
          ptxnData = await ss.getDeleteExpiredPendingTxn(item, activeAccount.address);
          break;
        case "reject-remove-safe":
          ptxnData = await ss.getVoteOrDeleteSafeTxn(safe, activeAccount.address, 0);
          break;
        case "confirm-remove-safe":
          ptxnData = await ss.getVoteOrDeleteSafeTxn(safe, activeAccount.address, 1);
          break;
        case "execute-remove-safe":
          ptxnData = await ss.getExecuteDeleteSafeTxn(safe, activeAccount.address);
          break;
        case "cancel-remove-safe":
          ptxnData = await ss.getCancelDeleteSafeTxn(safe, activeAccount.address);
          break;
        default:
          break;
      }

      if (setStepProgress) setStepProgress(2);

      const encodedTxns = ptxnData.map((txn) => encodeUnsignedTransaction(txn));

      let obj: any;

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

      appConnector = appConnectors.get(safe.address) as AppConnectorV2;

      if (action === "execute" && item.status == STATUS_READY) {
        const updatedItem = await ss.getSafeSinglePtxn(safe, activeAccount.address, item.seq, appGS);
        if (!updatedItem) {
          throw new Error(errors.ERR_PTXN_DB);
        }
        await ss.processExecutedPendingTxn(activeAccount.address, updatedItem ? updatedItem : item, safe, appConnector);
        dispatch(setPtxnData({}));
      }
      return obj;
    },
    []
  );

  return { handlePtxnAction };
};

export default usePtxnActions;
