import { Core } from "@walletconnect/core";
import { ICore } from "@walletconnect/types";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";
import { IJsonRpcRequest } from "@walletconnect/client/node_modules/@walletconnect/types";
import { DEFAULT_CHAINS, DEFAULT_APP_METADATA, DEFAULT_PROJECT_ID, DEFAULT_RELAY_URL } from "../../../config/walletConnect";
import { Web3Wallet, IWeb3Wallet } from "@walletconnect/web3wallet";
import { SignClientTypes } from "@walletconnect/types";
import { DappRequest } from "shared/interfaces";
import { FOUNDRY_WC, dapp, errors, events } from "shared/constants";
import SafeService from ".";
import LedgerService from "../ledger";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import { AppConnector } from "./appConnector";
import { parse as parseUrl } from "url";
import { parse as parseQuerystring } from "querystring";
import { DAPP_REQUIRED_PARAMS_V1, DAPP_REQUIRED_PARAMS_V2 } from "shared/constants/dapp";

const versionChecker = (uri: string) => {
  const index = uri.indexOf("@");
  if (index !== -1) {
    if (index + 1 < uri.length) {
      const versionNumber = uri[index + 1];
      return versionNumber;
    }
  }
  return null;
};

export default class AppConnectorV2 {
  v1Connector: AppConnector;
  payload: IJsonRpcRequest;
  uid: string;
  web3wallet: IWeb3Wallet;
  selectedAccount: SidebarAccount;
  core: ICore;
  connectedDapps: Record<string, SessionTypes.Struct>;
  connectedV1Dapps: AppConnector[];
  safeService: SafeService;
  ledgerService: LedgerService;
  proposal: SignClientTypes.EventArguments["session_proposal"] | undefined;

  constructor(selectedAccount: SidebarAccount) {
    this.selectedAccount = selectedAccount;
    this.safeService = new SafeService();
    this.ledgerService = new LedgerService();
  }

  /**
   * Call this function to restore any existing sessions first
   */
  init = async () => {
    await this.createWeb3Wallet();
    await this.initialiseV1Connectors();

    if (this.web3wallet !== undefined) {
      await this.setConnectedDapps();
    }
  };

  setConnectedDapps = async () => {
    // set connected dapps
    this.connectedDapps = await this.web3wallet.getActiveSessions();
  };

  getConnectedDapps = () => {
    // look at the peer property to get info about the dapp
    return Object.values(this.connectedDapps);
  };

  setConnectedV1Dapps = () => {
    // set connected v1 dapps
    const connectedApps = localStorage.getItem(FOUNDRY_WC);
    if (connectedApps) {
      this.connectedV1Dapps = JSON.parse(connectedApps);
    } else {
      this.connectedV1Dapps = [];
    }
  };

  getConnectedV1Dapps = () => {
    // look at the peer property to get info about the dapp
    return Object.values(this.connectedV1Dapps);
  };

  evtOnSessionProposal = async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
    // to establish new session
    this.proposal = proposal;

