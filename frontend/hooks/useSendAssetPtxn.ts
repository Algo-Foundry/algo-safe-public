import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { useCallback } from "react";
import useSafeAuth from "frontend/hooks/useSafeAuth";
import algosdk, { encodeUnsignedTransaction } from "algosdk";
import { errors, statuses } from "shared/constants";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import useLedger from "./useLedger";
import { convertToTxnBuilder } from "shared/utils";

const useSendAssetFromSafePtxn = () => {
  const ss = new SafeService();

  const { connect, signTxns, sendTxns, sendAssetTxn, closeAssetTxn, getAccountFromHardware } = useLedger();

  const { authenticateSigner, generateToken, generateTokenForLedger } = useSafeAuth();

  const handleSendAssetFromSafePtxn = useCallback(
    async (
      safe: Safe,
      assetID: number,
      assetAmount: number,
      activeAccount: any,
      receiverAddr: string,
      setStepProgress: (value: React.SetStateAction<number>) => void,
      signTransactions: any,
      sendTransactions: any,
      isCheckboxChecked: boolean
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

      let ptxnData;
      if (isCheckboxChecked) {
        ptxnData = await ss.getAssetCloseToPendingTxn(safe, assetID, activeAccount.address, receiverAddr);
      } else {
        ptxnData = await ss.getSendAssetFromSafePendingTxn(safe, assetID, assetAmount, activeAccount.address, receiverAddr);
      }
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

  const handleSendAssetFromLedgerPtxn = useCallback(
    async (
      ledgerAccount: LedgerAccount | null,
      recipientData: any,
      isCheckboxChecked: boolean,
      selectedAsset: any,
      amount: string | number,
      assetId: number,
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
      const receiver = recipientData.address;

      let txn1;
      if (isCheckboxChecked) {
        txn1 = await closeAssetTxn(
          sender.address,
          Number(amount) * Math.pow(10, selectedAsset.decimals),
          Number(assetId),
          receiver
        );
      } else {
        txn1 = await sendAssetTxn(
          sender.address,
          receiver,
          Number(amount) * Math.pow(10, selectedAsset.decimals),
          Number(assetId)
        );
      }

      setStepProgress(2);
      const txns = [txn1];
      const txns_grped = algosdk.assignGroupID(txns);
      const signed = await signTxns(txns_grped, sender);
      const { response, confirmation } = await sendTxns(signed);

      return { response, confirmation };
    },
    []
  );

  return { handleSendAssetFromSafePtxn, handleSendAssetFromLedgerPtxn };
};

export default useSendAssetFromSafePtxn;
