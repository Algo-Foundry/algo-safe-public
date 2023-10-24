import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { useCallback } from "react";
import { errors, statuses } from "shared/constants";
import useSafeAuth from "./useSafeAuth";
import algosdk, { encodeUnsignedTransaction } from "algosdk";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import useLedger from "./useLedger";
import { convertToTxnBuilder } from "shared/utils";

const useAssetCloseToPtxn = () => {
  const ss = new SafeService();
  const { connect, signTxns, sendTxns, getAccountFromHardware, removeAssetTxn } = useLedger();

  const { authenticateSigner, generateToken, generateTokenForLedger } = useSafeAuth();

  const handleCloseToPtxn = useCallback(
    async (
      safe: Safe,
      assetID: number,
      activeAccount: any,
      recipientAddress: string,
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

      //check the ptxn is active (if active will throw an error)
      const appGS = await ss.getSafeGlobalState(safe.appId);
      const ptxns = await ss.getSafePendingTransactions(safe, activeAccount.address, appGS);
      ptxns.forEach((item) => {
        const id = item.parsedPayload && item.parsedPayload[0].payloadAssetID;
        const payloadCloseRemainderTo = item.parsedPayload && item.parsedPayload[0].payloadCloseRemainderTo;
        if (payloadCloseRemainderTo && id == assetID && item.status !== "Expired") {
          throw Error(errors.ERR_THE_SAME_PTXN_IS_ACTIVE);
        }
      });

      const ptxnData = await ss.getAssetCloseToPendingTxn(safe, assetID, activeAccount.address, recipientAddress);
      setStepProgress(2);

      const encodedTxns = ptxnData.txns.map((txn) => encodeUnsignedTransaction(txn));
      let obj;

      if ("ledgerAddress" in activeAccount) {
        const transport = await connect();

        if (transport === undefined) {
          throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
        }

        const signed = await signTxns(ptxnData.txns, activeAccount);
        const { response: res, confirmation } = await sendTxns(signed);
        obj = { ptxnData, res, confirmation };
      } else {
        const signedTxns = await signTransactions(encodedTxns);
        const res = await sendTransactions(signedTxns, 10);
        obj = { ptxnData, res };
      }

      const encodedPayload = convertToTxnBuilder(ptxnData.payload);
      await ss.savePendingTxnPayloadToDatabase(
        activeAccount.address,
        safe,
        encodedPayload,
        ptxnData.lsa.lsa,
        ptxnData.lsa.result
      );
      return obj;
    },
    []
  );

  const handleCloseFromLedgerToPtxn = useCallback(
    async (
      ledgerAccount: LedgerAccount | null,
      asaID: number,
      setStepProgress: (value: React.SetStateAction<number>) => void
    ) => {
      const transport = await connect();

      if (transport === undefined) {
        throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
      }

      if (!ledgerAccount) {
        throw new Error(errors.ERR_LEDGER_SIGN_FAILED);
      }

      const ledgerAcc_hw = await getAccountFromHardware(ledgerAccount.ledgerAddress);
      if (ledgerAcc_hw.address !== ledgerAccount.address) {
        throw new Error(errors.ERR_OPT_IN_SAFE_FAILED);
      }

      const sender = ledgerAccount;

      const txn1 = await removeAssetTxn(ledgerAccount.address, Number(asaID));

      setStepProgress(2);
      const txns = [txn1];
      const txns_grped = algosdk.assignGroupID(txns);
      const signed = await signTxns(txns_grped, sender);
      const { response, confirmation } = await sendTxns(signed);

      return { response, confirmation };
    },
    []
  );

  return { handleCloseToPtxn, handleCloseFromLedgerToPtxn };
};

export default useAssetCloseToPtxn;