    // dispatch new session proposal to frontend
    window.dispatchEvent(new Event("newSession"));
  };

  evtOnSessionRequest = async (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
    // get payload and ID
    const { params, id, topic } = requestEvent;
    const { request } = params;
    const payload = request.params[0];
    // get dapp
    const connectedDapp = this.connectedDapps[topic];

    // get the Safe or Ledger account
    let thisSafe;
    let thisLedger;
    if (this.selectedAccount.appId !== undefined) {
      thisSafe = await this.safeService.getSafe(this.selectedAccount.appId);
    } else if (this.selectedAccount.ledgerAddress !== undefined) {
      thisLedger = await this.ledgerService.getAccount(
        this.selectedAccount.ledgerAddress,
        this.selectedAccount.address,
        this.selectedAccount.name
      );
    }

    // store this data for review
    const details: DappRequest = {
      id,
      topic,
      payload,
      safe: thisSafe, // for safe dapp ptxn
      ledger: thisLedger, // for signing dapp txns with ledger directly
      metadata: connectedDapp.peer.metadata,
      wcVersion: 2,
    };

    const storedRequest = localStorage.getItem(dapp.DAPP_REQUEST_DETAILS);

    if (storedRequest) {
      const storedRequestObj = JSON.parse(storedRequest);
      if (storedRequestObj.id === details.id) {
        // reject same dapp request being sent
        return;
      }
    }

    localStorage.setItem(dapp.DAPP_REQUEST_DETAILS, JSON.stringify(details));
    // dispatch event to display modal
    window.dispatchEvent(new Event(events.INC_TXN));
  };

  evtOnSessionDelete = async () => {
    // update connected dapps
    await this.setConnectedDapps();

    // dispatch disconnect event to frontend
    window.dispatchEvent(new Event(events.DISCONNECT));
  };

  initialiseV1Connectors = async () => {
    const connectedV1Dapps = localStorage.getItem(FOUNDRY_WC);
    if (this.connectedV1Dapps) {
      return;
    }
    if (connectedV1Dapps) {
      // Reconnect all v1 app connectors
      this.connectedV1Dapps = JSON.parse(connectedV1Dapps);
      this.connectedV1Dapps = this.connectedV1Dapps.map((app) => {
        const appConnector = new AppConnector(app.wc, this.selectedAccount, app.session);
        appConnector.uid = app.uid;
        return appConnector;
      });
    } else {
      this.connectedV1Dapps = [];
    }
  };

  createV1Connector = async (uri: string) => {
    this.v1Connector = new AppConnector(uri, this.selectedAccount);
  };

  createWeb3Wallet = async () => {
    this.web3wallet = await Web3Wallet.init({
      core: new Core({
        projectId: DEFAULT_PROJECT_ID,
        relayUrl: DEFAULT_RELAY_URL,
      }),
      metadata: DEFAULT_APP_METADATA,
    });

    if (this.web3wallet === undefined) {
      throw new Error("Failed to init Web3Wallet");
    }

    // init listeners
    this.web3wallet.on("session_proposal", this.evtOnSessionProposal);
    this.web3wallet.on("session_request", this.evtOnSessionRequest);
    this.web3wallet.on("session_delete", this.evtOnSessionDelete);
  };

  connect = async (uri: string) => {
    const version = versionChecker(uri);
    const parsedUri = parseUrl(uri);
    if (parsedUri.query == null) throw new Error(errors.ERR_MISSING_WC_REQUIRED_PARAM);
    const query = parseQuerystring(parsedUri.query);

    let requiredParams;
    if (version === "1") {
      requiredParams = DAPP_REQUIRED_PARAMS_V1;
    } else if (version === "2") {
      requiredParams = DAPP_REQUIRED_PARAMS_V2;
    } else {
      throw new Error(errors.ERR_MISSING_WC_VERSION_PARAM);
    }

    const isValid = requiredParams.every((param) => Object.prototype.hasOwnProperty.call(query, param));

    if (!isValid) throw new Error(errors.ERR_MISSING_WC_REQUIRED_PARAM);

    // connect to a wallet connect uri
    if (version === "1") {
      await this.createV1Connector(uri);
    } else if (version === "2") {
      await this.web3wallet.pair({ uri });
    }
  };

  // Approve V1 Session
  public approve = () => {
    this.v1Connector.approve();
    // update connected v1 dapps
    this.connectedV1Dapps.push(this.v1Connector);
  };

  disconnect = async (topic: string) => {
    const dapps = Object.values(this.connectedDapps);
    const dapp = dapps.find((item) => item.topic === topic);

    if (dapp !== undefined) {
      await this.disconnect_internal(dapp.topic);
    }
  };

  disconnectAll = async () => {
    // disconnect all v2 dapps
    const dapps = Object.values(this.connectedDapps);
    if (dapps.length > 0) {
      for await (const dapp of dapps) {
        await this.disconnect_internal(dapp.topic);
      }
    }

    // disconnect all v1 dapps
    if (this.connectedV1Dapps.length > 0) {
      for await (const v1_dapp of this.connectedV1Dapps) {
        await v1_dapp.connector.killSession({
          message: "Session Closed",
        });
      }

      // remove all records from localstorage
      localStorage.removeItem(FOUNDRY_WC);
      this.connectedV1Dapps = [];
    }
  };

  disconnect_internal = async (topic: string) => {
    await this.web3wallet.disconnectSession({
      topic,
      reason: getSdkError("USER_DISCONNECTED"),
    });

    // dispatch disconnect event to frontend
    window.dispatchEvent(new Event(events.DISCONNECT));
  };

  approveSession = async () => {
    if (this.proposal === undefined) throw new Error("Missing session proposal");

    const { id } = this.proposal;
    const chainAccount = `${DEFAULT_CHAINS[0]}:${this.selectedAccount.address}`;
    await this.web3wallet.approveSession({
      id,
      namespaces: {
        algorand: {
          chains: DEFAULT_CHAINS,
          methods: ["algo_signTxn"],
          events: [],
          accounts: [chainAccount],
        },
      },
    });

    // update dapps
    await this.setConnectedDapps();

    // reset proposal
    this.proposal = undefined;
  };

  rejectSession = async () => {
    if (this.proposal === undefined) throw new Error("Missing session proposal");

    const { id } = this.proposal;
    await this.web3wallet.rejectSession({
      id,
      reason: getSdkError("USER_REJECTED"),
    });

    // reset proposal
    this.proposal = undefined;
  };

  rejectRequest = async (requestId: number, topic: string) => {
    await this.web3wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: "2.0",
        error: {
          code: 5000,
          message: "User rejected.",
        },
      },
    });
  };

  approveRequest = async (requestId: number, topic: string, result: any) => {
    await this.web3wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: "2.0",
        result: result,
      },
    });
  };

  reset = async () => {
    // clear localstorage and re-init connector
    const wcEntries = await this.web3wallet.core.storage.getEntries();
    for (const item of wcEntries) {
      if (item[0].includes("wc@2")) {
        await this.web3wallet.core.storage.removeItem(item[0]);
      }
    }

    await this.init();
  };
}
