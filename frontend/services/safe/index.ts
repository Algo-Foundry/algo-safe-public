import { Algodv2, Indexer } from "algosdk";
import { algodClient, indexerClient } from "backend/connection/algorand";
import { PendingTxn, Safe, TransactionBuilder } from "shared/interfaces";
import { getEntireGlobalState, getAccountLocalState, getAsset, formatLocalState } from "backend/common/algorand/general";
import * as txnbuilder from "backend/common/algorand/txn";
import {
  contract,
  errors,
  statuses,
  ptxndb,
  SELECTED_SAFE,
  ptxn as ptxnConstants,
  txnbuilder as signerType,
  migratesafedb,
  migratesafe,
  uitypes,
} from "shared/constants";
import AppConfig from "config/appConfig";
import algosdk from "algosdk";
import { assetParam } from "backend/common/algorand/types";
import { encodeUint64, encodeStringToByteArray, base64ToByteArray } from "shared/utils";
import axios from "axios";
import base32 from "hi-base32";
import NftService from "../nft";
import LsigService from "../lsig";
import AppConnectorV2 from "./appConnectorV2";
import DappService from "../dApp";
import { AppConnector } from "./appConnector";
import moment from "moment";
import AccountService from "../account";

const BLOCK_TIME = 3.3;

export default class SafeService {
  algod: Algodv2 = algodClient();
  indexer: Indexer = indexerClient();

  getMasterSafeConfig = async () => {
    const appGS = await getEntireGlobalState(this.algod, AppConfig.masterId);

    // get treasury address - passed in via accounts array
    const treasuryAddr = algosdk.encodeAddress(Buffer.from(appGS.get(contract.GS_TREASURY)?.rawValue.bytes, "base64"));

    // safe minimum balance in algos
    const minBalance = (appGS.get(contract.GS_MINIMUM_BALANCE)?.formattedValue as number) / 1e6;
    const creationFees = (appGS.get(contract.GS_SAFE_CREATION_FEES)?.formattedValue as number) / 1e6;

    return {
      treasuryAddr,
      minBalance,
      creationFees,
    };
  };

  getSafe = async (appId: number) => {
    const address = algosdk.getApplicationAddress(appId);
    const appGS = await this.getSafeGlobalState(appId);

    // verify safe app
    const identifier = appGS.get(contract.GS_FOUNDRY_SAFE_ID);
    if (identifier === undefined || identifier?.formattedValue !== AppConfig.foundrySafeIdentifier) {
      throw new Error(errors.ERR_NOT_FOUNDRY_SAFE);
    }

    // get safe signers
    const owners = [];
    const num_owners = appGS.get(contract.GS_NUM_OWNERS)?.formattedValue as number;
    for (let i = 1; i <= num_owners; i++) {
      const owner_data = appGS.get(contract.GS_OWNER_PREFIX + "_" + i)?.owner_data;
      owners.push(owner_data);
    }

    // get name
    const name = appGS.get(contract.GS_NAME)?.formattedValue as string;

    // get threshold
    const threshold = appGS.get(contract.GS_TRESHOLD)?.formattedValue as number;

    // get sequence aka nonce
    const sequence = appGS.get(contract.GS_SEQUENCE)?.formattedValue as number;

    // get initalized status
    const init = appGS.get(contract.GS_INITITALIZED)?.formattedValue as number;

    // get master app ID
    const master = appGS.get(contract.GS_MASTER)?.formattedValue as number;

    // safe ptxs
    const ptxs = appGS.get(contract.GS_PTXS)?.formattedValue as number;

    // create safe object - default to read only
    const safe: Safe = {
      name,
      address,
      appId,
      sequence,
      initialized: init === 1 ? true : false,
      master,
      num_owners,
      owners,
      threshold,
      status: statuses.READ_ONLY,
      value: 0,
      ptxs,
    };

    // check for executing transaction
    const urgentRequest = await this.getUrgentPtxn(safe, appGS);
    if (urgentRequest !== undefined) {
      safe.executingTransaction = urgentRequest;
    }

    return safe;
  };

  getSafeOwners = async (appId: number) => {
    const appGS = await this.getSafeGlobalState(appId);

    // verify safe app
    const identifier = appGS.get(contract.GS_FOUNDRY_SAFE_ID);
    if (identifier === undefined || identifier?.formattedValue !== AppConfig.foundrySafeIdentifier) {
      throw new Error(errors.ERR_NOT_FOUNDRY_SAFE);
    }

    const owners = [];
    const num_owners = appGS.get(contract.GS_NUM_OWNERS)?.formattedValue as number;
    for (let i = 1; i <= num_owners; i++) {
      const owner_data = appGS.get(contract.GS_OWNER_PREFIX + "_" + i)?.owner_data;
      owners.push(owner_data);
    }
    return owners;
  };

  getSafesToResumeCreation = async (address: string) => {
    const res: any = await AccountService.getAccountInfo(address);
    const apps = res["created-apps"] || [];
    const safes: Safe[] = [];

    for (let i = 0; i < apps.length; i++) {
      try {
        let safeData = await this.getSafe(Number(apps[i].id));
        safeData = await this.verifySafeOwnership(safeData, address);
        if (safeData.status === "optin") {
          safes.push(safeData);
        }
      } catch (error) {
        continue;
      }
    }

    return safes;
  };

  getUserSafes = async (accAddr: string, rawLS?: any) => {
    let accLS;
    if (rawLS === undefined) {
      accLS = await getAccountLocalState(this.algod, accAddr);
    } else {
      accLS = formatLocalState(rawLS);
    }

    // get list of migrated safes
    const migration_resp = await this.getCompletedSafeMigrations();
    const safeSet = new Set();
    if (migration_resp.data) {
      migration_resp.data.forEach((migration: any) => safeSet.add(migration.from_safe));
    }

    const userSafes: Safe[] = [];
    for (const app of accLS) {
      try {
        const safe = await this.getSafe(app.id);
        if (safe === null) continue;

        // filter migrated safes
        if (safeSet.has(safe.appId)) continue;

        safe.status = statuses.OWNER;
        userSafes.push(safe);
      } catch (err) {
        continue;
      }
    }

    return userSafes;
  };

  verifySafeOwnership = async (safe: Safe, accAddr: string) => {
    let status = statuses.READ_ONLY;

    // verify if account is a safe owner and requires opt in or not
    const safeOwner = safe.owners.find((owner) => owner.addr === accAddr);

    if (safeOwner !== undefined) {
      // opt in check
      const accLS = await getAccountLocalState(this.algod, accAddr);

      // find safe local state
      const safeLS = accLS.find((app) => app.id === safe.appId);

      // opt in required if local state of the safe cannot be found
      if (safeLS === undefined) {
        status = statuses.REQUIRE_OPTIN;
      } else {
        status = statuses.OWNER;
      }
    }

    const updatedSafe = {
      ...safe,
      status,
    };

    return updatedSafe;
  };

  getAssetPrice = async (unitName: string) => {
    try {
      const { data } = await axios.get(`${AppConfig.appURL}/api/fetch-price?ids=${unitName}`);

      return data.data;
    } catch (e) {
      return 0;
    }
  };

  getCreateSafeTxn = async (
    creatorAccount: string,
    safename: string,
    threshold: number,
    owners: {
      name: string;
      addr: string;
    }[]
  ) => {
    // 1. "nop" Call
    let appArgs: Uint8Array[] = [encodeStringToByteArray("nop")];
    const tx1 = await txnbuilder.callApp(this.algod, creatorAccount, AppConfig.masterId, appArgs, [], [], []);

    // 2. Safe Creation
    const approval = new Uint8Array(Buffer.from(AppConfig.safeApproval, "base64"));
    const clearstate = new Uint8Array(Buffer.from(AppConfig.clearProg, "base64"));
    const localInts = 1;
    const localBytes = 0;
    const globalInts = 6;
    const globalBytes = 58;
    const foreignApps: number[] = [AppConfig.masterId];
    const extraPages = 1;

    appArgs = [encodeUint64(threshold), encodeStringToByteArray(safename)];

    // add owners to app args
    owners.forEach((owner) => {
      appArgs.push(
        new Uint8Array([
          ...Array.from(algosdk.decodeAddress(owner.addr).publicKey),
          ...Array.from(encodeUint64(owner.name.length)),
          ...Array.from(encodeStringToByteArray(owner.name)),
        ])
      );
    });

    const tx2 = await txnbuilder.createApp(
      this.algod,
      creatorAccount,
      approval,
      clearstate,
      localInts,
      localBytes,
      globalInts,
      globalBytes,
      appArgs,
      foreignApps,
      extraPages
    );

    if (tx2 == null) {
      return null;
    }

    const txns: algosdk.Transaction[] = [tx1, tx2];

    algosdk.assignGroupID(txns);

    return txns;
  };

  enoughAlgosToHoldNewAsset = async (safe: Safe) => {
    const safeAcc = await AccountService.getAccountInfo(safe.address);

    // safeAcc.minBalance returns undefined so we will use safeAcc["min-balance"] instead
    // @ts-ignore
    const safeMinBalance = Number(safeAcc["min-balance"]);
    const safeBalance = safeAcc.amount;

    // asset opt-in txn + rekey back to safe txn = 2000 mA
    const fee = 2000;
    const amountMicroAlgos = 100000;
    const minBalance = safeMinBalance + fee + amountMicroAlgos;

    return {
      enoughAlgos: safeBalance >= minBalance,
      minBalance,
    };
  };

  getOptIntoSafeTxn = async (safe: Safe, accAddr: string) => {
    return await txnbuilder.optInApp(this.algod, accAddr, safe.appId);
  };

  getTransferAlgoToSafeTxn = async (safe: Safe, senderAddr: string, amountMicroAlgos: number) => {
    return await txnbuilder.algoTransfer(this.algod, senderAddr, safe.address, amountMicroAlgos);
  };

  getTransferAssetToSafeTxn = async (safe: Safe, senderAddr: string, assetID: number, amount: number) => {
    // check if asset has been opted into the safe
    const asset = safe.assets?.find((asset) => asset.id === assetID);
    if (asset === undefined) {
      throw new Error(errors.ERR_ASSET_NOT_ADDED_TO_SAFE);
    }

    return await txnbuilder.asaTransfer(this.algod, senderAddr, safe.address, amount, assetID);
  };

