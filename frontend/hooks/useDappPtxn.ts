import SafeService from "frontend/services/safe";
import { Safe, TransactionBuilder } from "shared/interfaces";
import { useCallback } from "react";
import algosdk from "algosdk";
import { errors, statuses, txnbuilder } from "shared/constants";
import useSafeAuth from "./useSafeAuth";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import useLedger from "./useLedger";
import AppConfig from "config/appConfig";
import { Account } from "@txnlab/use-wallet";

const useDappPtxn = () => {
  const ss = new SafeService();

  const { authenticateSigner, generateToken, generateTokenForLedger } = useSafeAuth();
  const { connect, signTxns, sendTxns, getAccountFromHardware, signDappTxns } = useLedger();

  const handleCreateSafeDappPtxn = useCallback(
    async (
      safe: Safe,
      signer: Account | LedgerAccount,
      payload: any,
      signTransactions: any,
      sendTransactions: any,
      topic: string,
      requestId: number,
      dappMetadata: any
    ) => {
      // handle authentication
      try {
        await authenticateSigner(signer.address, safe.appId);
      } catch (err) {
        if ("ledgerAddress" in signer) {
          await generateTokenForLedger(signer as LedgerAccount);
        } else {
          await generateToken(signer.address, signTransactions);
        }
      }

      // urgent ptxn check
      const getUrgentRequestPtxn = await ss.getUrgentPtxn(safe);
      if (getUrgentRequestPtxn) {
        throw new Error(errors.ERR_URGENT_PTXN_EXISTS);
      }

      // verify safe ownership
      const { status } = await ss.verifySafeOwnership(safe, signer.address);
      if (status === statuses.REQUIRE_OPTIN) {
        throw new Error(errors.ERR_SAFE_OWNER_NOT_OPTED_IN);
      }

      // max ptxn check
      if (safe.ptxs !== undefined && safe.ptxs >= AppConfig.maxPtxn) {
        throw new Error(errors.ERR_MAX_PTXN_REACHED);
      }

      // Prepare payload
      const decodedPayload: algosdk.Transaction[] = [];
      const parsedPayload = payload.map((item: any) => {
        // Decode this txn, if the sender is the safe address, it will be signed by lsig
        const decodedTxn = algosdk.decodeUnsignedTransaction(Buffer.from(item.txn, "base64"));
        decodedPayload.push(decodedTxn);

        const fromAddress = algosdk.encodeAddress(decodedTxn.from.publicKey);
        let signBy = txnbuilder.SIGNER_NONE;
        if (fromAddress === safe.address) {
          // lsig will sign txn that spends from the safe
          signBy = txnbuilder.SIGNER_LSIG;
        } else if (item.signer) {
          // Means the transaction is not meant to be signed by us
          signBy = item.signer;
        }

        return {
          txn: item.txn,
          signer: signBy,
        };
      });

      const parsedPayload_tb: TransactionBuilder = {
        transactions: parsedPayload,
      };

      // Create pending transaction with payload
      const pendingTxns = await ss.getCreatePendingTxn(safe, signer.address, decodedPayload);
      const lsig_address = pendingTxns.lsa.lsa.address();

      // signing the ptxn
      let obj: {
        res: any;
        confirmation?: any;
        lsig_address: string;
      };

      if ("ledgerAddress" in signer) {
        const transport = await connect();
        if (transport === undefined) {
          throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
        }

        const signed = await signTxns(pendingTxns.txns, signer);
        const { response: res, confirmation } = await sendTxns(signed);
        obj = { res, confirmation, lsig_address };
      } else {
        const encodedPendingTxns = pendingTxns.txns.map((tx) => algosdk.encodeUnsignedTransaction(tx));
        const signedTxns = await signTransactions(encodedPendingTxns);
        const res = await sendTransactions(signedTxns, 10);
        obj = { res, lsig_address };
      }

      // connection details
      const wcDetails: { wc_id: string | null; peerMeta: string | null; rpc_id: string | null } = {
        wc_id: topic,
        peerMeta: dappMetadata,
        rpc_id: String(requestId),
      };

      await ss.savePendingTxnPayloadToDatabase(
        signer.address,
        safe,
        parsedPayload_tb,
        pendingTxns.lsa.lsa,
        pendingTxns.lsa.result,
        wcDetails
      );

      return obj;
    },
    []
  );

  const handleSignDappPtxnWithLedger = useCallback(async (ledgerAccount: LedgerAccount | null, payload: any) => {
    const transport = await connect();
    if (transport === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    if (!ledgerAccount) {
      throw new Error("No ledger account detected");
    }

    const ledgerAcc_hw = await getAccountFromHardware(ledgerAccount.ledgerAddress);
    if (ledgerAcc_hw.address !== ledgerAccount.address) {
      throw new Error(errors.ERR_OPT_IN_SAFE_FAILED);
    }

    // sign with ledger
    const encodedSigned = await signDappTxns(payload, ledgerAccount);

    return encodedSigned;
  }, []);

  return { handleCreateSafeDappPtxn, handleSignDappPtxnWithLedger };
};

export default useDappPtxn;