  getAddAssetToSafePendingTxn = async (safe: Safe, senderAddr: string, assetID: number) => {
    // check if asset has been opted into the safe
    const asset = safe.assets?.find((asset) => asset.id === assetID);
    if (asset !== undefined) {
      throw new Error(errors.ERR_ASSET_EXISTS);
    }

    const txn = await txnbuilder.asaTransfer(this.algod, safe.address, safe.address, 0, assetID);
    const payload = algosdk.assignGroupID([txn]);

    // create new pending txn with add asset txn payload
    return await this.getCreatePendingTxn(safe, senderAddr, payload);
  };

  getSendAlgosFromSafePendingTxn = async (safe: Safe, amountMicroAlgos: number, senderAddr: string, receiverAddr: string) => {
    // check if safe has enough algos
    const maxAmount = await this.getSafeMaxWithdrawable(safe.address);
    if (amountMicroAlgos > maxAmount) {
      throw new Error(errors.ERR_INSUFFICIENT_ALGOS_IN_SAFE);
    }

    const txn = await txnbuilder.algoTransfer(this.algod, safe.address, receiverAddr, amountMicroAlgos);
    const payload = algosdk.assignGroupID([txn]);

    // create new pending txn with send algos txn payload
    return await this.getCreatePendingTxn(safe, senderAddr, payload);
  };

  getSendAssetFromSafePendingTxn = async (
    safe: Safe,
    assetID: number,
    assetAmount: number,
    senderAddr: string,
    receiverAddr: string
  ) => {
    // check if asset has been opted into the safe
    const asset = safe.assets?.find((asset) => asset.id === assetID);
    if (asset === undefined) {
      throw new Error(errors.ERR_ASSET_NOT_ADDED_TO_SAFE);
    } else if (asset.balance === undefined || asset.balance < assetAmount) {
      // asset quantity check
      throw new Error(errors.ERR_INSUFFICIENT_ASSET_IN_SAFE);
    }

    const txn = await txnbuilder.asaTransfer(this.algod, safe.address, receiverAddr, assetAmount, assetID);
    const payload = algosdk.assignGroupID([txn]);

    // create new pending txn with add asset txn payload
    return await this.getCreatePendingTxn(safe, senderAddr, payload);
  };

  getInitializeSafeTxns = async (safe: Safe, senderAddr: string, initialBalanceInMicroAlgos: number) => {
    // payment to treasuries - the values need to be converted to microalgos
    const { treasuryAddr, minBalance, creationFees } = await this.getMasterSafeConfig();
    const treasuryTxn = await txnbuilder.algoTransfer(this.algod, senderAddr, treasuryAddr, creationFees * 1e6);

    // safe minimum balance
    if (initialBalanceInMicroAlgos < minBalance * 1e6) {
      throw new Error(errors.ERR_INSUFFICIENT_MIN_BALANCE);
    }
    const minBalanceTxn = await txnbuilder.algoTransfer(this.algod, senderAddr, safe.address, initialBalanceInMicroAlgos);

    // app call init
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_INIT)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [safe.master];
    const accounts: string[] = [];
    const initAppCallTxn = await txnbuilder.callApp(
      this.algod,
      senderAddr,
      safe.appId,
      appArgs,
      accounts,
      foreignApps,
      foreignAssets
    );

    let txns: algosdk.Transaction[] = [treasuryTxn, minBalanceTxn, initAppCallTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getSafeTxnHistory = async (safe: Safe) => {
    // query db for executed ptxns
    const { data } = await axios.get(
      `${AppConfig.appURL}/api/pending-transaction/safe/${safe.appId}?status=${ptxndb.STATUS_EXECUTED}`
    );

    const txns = await Promise.all(
      data.data.map(async (ptxn: any) => {
        // decode payload
        const payload = ptxn.payload.transactions.map((encodedTxn: any) => {
          return algosdk.decodeUnsignedTransaction(Buffer.from(encodedTxn.txn, "base64"));
        });

        // parse info from payload
        const parsedPayload = await this.parsePendingTxnPayload(payload);

        // get dapp name if any
        const dappName = ptxn.peer_meta !== null ? ptxn.peer_meta.name : null;

        //set total fee
        let totalFees = 0;
        payload?.forEach((item: any) => (totalFees += item.fee));

        // formatted data
        const formatted = {
          ...ptxn,
          seq: ptxn.db_seq,
          txnId: ptxn.db_txnId,
          approvers: ptxn.db_approvers,
          rejections: ptxn.db_rejections,
          votingStatus: ptxn.db_votingStatus,
          expiry: ptxn.db_expiry ? new Date(ptxn.db_expiry) : null,
          payload,
          parsedPayload,
          canExecute: false, // already executed
          totalFees: totalFees,
          status: ptxnConstants.STATUS_SUCCESS, // because we did api call to get executed ptxns
          dappName,
          sender: ptxn.initiator ?? null,
        };

        // remove existing columns
        delete formatted.db_seq;
        delete formatted.db_txnId;
        delete formatted.db_approvers;
        delete formatted.db_rejections;
        delete formatted.db_votingStatus;
        delete formatted.db_expiry;
        delete formatted.initiator;

        return formatted;
      })
    );

    return txns;
  };

  nfdToAddress = async (nfd: string) => {
    try {
      // switch url depending on network
      let url = AppConfig.nfdUrlLookup;
      if (AppConfig.isTestNet()) {
        url = AppConfig.nfdUrlLookup_testnet;
      }

      const res = await axios.get(`${url}${nfd}?view=brief&poll=false&nocache=false`);
      return res.data;
    } catch (e) {
      return null;
    }
  };

  checkAssetOptin = async (adr: string, asset: number) => {
    //check if asset is algo
    if (asset === 0) return true;

    const { assets } = await AccountService.lookupAccountAssets(adr);

    const checkAsset = assets.find((e: any) => e["asset-id"] === asset);

    if (checkAsset) {
      return true;
    } else {
      return false;
    }
  };

  getSafePendingTransactions = async (safe: Safe, accAddr: string, appGS?: Map<any, any>) => {
    if (appGS === undefined) {
      appGS = await this.getSafeGlobalState(safe.appId);
    }

    const sequence = appGS.get(contract.GS_SEQUENCE)?.formattedValue as number;

    // get pending txns
    const pendingTransactions: PendingTxn[] = [];
    for (let curr = sequence; curr > 0; curr--) {
      const pTxn = await this.getSafeSinglePtxn(safe, accAddr, curr, appGS);
      if (!pTxn) continue;

      pendingTransactions.push(pTxn);
    }

    return pendingTransactions;
  };

  getSafeSinglePtxn = async (safe: Safe, accAddr: string, ptxnSeq: number, appGS?: Map<any, any>) => {
    if (appGS === undefined) {
      appGS = await this.getSafeGlobalState(safe.appId);
    }

    // get ptxn
    const ptxnGS = appGS.get(ptxnSeq.toString());
    if (ptxnGS === undefined) return null;
    const pTxnData = ptxnGS.ptxn;

    // parse voting data
    const pTxnAppr = appGS.get(`${ptxnSeq.toString()}_a`).ptxna;
    if (pTxnAppr === undefined) return null;

    // parse voting data
    let ownerVoted = false;
    const votingStatus = safe.owners.map((owner, index) => {
      let voteOutcome = ptxnConstants.VOTE_NO_ACTION;
      if (pTxnAppr.data[index] === 1) {
        voteOutcome = ptxnConstants.VOTE_CONFIRM;
      } else if (pTxnAppr.data[index] === 2) {
        voteOutcome = ptxnConstants.VOTE_REJECT;
      }

      //has owner voted?
      if (owner.addr === accAddr) {
        ownerVoted = pTxnAppr.data[index] !== 0;
      }

      return {
        owner,
        vote: pTxnAppr.data[index],
        status: voteOutcome,
      };
    });

    // construct ptxn
    const pTxn: PendingTxn = {
      seq: ptxnSeq,
      safe_app_id: safe.appId,
      lsig_address: pTxnData.ca,
      txnId: pTxnData.txnId,
      approvers: pTxnData.approvers,
      rejections: pTxnData.rejections,
      votingStatus,
      canExecute: false,
      sender: pTxnData.sender,
    };

    // get program from chain
    pTxn.lsig_program = await this.getPendingTxnLsigProgram(pTxn);

    // get db data
    const dbdata = await this.getPendingTxnFromDatabase(pTxnData.ca);

    if (dbdata) {
      pTxn.wc_id = dbdata.wc_id;
    }

    // get txn payload
    const decoded_payload = await this.getPendingTxnPayload(pTxnData.ca, dbdata);

    // can't proceed w/o payload
    if (decoded_payload.length === 0) return null;

    pTxn.dappName = dbdata.peer_meta !== null ? dbdata.peer_meta.name : null;

    pTxn.payload = decoded_payload;

    //set total fee
    let totalFees = 0;
    pTxn.payload?.forEach((item) => (totalFees += item.fee ?? 0));
    pTxn.totalFees = algosdk.microalgosToAlgos(totalFees);

    // parse info from payload
    const parsedPayload = await this.parsePendingTxnPayload(decoded_payload);
    pTxn.parsedPayload = parsedPayload;

    // get pending txn expiry datetime
    const nodeStatus = await this.algod.status().do();
    const latestBlockRound = pTxnData.expiry;
    const currRound = nodeStatus["last-round"];

    const now = new Date();
    pTxn.expiry = new Date();
    if (new Date(latestBlockRound).getTime() > 0 && currRound < latestBlockRound) {
      // get remaining duration
      const duration = Math.floor((latestBlockRound - currRound) * BLOCK_TIME);
      pTxn.expiry.setSeconds(+pTxn.expiry.getSeconds() + duration);
    }

    const remainingVotes = safe.num_owners - (pTxn.approvers + pTxn.rejections);

    // determine ptxn status
    if (dbdata !== null && dbdata.execution_status === ptxndb.STATUS_EXECUTED) {
      // already executed
      pTxn.status = ptxnConstants.STATUS_SUCCESS;
    } else if (pTxn.expiry <= now) {
      // expired
      pTxn.status = ptxnConstants.STATUS_EXPIRED;
    } else if (pTxn.approvers >= safe.threshold) {
      //determine if the ptxn is dapp
      pTxn.canExecute = true;
      // ready to execute
      pTxn.status = ptxnConstants.STATUS_READY;
    } else if (pTxn.rejections >= safe.threshold && remainingVotes + pTxn.approvers < safe.threshold) {
      // ptxn can only be deleted if the remaining votes cannot change the outcome of ptxn
      pTxn.status = ptxnConstants.STATUS_REJECT_READY;
    } else if (ownerVoted) {
      // required others to act
      pTxn.status = ptxnConstants.STATUS_PENDING;
    } else {
      // required owner to act
      pTxn.status = ptxnConstants.STATUS_NEED_CONFIRMATION;
    }

    return pTxn;
  };

  getPendingTxnLsigProgram = async (pTxn: PendingTxn) => {
    // get transaction notes from txnId
    if (pTxn.txnId === undefined) {
      throw new Error(errors.ERR_NO_LSIG_PROGRAM);
    }

    let lsig_program = "";
    let txnDetails;
    try {
      txnDetails = await AccountService.lookupTransaction(pTxn.txnId);
      lsig_program = txnDetails.transaction.note;
    } catch (err) {
      // lsig_program will be empty, urgent ptxn will be returned for user to remove
      // issue with purestake indexer returning cors error if txnId cannot be found
    }

    return lsig_program;
  };

  getPendingTxnPayload = async (lsig_address: string, dbdata?: any) => {
    if (dbdata === undefined) {
      try {
        // get data from db if not provided
        dbdata = await this.getPendingTxnFromDatabase(lsig_address);
      } catch (error) {
        return [];
      }
    }

    if (dbdata === null || dbdata?.payload?.transactions === undefined) {
      // no data found, unrecognized data format
      return [];
    }

    const payload = dbdata.payload.transactions;

    return payload.map((data: any) => {
      return algosdk.decodeUnsignedTransaction(Buffer.from(data.txn, "base64"));
    });
  };

  getCreatePendingTxn = async (safe: Safe, accAddr: string, txs: algosdk.Transaction[]) => {
    // Create a logic signature account
    const lsigSvc = new LsigService(this.algod);
    const lsa = await lsigSvc.createLsig(txs, safe.appId);
    const lsigAddr = lsa.lsa.address();
    const encodedProgram = lsa.result;

    // send payment txn of 100000 + 1000 microAlgos to LSIG address
    const lsigpaymentTxn = await txnbuilder.algoTransfer(this.algod, accAddr, lsigAddr, 1e5 + 1000);

    // nop app call
    let buf = new Uint8Array(1);
    buf[0] = 0x01;
    const nopTxn = await this.getNopTxn(safe.appId, accAddr, buf);

    buf = new Uint8Array(1);
    buf[0] = 0x02;
    const nop2Txn = await this.getNopTxn(safe.appId, accAddr, buf);

    // get latest expiry block round
    let expiryBlockRound = 0;
    txs.forEach((txn) => {
      if (txn.lastRound > expiryBlockRound) {
        expiryBlockRound = txn.lastRound;
      }
    });

    // sign lsig program
    const { data } = await axios.post(`${AppConfig.appURL}/api/program/sign`, { lsig_address: lsigAddr });

    // tx_create app call
    const appArgs = [
      encodeStringToByteArray(contract.APP_CALL_CREATE),
      encodeUint64(expiryBlockRound),
      base64ToByteArray(data.data),
    ];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [safe.master];
    const accounts: string[] = [lsigAddr];

    const note: Uint8Array = new Uint8Array(Buffer.from(encodedProgram, "base64"));

    const createTxn = await txnbuilder.callApp(
      this.algod,
      accAddr,
      safe.appId,
      appArgs,
      accounts,
      foreignApps,
      foreignAssets,
      undefined,
      note
    );

    // increase fees
    createTxn.fee *= 3;

    // returns atomic transfer with 4 txns
    let txns: algosdk.Transaction[] = [lsigpaymentTxn, nopTxn, nop2Txn, createTxn];
    txns = algosdk.assignGroupID(txns);

    return {
      txns,
      payload: txs,
      lsa,
    };
  };

  savePendingTxnPayloadToDatabase = async (
    accAddress: string,
    safe: Safe,
    txnBuilder: TransactionBuilder,
    lsig: algosdk.LogicSigAccount,
    encodedProgram: string,
    wcDetails?: { wc_id: string | null; peerMeta: string | null; rpc_id: string | null }
  ) => {
    const ptxnData = {
      safe_address: safe.address,
      safe_app_id: safe.appId,
      lsig_address: lsig.address(),
      lsig_program: encodedProgram,
      payload: txnBuilder,
      wc_id: wcDetails?.wc_id,
      peer_meta: wcDetails?.peerMeta,
      rpc_id: wcDetails?.rpc_id,
      acc_address: accAddress,
      initiator: accAddress,
    };

    const { data } = await axios.post(`${AppConfig.appURL}/api/pending-transaction/create`, ptxnData);
    return data;
  };

  pendingTxnIsExecuted = async (accAddress: string, safe: Safe, lsig_address: string) => {
    const ptxnData = {
      execution_status: ptxndb.STATUS_EXECUTED,
      safe_app_id: safe.appId,
      acc_address: accAddress,
    };

    return await this.updatePendingTxnInDatabase(lsig_address, ptxnData);
  };

  updatePendingTxnInDatabase = async (lsig_address: string, ptxnData: any) => {
    const { data } = await axios.patch(`${AppConfig.appURL}/api/pending-transaction/update/${lsig_address}`, ptxnData);

    return data;
  };

  getVotePendingTxn = async (pTxn: PendingTxn, accAddr: string, vote: number) => {
    // nop app call txn
    const nopTxn = await this.getNopTxn(pTxn.safe_app_id, accAddr);

    // app call tx_vote, 0 = reject, 1 = approve
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_VOTE), encodeUint64(pTxn.seq), encodeUint64(vote)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [];

    const voteTxn = await txnbuilder.callApp(
      this.algod,
      accAddr,
      pTxn.safe_app_id,
      appArgs,
      accounts,
      foreignApps,
      foreignAssets
    );

    // returns atomic transfer with 2 txns
    let txns: algosdk.Transaction[] = [nopTxn, voteTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getExecutePendingTxn = async (pTxn: PendingTxn, accAddr: string) => {
    // nop app call txn
    const nopTxn = await this.getNopTxn(pTxn.safe_app_id, accAddr);

    // app call tx_exec
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_EXECUTE), encodeUint64(pTxn.seq)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [pTxn.lsig_address];
    const txn = await txnbuilder.callApp(this.algod, accAddr, pTxn.safe_app_id, appArgs, accounts, foreignApps, foreignAssets);

    // requires additional fees to cover inner txn
    txn.fee *= 2;

    let txns: algosdk.Transaction[] = [nopTxn, txn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getNopTxn = async (safeId: number, accAddr: string, buf?: Uint8Array) => {
    // nop app call to increase opcode budget
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_NOP)];

    // if there are 2 nop calls involved, buf is used to differentiate the calls
    if (buf !== undefined) {
      appArgs.push(buf);
    }

    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [];

    return await txnbuilder.callApp(this.algod, accAddr, safeId, appArgs, accounts, foreignApps, foreignAssets);
  };

  getUndoRekeyTxn = async (lsig: algosdk.LogicSigAccount, safe: Safe, pTxnSender: string) => {
    // payment txn signed by LSIG to rekey safe from LSIG back to safe address
    const rekeyTxn = await txnbuilder.rekeyAccount(this.algod, safe.address, safe.address, safe.address);

    // rmv_p app call
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_REMOVE_P)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [];

    const removeTxn = await txnbuilder.callApp(
      this.algod,
      lsig.address(),
      safe.appId,
      appArgs,
      accounts,
      foreignApps,
      foreignAssets
    );

    // payment txn signed by LSIG to close account and return algos back to ptxn executor
    const closeAccTxn = await txnbuilder.closeAccount(this.algod, lsig.address(), lsig.address(), pTxnSender);

    // returns atomic transfer with 3 txns
    let txns: algosdk.Transaction[] = [rekeyTxn, removeTxn, closeAccTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  readApplications = async (safe: Safe, appConnector?: AppConnectorV2) => {
    let dappConnector;

    if (!appConnector) {
      dappConnector = new AppConnectorV2(safe);
    } else {
      dappConnector = appConnector;
    }

    await dappConnector.init();

    const connectedDapps = dappConnector.getConnectedDapps();
    const connectedV1Dapps = dappConnector.getConnectedV1Dapps();

    return { connectedDapps, connectedV1Dapps };
  };

  clearApps = async (safe: Safe) => {
    const dappConnector = new AppConnectorV2(safe);
    await dappConnector.init();
    await dappConnector.disconnectAll();
  };

  getSelectedSafeFromStorage = () => {
    try {
      const safe: Safe = JSON.parse(localStorage.getItem(SELECTED_SAFE) || "");
      return safe;
    } catch (e) {
      return null;
    }
  };

  parsePendingTransactionID = (keyData: any) => {
    const bufferData = Buffer.from(keyData, "base64");

    return Number(Buffer.from(bufferData.subarray(0, 8)).readBigUInt64BE());
  };

  parseOwnerData = (valueData: any) => {
    const bufferData = Buffer.from(valueData, "base64");

    // addr
    let tmp = bufferData.subarray(0, 32);
    const addr = algosdk.encodeAddress(tmp);

    // length of name
    tmp = bufferData.subarray(32, 40);
    const len = tmp.readBigUInt64BE();

    // current ptxn count
    tmp = bufferData.subarray(40, 41);
    const ptxn_count = Number(tmp.readUint8(0));

    // name
    tmp = bufferData.subarray(41, 41 + Number(len));
    const name = tmp.toString();

    return {
      name,
      addr,
      ptxn_count,
    };
  };

  parsePendingTransactionData = (valueData: any) => {
    const bufferData = Buffer.from(valueData, "base64");

    // Parse the address
    let tmp = bufferData.subarray(0, 32);
    const ca = algosdk.encodeAddress(tmp);

    // Parse the Approvers
    tmp = bufferData.subarray(32, 33);
    const approvers = Number(tmp.readUint8(0));

    // Parse the Rejections
    tmp = bufferData.subarray(33, 34);
    const rejections = Number(tmp.readUint8(0));

    // Parse the transaction ID Len
    tmp = bufferData.subarray(34, 66);
    const txnId = base32.encode(tmp).toString().slice(0, 52); // removing the extra '===='

    // Address that creates the ca
    tmp = bufferData.subarray(66, 98);
    const sender = algosdk.encodeAddress(tmp);

    // Expiry block round
    tmp = bufferData.subarray(98, 106);
    const expiry = Number(tmp.readBigUInt64BE());

    return {
      ca,
      approvers,
      rejections,
      txnId,
      sender,
      expiry,
    };
  };

  parseDeleteTransactionData = (valueData: any) => {
    const bufferData = Buffer.from(valueData, "base64");

    // Parse the Approvers
    let tmp = bufferData.subarray(0, 8);
    const approvers = Number(tmp.readBigUInt64BE());

    // Parse the Rejections
    tmp = bufferData.subarray(8, 16);
    const rejections = Number(tmp.readBigUInt64BE());

    // Transaction ID
    tmp = bufferData.subarray(16, 48);
    const txnId = algosdk.encodeAddress(tmp);

    // Address that submitted this txn
    tmp = bufferData.subarray(48, 80);
    const initiator = algosdk.encodeAddress(tmp);

    return {
      approvers,
      rejections,
      txnId,
      initiator,
    };
  };

  getSafeGlobalState = async (appId: number) => {
    // print global state
    const safeApp = await this.algod.getApplicationByID(appId).do();
    const gsmap = new Map();
    const states = safeApp.params["global-state"];
    states.forEach((state: any) => {
      let stateKey = Buffer.from(state.key, "base64").toString();

      const sk_bytes = new Uint8Array(Buffer.from(state.key, "base64"));

      // decode ptxn related data
      let ptxn_data = null;
      let ptxn_id = null;
      if (sk_bytes.length === 8 && stateKey !== "owner_10") {
        ptxn_id = this.parsePendingTransactionID(state.key);
        ptxn_data = this.parsePendingTransactionData(state.value.bytes);
      }

      // decode ptxn approval data
      let ptxna_data = null;
      let ptxna_id = null;
      if (sk_bytes.length === 10 && sk_bytes[8] === 95 && sk_bytes[9] === 97) {
        ptxna_id = this.parsePendingTransactionID(state.key);
        ptxna_data = new Uint8Array(Buffer.from(state.value.bytes, "base64"));
      }

      // decode owner entries
      let owner_data = null;
      if (stateKey.includes("owner_")) {
        owner_data = this.parseOwnerData(state.value.bytes);
      }

      let formattedValue;
      if (state.value.type === 1) {
        // decode bytes to get string value
        formattedValue = Buffer.from(state.value.bytes, "base64").toString();
      } else {
        formattedValue = state.value.uint;
      }

      // replace map key for ptxn related data so we can fetch from global state easily
      if (ptxn_id !== null) {
        stateKey = ptxn_id.toString();
      } else if (ptxna_id !== null) {
        stateKey = ptxna_id.toString() + "_a";
      }

      // get delete data if any
      let delete_data = null;
      if (stateKey === "d") {
        delete_data = this.parseDeleteTransactionData(state.value.bytes);
      }

      let votingStatus = null;
      if (stateKey === "0_a") {
        votingStatus = new Uint8Array(Buffer.from(state.value.bytes, "base64"));
      }

      gsmap.set(stateKey, {
        key: stateKey,
        rawKey: state.key,
        rawValue: state.value,
        formattedValue,
        owner_data,
        ptxn:
          ptxn_id !== null
            ? {
                id: ptxn_id,
                ...ptxn_data,
              }
            : null,
        ptxna:
          ptxna_id !== null
            ? {
                id: ptxna_id,
                data: ptxna_data,
              }
            : null,
        deletetxn:
          delete_data !== null
            ? {
                ...delete_data,
              }
            : null,
        deletetxn_a: votingStatus !== null ? votingStatus : null,
      });
    });

    return gsmap;
  };

  getDeleteExpiredPendingTxn = async (pTxn: PendingTxn, senderAddr: string) => {
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_REMOVE_EXPIRED), encodeUint64(pTxn.seq)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [pTxn.lsig_address];
    const txn = await txnbuilder.callApp(this.algod, senderAddr, pTxn.safe_app_id, appArgs, accounts, foreignApps, foreignAssets);

    let txns: algosdk.Transaction[] = [txn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getVoteOrDeleteSafeTxn = async (safe: Safe, senderAddr: string, vote?: number) => {
    // nop app call
    const nopTxn = await this.getNopTxn(safe.appId, senderAddr);

    // del_safe app call
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_DELETE_SAFE)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [];

    // add voting if available
    if (vote !== undefined) {
      appArgs.push(encodeUint64(vote));
    }

    const removeTxn = await txnbuilder.callApp(this.algod, senderAddr, safe.appId, appArgs, accounts, foreignApps, foreignAssets);

    let txns: algosdk.Transaction[] = [nopTxn, removeTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getExecuteDeleteSafeTxn = async (safe: Safe, senderAddr: string) => {
    const deleteAppTxn = await txnbuilder.deleteApp(this.algod, senderAddr, safe.appId);

    let txns: algosdk.Transaction[] = [deleteAppTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  getCancelDeleteSafeTxn = async (safe: Safe, senderAddr: string) => {
    // del_safe_cancel app call
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_CANCEL_DELETE_SAFE)];
    const foreignAssets: number[] = [];
    const foreignApps: number[] = [];
    const accounts: string[] = [];

    const cancelDeleteTxn = await txnbuilder.callApp(
      this.algod,
      senderAddr,
      safe.appId,
      appArgs,
      accounts,
      foreignApps,
      foreignAssets
    );

    let txns: algosdk.Transaction[] = [cancelDeleteTxn];
    txns = algosdk.assignGroupID(txns);

    return txns;
  };

  processPendingTxnPayload = async (safe: Safe, lsig_address: string, lsig_program: string, appConnector?: AppConnectorV2) => {
    // get db data
    const dbdata = await this.getPendingTxnFromDatabase(lsig_address);

    // get payload
    const payload = await this.getPendingTxnPayload(lsig_address, dbdata);

    if (payload.length === 0) {
      throw new Error(errors.ERR_PAYLOAD_DATA_ERROR);
    }

    // is this ptxn dapp related?
    if (!dbdata.rpc_id) {
      const lsig = new algosdk.LogicSigAccount(new Uint8Array(Buffer.from(lsig_program, "base64")));

      // sign entire payload with lsig
      const signedBlobs = payload.map((tx: algosdk.Transaction) => {
        const signed_txn = algosdk.signLogicSigTransaction(tx, lsig);
        return signed_txn.blob;
      });

      const response = await this.submitSignedTxns(signedBlobs);

      return {
        payload,
        response,
      };
    } else {
      if (!appConnector) {
        throw new Error(errors.ERR_APP_CONNECTOR_NOT_FOUND);
      }

      // dapp related
      const dappResponse = await this.submitPayloadToDapp(lsig_address, lsig_program, appConnector);

      return {
        payload,
        response: dappResponse,
      };
    }
  };

  processUndoRekey = async (lsig_program: string, safe: Safe, pTxnSender: string) => {
    // setup lsig
    const lsig = new algosdk.LogicSigAccount(new Uint8Array(Buffer.from(lsig_program, "base64")));

    // get undo rekey txns
    const txns = await this.getUndoRekeyTxn(lsig, safe, pTxnSender);

    // sign txns
    const signedBlobs = txns.map((tx) => {
      const signed_txn = algosdk.signLogicSigTransaction(tx, lsig);
      return signed_txn.blob;
    });

    return await this.submitSignedTxns(signedBlobs);
  };

  submitSignedTxns = async (signedBlobs: Uint8Array[]) => {
    // get last txn in payload
    const { txn } = algosdk.decodeSignedTransaction(signedBlobs[signedBlobs.length - 1]);

    // send payload
    const response = await this.algod.sendRawTransaction(signedBlobs).do();

    // wait for confirmation on last txn
    const confirmtion = await algosdk.waitForConfirmation(this.algod, txn.txID(), 30);

    return {
      response,
      confirmtion,
    };
  };

  processExecutedPendingTxn = async (accAddress: string, ptxn: PendingTxn, safe: Safe, appConnector?: AppConnectorV2) => {
    // Make sure getExecutePendingTxn() is called first before calling this.

    // update ptxn data to db
    const ptxnData = {
      db_seq: ptxn.seq,
      db_txnId: ptxn.txnId,
      db_approvers: ptxn.approvers,
      db_rejections: ptxn.rejections,
      db_votingStatus: ptxn.votingStatus,
      db_expiry: ptxn.expiry,
      safe_app_id: safe.appId,
      acc_address: accAddress,
    };

    // let this throw error - esp 401 unauthorized error so that FE can trigger auth token generation
    await this.updatePendingTxnInDatabase(ptxn.lsig_address, ptxnData);

    // submit ptxn payload
    const processResult = await this.processPendingTxnPayload(safe, ptxn.lsig_address, ptxn.lsig_program as string, appConnector);

    // do not proceed further if payload submission fails
    if (!processResult.response) {
      throw new Error(errors.ERR_SUBMIT_PAYLOAD);
    }

    // undo rekey
    const undorekey_response = await this.processUndoRekey(ptxn.lsig_program as string, safe, ptxn.sender);

    // mark ptxn executed
    const executed_response = await this.pendingTxnIsExecuted(accAddress, safe, ptxn.lsig_address);

    return {
      undorekey_response,
      executed_response,
    };
  };

  resolveExecutingPendingTxn = async (accAddress: string, safe: Safe, appConnector?: AppConnectorV2) => {
    // continue ptxn from where we left off by process pending txn "p"
    if (safe.executingTransaction === undefined) {
      throw new Error(errors.ERR_NO_P_FOUND);
    }

    const execTxn = safe.executingTransaction;
    const lsig_address = execTxn.lsig_address;
    const pTxnSender = execTxn.sender;

    // get program from chain
    const lsig_program = execTxn.lsig_program;
    if (lsig_program === undefined) {
      throw new Error(errors.ERR_NO_LSIG_PROGRAM);
    }

    interface ResProcessPtxn {
      response?: any;
      confirmtion?: Record<string, any>;
    }

    interface ResTxns {
      payload_response: ResProcessPtxn;
      undorekey_response: ResProcessPtxn;
      executed_response: any;
    }

    const res: ResTxns = {
      payload_response: {},
      undorekey_response: {},
      executed_response: {},
    };

    // process payload
    const processResult = await this.processPendingTxnPayload(safe, lsig_address, lsig_program, appConnector);
    if (processResult.response) {
      res.payload_response = processResult.response;
    } else {
      // do not proceed further if payload submission fails
      throw new Error(errors.ERR_SUBMIT_PAYLOAD);
    }

    // undo rekey
    const undorekey_response = await this.processUndoRekey(lsig_program, safe, pTxnSender);
    if (undorekey_response?.response) {
      res.undorekey_response = undorekey_response;
    }

    // mark ptxn executed
    const executed_response = await this.pendingTxnIsExecuted(accAddress, safe, lsig_address);
    if (executed_response?.response) {
      res.executed_response = executed_response;
    }

    return res;
  };

  getPendingTxnFromDatabase = async (lsig_address: string) => {
    // call database to get payload details
    try {
      const { data } = await axios.get(`${AppConfig.appURL}/api/pending-transaction/${lsig_address}`);
      return data.data;
    } catch (e) {
      // console.log(e);
      throw new Error(errors.ERR_FETCH_PTXN_DB);
    }
  };

  getUrgentPtxn = async (safe: Safe, appGS?: Map<any, any>) => {
    if (appGS === undefined) {
      appGS = await this.getSafeGlobalState(safe.appId);
    }

    // check for executing transaction
    const executingTxnData = appGS.get(contract.GS_EXECUTING_TXN)?.rawValue.bytes;
    if (executingTxnData === undefined) {
      return;
    }

    const parsed = this.parsePendingTransactionData(executingTxnData);
    const lsig_address = parsed.ca;

    // get program from chain
    let lsig_program = "";
    let txnDetails;
    try {
      txnDetails = await AccountService.lookupTransaction(parsed.txnId);
      lsig_program = txnDetails.transaction.note;
    } catch (err) {
      // lsig_program will be empty, urgent ptxn will be returned for user to remove
      // issue with purestake indexer returning cors error if txnId cannot be found
    }

    // get payload from db
    const dbdata = await this.getPendingTxnFromDatabase(lsig_address);
    const payload = await this.getPendingTxnPayload(lsig_address, dbdata);

    // can't proceed w/o payload data
    if (payload.length === 0) {
      return;
    }

    // parse info from payload
    const parsedPayload = await this.parsePendingTxnPayload(payload);

    // get dapp name if any
    const dappName = dbdata.peer_meta !== null ? dbdata.peer_meta.name : null;

    // get pending txn expiry datetime
    const nodeStatus = await this.algod.status().do();
    const latestBlockRound = parsed.expiry;
    const currRound = nodeStatus["last-round"];

    const now = new Date();
    const expiry = new Date();

    // if timestamp is invalid, assume ptxn has expired
    if (new Date(latestBlockRound).getTime() > 0 && currRound < latestBlockRound) {
      // get remaining duration
      const duration = Math.floor((latestBlockRound - currRound) * BLOCK_TIME);
      expiry.setSeconds(+expiry.getSeconds() + duration);
    }

    // determine ptxn status
    let urgentTxnStatus;
    let canExecute = false;
    if (expiry <= now) {
      // expired
      urgentTxnStatus = ptxnConstants.STATUS_EXPIRED;
    } else if (parsed.approvers >= safe.threshold) {
      // urgent ptxn doesn't deal with execution of rejected ptxn
      canExecute = true;
      // ready to execute
      urgentTxnStatus = ptxnConstants.STATUS_READY;
    }

    //set total fee
    let totalFees = 0;
    payload?.forEach((item: any) => (totalFees += item.fee));

    return {
      ...parsed,
      lsig_address,
      lsig_program,
      payload,
      expiry,
      parsedPayload,
      status: urgentTxnStatus,
      canExecute,
      dappName,
      totalFees,
      votingStatus: dbdata.db_votingStatus,
    };
  };

  getDeleteSafePtxn = async (safe: Safe, accAddr: string, appGS?: Map<any, any>) => {
    if (appGS === undefined) {
      appGS = await this.getSafeGlobalState(safe.appId);
    }

    // check for delete safe data
    const deleteGS = appGS.get(contract.GS_DELETE);
    if (deleteGS === undefined) {
      return;
    }

    const deleteGSAppr = appGS.get(contract.GS_DELETE_APPROVAL_DATA);

    // check approval data
    if (deleteGSAppr.deletetxn_a === undefined) {
      return;
    }

    let ownerVoted = false;
    let votingStatus = null;
    votingStatus = safe.owners.map((owner, index) => {
      let deleteVoteStatus = ptxnConstants.VOTE_NO_ACTION;
      if (deleteGSAppr.deletetxn_a[index] === 1) {
        deleteVoteStatus = ptxnConstants.VOTE_CONFIRM;
      } else if (deleteGSAppr.deletetxn_a[index] === 2) {
        deleteVoteStatus = ptxnConstants.VOTE_REJECT;
      }

      if (owner.addr === accAddr) {
        ownerVoted = deleteGSAppr.deletetxn_a[index] !== 0;
      }

      return {
        owner,
        vote: deleteGSAppr.deletetxn_a[index],
        status: deleteVoteStatus,
      };
    });

    // determine delete request status
    let deleteStatus = ptxnConstants.STATUS_NEED_CONFIRMATION;
    const num_owners = safe.owners.length;
    let canExecute = false;
    if (deleteGS.deletetxn.approvers >= safe.threshold || deleteGS.deletetxn.rejections >= safe.threshold) {
      // ready to execute
      canExecute = true;
      deleteStatus =
        deleteGS.deletetxn.approvers >= safe.threshold ? ptxnConstants.STATUS_READY : ptxnConstants.STATUS_REJECT_READY;
    } else if (
      deleteGS.deletetxn.approvers + deleteGS.deletetxn.rejections == num_owners &&
      deleteGS.deletetxn.approvers < safe.threshold &&
      deleteGS.deletetxn.rejections < safe.threshold
    ) {
      // deadlock detected
      canExecute = true;
      deleteStatus = ptxnConstants.STATUS_REJECT_READY;
    } else if (ownerVoted) {
      // required others to act
      deleteStatus = ptxnConstants.STATUS_PENDING;
    }

    return {
      ...deleteGS.deletetxn,
      votingStatus,
      canExecute,
      status: deleteStatus,
    };
  };

  parsePendingTxnPayload = async (payload: algosdk.Transaction[]) => {
    const ns = new NftService();

    // format for display on frontend
    return await Promise.all(
      payload.map(async (currTxn) => {
        let payloadType = null;
        let payloadTxType = null;
        let payloadAssetName = null;
        let payloadAssetUnitName = null;
        let payloadIsNft = false;
        let payloadNftImgUrl = null;
        let payloadAmount = 0;
        let payloadFee = 0;
        let payloadDirection = null;
        let payloadAssetDecimals = 0;
        let payloadAssetID = null;
        let payloadAppID = null;
        let payloadFrom = null;
        let payloadTo = null;
        let payloadFreezeAddress = null;
        let payloadClawbackAddress = null;
        let payloadManagerAddress = null;
        let payloadIsAssetFrozen = false;
        let payloadCloseRemainderTo = null;
        let payloadUIType = uitypes.UI_OTHERS;
        let payloadExpiryDate = null;

        // determine sender and receiver
        currTxn.fee = algosdk.microalgosToAlgos(currTxn.fee ?? 0); //convert microAlgos to Algos

        switch (currTxn.type) {
          case "pay":
            payloadType = ptxnConstants.PAYLOAD_PAY;
            payloadTxType = "asset-send";
            payloadAssetName = "ALGO";
            payloadAssetUnitName = "ALGO";
            payloadAmount = Number(currTxn.amount === undefined ? 0 : currTxn.amount);
            payloadFee = Number(currTxn.fee);
            payloadAssetDecimals = 6;
            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);
            payloadTo = algosdk.encodeAddress(currTxn.to.publicKey);
            payloadUIType = uitypes.UI_SEND;

            // payloadDirection will be deprecated due to new UI
            payloadDirection = ptxnConstants.DIR_SEND;

            break;
          case "axfer":
            if (currTxn.amount === 0 || currTxn.amount === undefined) {
              payloadType = ptxnConstants.PAYLOAD_ASSET_OPT_IN;
              payloadUIType = uitypes.UI_NEW_ASSET;
            } else {
              payloadType = ptxnConstants.PAYLOAD_ASSET_TRANSFER;
              payloadUIType = uitypes.UI_SEND;
              payloadAmount = Number(currTxn.amount);

              if (currTxn.closeRemainderTo !== undefined) {
                payloadType = ptxnConstants.PAYLOAD_CLOSE_ASSET;
                payloadUIType = uitypes.UI_REMOVE_ASSET;
                payloadCloseRemainderTo = algosdk.encodeAddress(currTxn.closeRemainderTo.publicKey);
              }
            }

            // payloadDirection will be deprecated due to new UI
            payloadDirection = ptxnConstants.DIR_SEND;

            // attempt to fetch asset
            try {
              const ptxnAsset = await getAsset(this.algod, currTxn.assetIndex);
              payloadAssetName = ptxnAsset.params.name ?? null;
              payloadAssetUnitName = ptxnAsset.params["unit-name"] ?? null;
              payloadAssetDecimals = ptxnAsset.params.decimals;
              payloadAssetID = currTxn.assetIndex;
              const isNft = ptxnAsset.params.url.includes("ipfs:");

              //if the asset is nft
              if (isNft) {
                const { url } = await ns.formatNft(payloadAssetID);
                payloadNftImgUrl = url;
                payloadIsNft = true;
              }
            } catch (error) {
              // console.log(`Error fetching asset details from ${currTxn.assetIndex}: `, error);
            }

            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);
            payloadTo = algosdk.encodeAddress(currTxn.to.publicKey);
            payloadFee = Number(currTxn.fee);

            //determine type of txns
            if (currTxn.assetRevocationTarget) {
              payloadClawbackAddress = algosdk.encodeAddress(currTxn.assetRevocationTarget.publicKey);
              payloadTxType = "asset-clawback";
              payloadType = ptxnConstants.PAYLOAD_ASSET_CLAWBACK;
            } else if (currTxn.closeRemainderTo) {
              payloadTxType = "asset-remove";
              payloadType = ptxnConstants.PAYLOAD_ASSET_REMOVE;
              payloadCloseRemainderTo = algosdk.encodeAddress(currTxn?.closeRemainderTo?.publicKey);
            } else if (!currTxn.amount) {
              payloadTxType = "asset-new";
              payloadType = ptxnConstants.PAYLOAD_ASSET_NEW;
            } else {
              payloadTxType = "asset-send";
              payloadType = ptxnConstants.PAYLOAD_ASSET_SEND;
            }

            break;
          case "afrz":
            payloadTxType = "asset-freeze";
            payloadType = ptxnConstants.PAYLOAD_ASSET_FREEZE;
            payloadFee = Number(currTxn.fee);
            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);
            payloadFreezeAddress = algosdk.encodeAddress(currTxn.freezeAccount.publicKey);
            payloadIsAssetFrozen = currTxn.freezeState;

            // attempt to fetch asset
            try {
              const ptxnAsset = await getAsset(this.algod, currTxn.assetIndex);
              payloadAssetName = ptxnAsset.params.name ?? null;
              payloadAssetUnitName = ptxnAsset.params["unit-name"] ?? null;
              payloadAssetDecimals = ptxnAsset.params.decimals;
              payloadAssetID = currTxn.assetIndex;
            } catch (error) {
              // console.log(`Error fetching asset details from ${currTxn.assetIndex}: `, error);
            }

            break;
          case "acfg":
            payloadFee = Number(currTxn.fee);
            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);

            if (!currTxn.assetManager && !currTxn.assetFreeze && !currTxn.assetRevocationTarget) {
              payloadTxType = "asset-destroy";
              payloadType = ptxnConstants.PAYLOAD_ASSET_DESTROY;
            } else if (currTxn.assetManager && !currTxn.assetIndex) {
              payloadManagerAddress = algosdk.encodeAddress(currTxn.assetManager.publicKey);
              payloadTxType = "asset-create";
              payloadType = ptxnConstants.PAYLOAD_ASSET_CREATE;
            } else {
              payloadManagerAddress = currTxn.assetManager && algosdk.encodeAddress(currTxn.assetManager.publicKey);
              payloadFreezeAddress = currTxn.assetFreeze && algosdk.encodeAddress(currTxn.assetFreeze.publicKey);
              payloadClawbackAddress = currTxn.assetRevocationTarget
                ? algosdk.encodeAddress(currTxn.assetRevocationTarget.publicKey)
                : "";
              payloadTxType = "asset-modify";
              payloadType = ptxnConstants.PAYLOAD_ASSET_MODIFY;
            }

            if (currTxn.assetIndex) {
              try {
                const ptxnAsset = await getAsset(this.algod, currTxn.assetIndex);
                payloadAssetName = ptxnAsset.params.name ?? null;
                payloadAssetUnitName = ptxnAsset.params["unit-name"] ?? null;
                payloadAssetDecimals = ptxnAsset.params.decimals;
                payloadAssetID = currTxn.assetIndex;
              } catch (error) {
                // console.log(`Error fetching asset details from ${currTxn.assetIndex}: `, error);
              }
            }

            break;
          case "keyreg":
            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);
            payloadFee = Number(currTxn.fee);
            payloadTxType = "key-registration";
            payloadType = ptxnConstants.PAYLOAD_KEY_REGISTRATION;

            break;
          case "appl":
            payloadDirection = "Application Call";
            payloadType = ptxnConstants.PAYLOAD_APPL;
            payloadUIType = uitypes.UI_APP_CALL;
            payloadAppID = currTxn.appIndex;
            payloadFrom = algosdk.encodeAddress(currTxn.from.publicKey);
            payloadFee = Number(currTxn.fee);

            switch (currTxn.appOnComplete) {
              case 1:
                if (currTxn.group) {
                  payloadTxType = "dapp-optin";
                  payloadType = ptxnConstants.PAYLOAD_APP_OPTIN;
                } else {
                  payloadTxType = "dapp";
                  payloadType = ptxnConstants.PAYLOAD_APPL;
                }
                break;
              case 2:
                payloadTxType = "dapp-closeout";
                payloadType = ptxnConstants.PAYLOAD_APP_CLOSEOUT;
                break;
              case 3:
                payloadTxType = "dapp-clear";
                payloadType = ptxnConstants.PAYLOAD_APP_CLEAR;
                break;
              case 4:
                payloadTxType = "dapp-update";
                payloadType = ptxnConstants.PAYLOAD_APP_UPDATE;
                break;
              case 5:
                payloadTxType = "dapp-delete";
                payloadType = ptxnConstants.PAYLOAD_APP_DELETE;
                break;
              default:
                break;
            }

            if (!currTxn.appOnComplete && !currTxn.appIndex) {
              payloadTxType = "dapp-create";
              payloadType = ptxnConstants.PAYLOAD_APP_CREATE;
            }

            break;
          default:
            break;
        }

        // estimate expiry date
        const expiryTS = (currTxn.lastRound - currTxn.firstRound) * BLOCK_TIME * 1000;
        payloadExpiryDate = moment(Date.now() + Math.floor(expiryTS))
          .local()
          .format("MMM DD, YYYY - hh:mm:ss A");

        return {
          payloadType,
          payloadTxType,
          payloadAssetName,
          payloadAssetUnitName,
          payloadIsNft,
          payloadNftImgUrl,
          payloadAssetID,
          payloadAssetDecimals,
          payloadAmount,
          payloadFee,
          payloadDirection,
          displayAmount: payloadAmount / Math.pow(10, payloadAssetDecimals),
          payloadAppID,
          payloadFrom,
          payloadTo,
          payloadFreezeAddress,
          payloadClawbackAddress,
          payloadIsAssetFrozen,
          payloadManagerAddress,
          payloadCloseRemainderTo,
          payloadUIType,
          payloadExpiryDate,
        };
      })
    );
  };

  decodeProgram = async (lsig_program: string) => {
    const payload = {
      lsig: lsig_program,
    };

    const { data } = await axios.post(`${AppConfig.appURL}/api/disassemble`, payload);

    return data;
  };

  getSafeMinAmountForAlgos = async (safe: Safe) => {
    // check if safe has enough algos
    const safeAcc = await AccountService.getAccountInfo(safe.address);

    // need to reserve algos to handle execution of ptxn where the safe is required to pay during undo rekey process
    // send payload | undo rekey
    const reserved = 2 * 1000;

    // safeAcc.minBalance returns undefined so we will use safeAcc["min-balance"] instead
    // @ts-ignore
    return Number(safeAcc["min-balance"]) + reserved;
  };

  safeHasEnoughAlgos = async (safeAddr: string) => {
    const safeAcc = await AccountService.getAccountInfo(safeAddr);

    const reserved = 2 * 1000;

    // safeAcc.minBalance returns undefined so we will use safeAcc["min-balance"] instead
    // @ts-ignore
    return Number(safeAcc.balance) > Number(safeAcc["min-balance"]) + reserved;
  };

  getSafeMaxWithdrawable = async (address: string) => {
    // check if safe has enough algos
    const safeAcc = await AccountService.getAccountInfo(address);

    // need to reserve algos to handle execution of ptxn where the safe is required to pay during undo rekey process
    // send payload | undo rekey
    const reserved = 2 * 1000;

    // safeAcc.minBalance returns undefined so we will use safeAcc["min-balance"] instead
    // @ts-ignore
    const withdrawable = Number(safeAcc.amount) - Number(safeAcc["min-balance"]) - reserved;

    return withdrawable > 0 ? withdrawable : 0;
  };

  submitPayloadToDapp = async (lsig_address: string, lsig_program: string, appConnector: AppConnectorV2) => {
    const dbdata = await this.getPendingTxnFromDatabase(lsig_address);

    if (!dbdata) {
      throw new Error(errors.ERR_PTXN_DB);
    }

    // get wallet connect ID
    const wc_id = dbdata.wc_id;

    // get app connector
    const connectedDapp = await DappService.getConnectedDapp(appConnector, wc_id);

    if (!connectedDapp) {
      throw new Error(errors.ERR_APP_CONNECTOR_NOT_FOUND);
    }

    // setup lsig
    const lsig = new algosdk.LogicSigAccount(new Uint8Array(Buffer.from(lsig_program, "base64")));

    // sign the payload accordingly - returns base64 encoded signed txn or null
    // https://developer.algorand.org/docs/get-details/walletconnect/walletconnect-schema/
    const payload = dbdata.payload.transactions;
    const signedPayload = payload.map((t: any) => {
      if (t.signer === signerType.SIGNER_LSIG) {
        const decodedTxn = algosdk.decodeUnsignedTransaction(Buffer.from(t.txn, "base64"));
        const signed_txn = algosdk.signLogicSigTransaction(decodedTxn, lsig);

        return Buffer.from(signed_txn.blob).toString("base64");
      }

      return null;
    });

    // approve request via connector
    if (connectedDapp instanceof AppConnector) {
      await connectedDapp.approveRequest(Number(dbdata.rpc_id), signedPayload);
    } else {
      await appConnector.approveRequest(Number(dbdata.rpc_id), connectedDapp.topic, signedPayload);
    }

    // wait for confirmation
    let confirmation = null;
    const lastTxn = algosdk.decodeUnsignedTransaction(Buffer.from(payload[payload.length - 1]["txn"], "base64"));
    if (lastTxn) {
      confirmation = await algosdk.waitForConfirmation(this.algod, lastTxn.txID(), 10);
    }

    return confirmation;
  };

  callMasterContract = async (senderAddr: string, appArgs: any, accounts: any) => {
    const masterID = AppConfig.masterId;
    const suggestedParams = await this.algod.getTransactionParams().do();

    // when signing this txn in FE, convert this result using convertToTxnBuilder() from wallet service before signing and submitting it
    if (accounts.length > 0) {
      return algosdk.makeApplicationNoOpTxnFromObject({
        from: senderAddr,
        appIndex: masterID,
        suggestedParams,
        appArgs,
        accounts,
      });
    } else {
      return algosdk.makeApplicationNoOpTxnFromObject({
        from: senderAddr,
        appIndex: masterID,
        suggestedParams,
        appArgs,
      });
    }
  };

  masterUpdateTreasury = async (senderAddr: string, newAddress: string) => {
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_MASTER_TREASURY_UPDATE)];
    const accounts = [newAddress];
    return await this.callMasterContract(senderAddr, appArgs, accounts);
  };

  masterUpdateFee = async (senderAddr: string, amount: number) => {
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_MASTER_FEE_UPDATE), encodeUint64(amount as number)];
    return await this.callMasterContract(senderAddr, appArgs, []);
  };

  masterUpdateMinTopup = async (senderAddr: string, amount: number) => {
    const appArgs = [encodeStringToByteArray(contract.APP_CALL_MASTER_MIN_TOPUP_UPDATE), encodeUint64(amount as number)];
    return await this.callMasterContract(senderAddr, appArgs, []);
  };

  masterUpdatePublicKey = async (senderAddr: string, newPublicKey: string) => {
    const appArgs = [
      encodeStringToByteArray(contract.APP_CALL_MASTER_PUBLIC_KEY_UPDATE),
      new Uint8Array(Buffer.from(newPublicKey, "base64")),
    ];
    return await this.callMasterContract(senderAddr, appArgs, []);
  };

  getMasterAdminConfig = async (masterId: number) => {
    const appGS = await getEntireGlobalState(this.algod, masterId);

    const globalStates: any = {};
    const plainObjects: any = Object.fromEntries(appGS);
    Object.keys(plainObjects).forEach(function (key) {
      if (key !== "addr" && key !== "admin") {
        globalStates[key] = plainObjects[key]?.rawValue?.bytes
          ? plainObjects[key]?.rawValue?.bytes
          : plainObjects[key]?.rawValue?.uint;
      }
    });

    const treasuryAddr = algosdk.encodeAddress(Buffer.from(appGS.get(contract.GS_TREASURY)?.rawValue.bytes, "base64"));

    return {
      global_states: globalStates,
      treasury_addr: treasuryAddr,
    };
  };

  saveSafeToDatabase = async (accAddress: string, safe: Safe) => {
    const safeData = {
      safe_address: safe.address,
      safe_app_id: safe.appId, // used for auth purposes also
      safe_name: safe.name,
      threshold: safe.threshold,
      master: safe.master,
      num_owners: safe.num_owners,
      creator: accAddress,
      owners: safe.owners,
      acc_address: accAddress, // for auth purposes
    };

    const { data } = await axios.post(`${AppConfig.appURL}/api/safe/create`, safeData);
    return data;
  };

  getSafeMigrationViaSafeId = async (safeId: number) => {
    // fetch earliest migration for safe
    const { data } = await axios.get(`${AppConfig.appURL}/api/safe-migration/from/${safeId}`);

    return data;
  };

  getSafeMigration = async (migrationId: number) => {
    // fetch safe migration
    const { data } = await axios.get(`${AppConfig.appURL}/api/safe-migration/${migrationId}`);

    return data;
  };

  getCompletedSafeMigrations = async () => {
    // fetch all completed safe migration
    const { data } = await axios.get(`${AppConfig.appURL}/api/safe-migration?migrate_status=${migratesafedb.MIGRATE_COMPLETE}`);

    return data;
  };

  getVerifiedAsset = async () => {
    // fetch all verified assets
    const { data } = await axios.get(`${AppConfig.appURL}/api/verified-assets`);

    return data;
  };

  getNfdDomainName = async (addr: string | string[]) => {
    //check input is array
    const isArray = Array.isArray(addr);

    try {
      // switch url depending on network
      let url = AppConfig.nfdUrlLookup;
      if (AppConfig.isTestNet()) {
        url = AppConfig.nfdUrlLookup_testnet;
      }

      if (isArray) {
        const combineAddress = addr.join("&address=");
        const res = await axios.get(`${url}lookup?address=${combineAddress}`);
        return res.data;
      } else {
        const res = await axios.get(`${url}lookup?address=${addr}`);

        return res.data[addr];
      }
    } catch (e) {
      return null;
    }
  };

  createSafeMigration = async (from_safe: number, to_safe: number, accAddr: string) => {
    // record how many assets to transfer
    const safeAddr = algosdk.getApplicationAddress(from_safe);
    const { assets } = await AccountService.lookupAccountAssets(safeAddr);

    // create migration record once you have the new safe ID
    const smData = {
      from_safe,
      to_safe,
      acc_address: accAddr,
      safe_app_id: from_safe,
      assets_to_transfer: assets.length,
    };

    const { data } = await axios.post(`${AppConfig.appURL}/api/safe-migration/create`, smData);

    return data;
  };

  completeSafeMigration = async (from_safe: number, migrationId: number, accAddr: string) => {
    // sets the migration to completed
    const smData = {
      acc_address: accAddr,
      safe_app_id: from_safe,
    };

    const { data } = await axios.patch(`${AppConfig.appURL}/api/safe-migration/complete/${migrationId}`, smData);

    return data;
  };

  reimbursedSafeMigration = async (from_safe: number, migrationId: number, accAddr: string) => {
    // sets datetime for the safe reimbursement
    const smData = {
      acc_address: accAddr,
      safe_app_id: from_safe,
    };

    const { data } = await axios.patch(`${AppConfig.appURL}/api/safe-migration/reimbursed/${migrationId}`, smData);

    return data;
  };

  saveAlgoTransferPtxnForSafeMigration = async (from_safe: Safe, migrationId: number, accAddr: string) => {
    // this is to be called after getMigrateAlgosToSafePendingTxn() is executed

    // fetch latest safe data
    const from_safe_2 = await this.getSafe(from_safe.appId);

    // assume latest sequence number is the algo transfer ptxn
    const transfer_algo_ptxn_id = from_safe_2.sequence;

    if (transfer_algo_ptxn_id === 0) {
      throw new Error(errors.ERR_ALGO_XFER_PTXN_NOT_FOUND);
    }

    // saves the ptxn sequence number so that we fetch it
    const smData = {
      acc_address: accAddr,
      safe_app_id: from_safe.appId,
      transfer_algo_ptxn_id,
    };

    const { data } = await axios.patch(`${AppConfig.appURL}/api/safe-migration/algo-transfer/${migrationId}`, smData);

    return data;
  };

  getReimbursedAmount = (safeThreshold: number, noOfAssets: number, noOfOwners: number) => {
    // calculate reimbursed amount during safe migration - pass in asset number from safe migration

    // safe creation costs
    const treasuryFees = AppConfig.treasuryFee;
    const safeCreationFees = 2000;
    const initSafeFees = 3000;
    const optIntoSafeFees = 1000 * noOfOwners;
    let overallSafeCreationFees = treasuryFees + safeCreationFees + initSafeFees + optIntoSafeFees;

    // asset transfer costs
    let overallAssetTransferFees = 0;
    for (let i = 0; i < noOfAssets; i++) {
      // each asset transfer requires 2 ptxns - asset opt in and asset transfer
      const createPtxnFees = 6000; //2000 used by lsig during undo rekey, 4000 for create ptxn process
      const signingFees = safeThreshold * 2000; // assume min no. of signers approve the ptxn
      const executionFees = 3000; //signer pays to execute ptxn
      const safeExecutionFees = 2000; // cost incurred by safe to send payload, undo rekey, app call, close lsig account
      overallAssetTransferFees += 2 * (createPtxnFees + signingFees + executionFees + safeExecutionFees);
    }

    // console.log("overallSafeCreationFees", overallSafeCreationFees);
    // console.log("asset count", assets.length);
    // console.log("threshold", safe.threshold);
    // console.log("overallAssetTransferFees", overallAssetTransferFees);

    // convert to Algos
    overallSafeCreationFees /= 1e6;
    overallAssetTransferFees /= 1e6;

    return {
      assetsTransferred: noOfAssets,
      total: overallSafeCreationFees + overallAssetTransferFees,
      overallSafeCreationFees,
      overallAssetTransferFees,
    };
  };

  getSafeMigrationAssetTransferStatus = async (oldSafe: Safe, newSafe: Safe, accAddr: string) => {
    // returns asset transfer data between the 2 safes
    let assetMigrationCompleted = true;

    // fetch asset holdings
    const { assets: oldSafe_assets } = await AccountService.lookupAccountAssets(oldSafe.address);
    const { assets: newSafe_assets } = await AccountService.lookupAccountAssets(newSafe.address);

    // fetch ptxns related to assets
    const oldSafe_ptxns = await this.getSafePendingTransactions(oldSafe, accAddr);
    const newSafe_ptxns = await this.getSafePendingTransactions(newSafe, accAddr);

    const assetTransfers = new Map();
    oldSafe_ptxns.forEach((ptxn) => {
      // look for asset transfer txn
      if (
        ptxn.parsedPayload &&
        ptxn.parsedPayload[0].payloadType === ptxnConstants.PAYLOAD_CLOSE_ASSET &&
        ptxn.parsedPayload[0].payloadCloseRemainderTo === newSafe.address
      ) {
        assetTransfers.set(ptxn.parsedPayload[0].payloadAssetID, ptxn);
      }
    });

    const assetOptIns = new Map();
    newSafe_ptxns.forEach((ptxn) => {
      // look for asset opt in txn
      if (ptxn.parsedPayload && ptxn.parsedPayload[0].payloadType === ptxnConstants.PAYLOAD_ASSET_OPT_IN) {
        assetOptIns.set(ptxn.parsedPayload[0].payloadAssetID, ptxn);
      }
    });

    const newSafeAssets_map = new Map();
    newSafe_assets.forEach((asset: any) => {
      newSafeAssets_map.set(asset["asset-id"], asset);
    });

    const oldSafeAssets_map = new Map();

    interface assetList {
      status: string;
      asset: assetParam;
      assetDetails: Record<string, any>;
      ptxn: PendingTxn | null;
      btn: string | null;
      old_safe_balance: number;
      new_safe_balance: number;
      stage: string;
    }

    const assetList_old: assetList[] = await Promise.all(
      oldSafe_assets.map(async (asset: any) => {
        oldSafeAssets_map.set(asset["asset-id"], asset);

        // fetch asset name
        const assetDetails = await getAsset(this.algod, asset["asset-id"]);
        const assetDenomination = Math.pow(10, assetDetails.params.decimals);

        // if any of the old asset has balance, asset migration will not be complete
        if (asset.amount > 0) assetMigrationCompleted = false;

        const formattedAsset = {
          status: migratesafe.STATUS_NOT_STARTED, //not started
          asset,
          assetDetails,
          ptxn: null,
          btn: "",
          old_safe_balance: asset.amount / assetDenomination,
          new_safe_balance: 0,
          stage: "",
        };

        // does the new safe have this asset?
        if (newSafeAssets_map.get(asset["asset-id"]) !== undefined) {
          // you are at the transfer stage
          formattedAsset.stage = migratesafe.STAGE_TRANSFER;

          // new safe has already opted into this asset
          formattedAsset.new_safe_balance = newSafeAssets_map.get(asset["asset-id"]).amount / assetDenomination;

          // does it have any asset transfer ptxn
          if (assetTransfers.get(asset["asset-id"]) !== undefined) {
            const assetTransferPtxn = assetTransfers.get(asset["asset-id"]);

            // display btn based on status
            formattedAsset.status = assetTransferPtxn.status;
            switch (assetTransferPtxn.status) {
              case ptxnConstants.STATUS_READY:
                formattedAsset.btn = migratesafe.BTN_EXECUTE;
                break;
              case ptxnConstants.STATUS_PENDING:
                formattedAsset.btn = migratesafe.BTN_PENDING;
                break;
              case ptxnConstants.STATUS_NEED_CONFIRMATION:
                formattedAsset.btn = migratesafe.BTN_APPROVE;
                break;
              case ptxnConstants.STATUS_EXPIRED:
                formattedAsset.btn = migratesafe.BTN_DELETE;
                break;
              default:
                break;
            }

            formattedAsset.ptxn = assetTransferPtxn;
          } else {
            // can initiate transfer
            if (accAddr === oldSafe.owners[0].addr) {
              // only main owner can create ptxn
              formattedAsset.btn = migratesafe.BTN_TRANSFER;
            }
          }
        } else {
          // you are at the opt in stage
          formattedAsset.stage = migratesafe.STAGE_OPT_IN;

          // does it have any opt in ptxn on new safe
          if (assetOptIns.get(asset["asset-id"]) !== undefined) {
            const optInPtxn = assetOptIns.get(asset["asset-id"]);

            formattedAsset.status = optInPtxn.status;
            switch (optInPtxn.status) {
              case ptxnConstants.STATUS_READY:
                formattedAsset.btn = migratesafe.BTN_EXECUTE;
                break;
              case ptxnConstants.STATUS_PENDING:
                formattedAsset.btn = migratesafe.BTN_PENDING;
                break;
              case ptxnConstants.STATUS_NEED_CONFIRMATION:
                formattedAsset.btn = migratesafe.BTN_APPROVE;
                break;
              case ptxnConstants.STATUS_EXPIRED:
                formattedAsset.btn = migratesafe.BTN_DELETE;
                break;
              default:
                break;
            }

            formattedAsset.ptxn = optInPtxn;
          } else {
            // can initiate transfer
            if (accAddr === oldSafe.owners[0].addr) {
              // only main owner can create ptxn
              formattedAsset.btn = migratesafe.BTN_OPT_IN;
            }
          }
        }

        return formattedAsset;
      })
    );

    // As asset close out completes, the old safe will not have any record of the asset, we will add them back to the overall list from the new safe
    const assetList_new: assetList[] = [];
    for (const asset of newSafe_assets) {
      if (oldSafeAssets_map.get(asset["asset-id"]) === undefined) {
        // fetch asset name
        const assetDetails = await getAsset(this.algod, asset["asset-id"]);
        const assetDenomination = Math.pow(10, assetDetails.params.decimals);

        const formattedAsset = {
          status: migratesafe.STATUS_TRANSFERRED,
          asset,
          assetDetails,
          ptxn: null,
          btn: "",
          old_safe_balance: 0,
          new_safe_balance: asset.amount / assetDenomination,
          stage: "",
        };

        assetList_new.push(formattedAsset);
      }
    }

    // combine results
    const overallAssetList = assetList_old.concat(assetList_new);

    return {
      overallAssetList,
      assetMigrationCompleted, // use this to toggle next step - transfer of algos
    };
  };

  getAssetCloseToPendingTxn = async (safe: Safe, assetID: number, senderAddr: string, closeRemainderTo: string) => {
    // fetch safe assets
    const { assets } = await AccountService.lookupAccountAssets(safe.address);
    if (assets === undefined) {
      throw new Error(errors.ERR_ASSET_NOT_ADDED_TO_SAFE);
    }

    // check if asset has been opted into the safe
    const thisasset = assets.find((asset: any) => asset["asset-id"] === assetID);
    if (thisasset === undefined) {
      throw new Error(errors.ERR_ASSET_NOT_ADDED_TO_SAFE);
    }

    const suggestedParams = await this.algod.getTransactionParams().do();

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: safe.address,
      to: safe.address,
      amount: thisasset.amount,
      assetIndex: thisasset["asset-id"],
      closeRemainderTo,
      suggestedParams,
    });

    const payload = algosdk.assignGroupID([txn]);

    // create new pending txn with asset close out payload
    return await this.getCreatePendingTxn(safe, senderAddr, payload);
  };

  getSafeMigrationAlgoTransferStatus = async (migrationId: number, oldSafe: Safe, newSafe: Safe, accAddr: string) => {
    // call this if asset migration is completed

    let algoMigrationCompleted = false;

    const { data: migration } = await this.getSafeMigration(migrationId);

    if (!migration) throw new Error(errors.ERR_SAFE_MIGRATION_NOT_FOUND);

    const maxWithdraw = await this.getSafeMaxWithdrawable(oldSafe.address);
    const newSafeAcc = await AccountService.getAccountInfo(newSafe.address);

    const algoXfer: {
      ptxn: PendingTxn | null;
      old_safe_balance: number;
      new_safe_balance: number;
      assetDetails: Record<string, any>;
      btn: string;
      status?: string;
      stage: string;
    } = {
      ptxn: null,
      old_safe_balance: maxWithdraw / 1e6,
      new_safe_balance: Number(newSafeAcc.amount) / 1e6,
      assetDetails: {
        params: {
          name: "Algo",
          decimals: 6,
          "unit-name": "Algo",
        },
      },
      btn: "",
      status: migratesafe.STATUS_NOT_STARTED,
      stage: migratesafe.STAGE_TRANSFER,
    };

    if (migration.transfer_algo_ptxn_id) {
      // fetch existing algo transfer ptxn
      const algoTransfer_ptxn = await this.getSafeSinglePtxn(oldSafe, accAddr, migration.transfer_algo_ptxn_id);

      if (algoTransfer_ptxn) {
        // get status of this ptxn
        algoXfer.status = algoTransfer_ptxn.status;
        switch (algoTransfer_ptxn.status) {
          case ptxnConstants.STATUS_READY:
            algoXfer.btn = migratesafe.BTN_EXECUTE;
            break;
          case ptxnConstants.STATUS_PENDING:
            algoXfer.btn = migratesafe.BTN_PENDING;
            break;
          case ptxnConstants.STATUS_NEED_CONFIRMATION:
            algoXfer.btn = migratesafe.BTN_APPROVE;
            break;
          case ptxnConstants.STATUS_EXPIRED:
            algoXfer.btn = migratesafe.BTN_DELETE;
            break;
          default:
            break;
        }

        algoXfer.ptxn = algoTransfer_ptxn;
      }
    }

    if (!algoXfer.ptxn) {
      // are there any algos to transfer?
      if (maxWithdraw > 0) {
        if (accAddr === oldSafe.owners[0].addr) {
          // only main owner can start this ptxn
          algoXfer.btn = migratesafe.BTN_TRANSFER_ALGO;
        }
      } else {
        algoMigrationCompleted = true;
        algoXfer.status = migratesafe.STATUS_TRANSFERRED;
      }
    }

    const overallAlgoXfer = [algoXfer];

    return {
      overallAlgoXfer,
      algoMigrationCompleted,
    };
  };

  getMigrateAlgosToSafePendingTxn = async (oldSafe: Safe, newSafe: Safe, accAddr: string) => {
    // transfer any remaining algos from old to new safe
    const maxWithdraw = await this.getSafeMaxWithdrawable(oldSafe.address);

    return await this.getSendAlgosFromSafePendingTxn(oldSafe, maxWithdraw, accAddr, newSafe.address);
  };

  sendSafeMigrationCompleteNotification = async (migrationId: number) => {
    if (AppConfig.discordReimbursementWebhook === undefined) {
      throw new Error(errors.ERR_SEND_SAFE_MIGRATION_NOTIF_FAILED);
    }

    const res = await this.getSafeMigration(migrationId);
    const migration = res.data;

    // migration should be completed before sending notification
    if (migration.migrate_status !== migratesafedb.MIGRATE_COMPLETE) {
      throw new Error(errors.ERR_SAFE_MIGRATION_NOT_COMPLETED);
    }

    const payload = {
      embeds: [
        {
          title: "Safe Migration Completed",
          description: "Please reimburse algos to the new safe address.",
          fields: [
            {
              name: "migrationId",
              value: migration.id,
            },
            {
              name: "network",
              value: AppConfig.defaultLedger,
            },
            {
              name: "from_safe",
              value: migration.from_safe,
            },
            {
              name: "to_safe",
              value: migration.to_safe,
            },
            {
              name: "reimbursed_amount",
              value: migration.reimbursed_amount,
            },
          ],
        },
      ],
    };

    const discord_res = await axios.post(AppConfig.discordReimbursementWebhook, payload);

    return discord_res;
  };

  canSafeProceedWithMigration = async (safe: Safe, accAddr: string) => {
    // Checks for the following,
    // - Safe has urgent ptxn
    // - Safe has 21 - (no. of safe assets) ptxns or account has already created at least 10 - (no. of safe assets) ptxns
    let canProceed = false;

    // Check global state for urgent ptxn record, no need to fetch any additional data
    const appGS = await this.getSafeGlobalState(safe.appId);
    const executingTxnData = appGS.get(contract.GS_EXECUTING_TXN)?.rawValue.bytes;

    // Not relying on global state ptxs for total number of ptxns created because older contracts had issues with it
    const ptxns = await this.getSafePendingTransactions(safe, accAddr);

    const { assets } = await AccountService.fetchAssetBalances(safe.address);
    const hitsSafeMaxPtxn = ptxns.length > AppConfig.maxPtxn - assets.length + 1;
    let ownerPtxns = 0;
    ptxns.forEach((ptxn) => {
      if (ptxn.sender === accAddr) ownerPtxns++;
    });

    const hitsMaxPtxnPerOwner = ownerPtxns > AppConfig.maxPtxnPerOwner - assets.length + 1;

    // Migration can proceed if safe doesn't hit max ptxn or max ptxn on main owner
    canProceed = !(hitsSafeMaxPtxn || hitsMaxPtxnPerOwner);

    //determines the ptxns that need to handle
    let hitsSafeMaxPtxnNeedToHandle = 0;
    let hitsMaxPtxnPerOwnerNeedToHandle = 0;

    if (hitsSafeMaxPtxn) {
      hitsSafeMaxPtxnNeedToHandle = assets.length - 1;
    }
    if (hitsMaxPtxnPerOwner) {
      hitsMaxPtxnPerOwnerNeedToHandle = assets.length - 1;
    }

    return {
      canProceed: executingTxnData ? false : canProceed,
      ptxnSafeMaxNeedToHandle: hitsSafeMaxPtxnNeedToHandle,
      ptxnPerOwnerNeedToHandle: hitsMaxPtxnPerOwnerNeedToHandle,
      isUrgentPtxnNeedToHandle: executingTxnData ? true : false,
    };
  };

  isSafeCreator = async (safe: Safe, accAddr: string) => {
    const appDetail = await this.algod.getApplicationByID(safe.appId).do();

    if (appDetail === undefined) return false;

    return appDetail.creator === accAddr;
  };
}
