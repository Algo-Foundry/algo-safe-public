import WalletConnect from "@walletconnect/client";
import { FOUNDRY_WC, dapp as dappConstants, events } from "shared/constants";
import { DappRequest } from "shared/interfaces";
import SafeService from ".";
import LedgerService from "../ledger";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import { DEFAULT_APP_METADATA } from "config/walletConnect";

export interface AppConnectorBase {
  wc: string;
  uid: string;
  connector: any;
  payload: any;
  session: any;
  waitForPeerMeta(): void;
  approveRequest(id: number, result: any): void;
  rejectRequest(id: number): void;
  approve(): void;
  reject(): void;
  kill(): void;
}

class AppConnector implements AppConnectorBase {
  wc: string;
  selectedAccount: SidebarAccount;
  safeService: SafeService;
  ledgerService: LedgerService;
  // Identifier, since user may have several app connectors
  uid: string;

  connector: any;
  payload: any;
  session: any;

  constructor(wc: string, selectedAccount: SidebarAccount, session: any = undefined) {
    this.selectedAccount = selectedAccount;
    this.wc = wc;
    this.uid = `${this.selectedAccount.address}-${Date.now() + Math.random().toString(16).slice(2)}`;
    this.safeService = new SafeService();
    this.ledgerService = new LedgerService();
    if (session) this.session = session;

    this.connector = new WalletConnect({
      // Required
      uri: wc,
      // Required
      clientMeta: DEFAULT_APP_METADATA,

      // session not required
      session: session,
      storageId: this.uid,
    });

    //set up listeners

    // listen
    this.connector.on("session_request", async (error: any, payload: any) => {
      if (error) {
        throw error;
      }
      this.payload = payload;
      const connector = await this.waitForPeerMeta();

      if (connector) window.dispatchEvent(new Event("newSessionV1"));
    });

    // Listen the tx
    this.connector.on("call_request", async (error: any, payload: any) => {
      const extractedPayload = payload.params[0];
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
        id: payload.id,
        topic: this.uid,
        payload: extractedPayload,
        safe: thisSafe, // for safe dapp ptxn
        ledger: thisLedger, // for signing dapp txns with ledger directly
        metadata: this.session.peerMeta,
        wcVersion: 1,
      };
      localStorage.setItem(dappConstants.DAPP_REQUEST_DETAILS, JSON.stringify(details));
      window.dispatchEvent(new Event(events.INC_TXN));
    });

    this.connector.on("disconnect", () => {
      const currentApps = localStorage.getItem(FOUNDRY_WC);
      // remove app from local storage
      localStorage.removeItem(this.uid);
      if (!currentApps) return;
      const apps = JSON.parse(currentApps);
      let connectedApps = [];
      if (Array.isArray(apps)) {
        connectedApps = apps.filter((app: any) => app.uid !== this.uid);
        connectedApps.length === 0
          ? localStorage.removeItem(FOUNDRY_WC)
          : localStorage.setItem(FOUNDRY_WC, JSON.stringify(connectedApps));
      }

      // dispatch disconnect event to frontend
      window.dispatchEvent(new Event("disconnectDappV1"));
    });
  }

  // Wait until we get the payload for peer meta, so we know what DApps we're connecting to
  public async waitForPeerMeta(): Promise<AppConnectorBase> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let counter = 1;
    while (this.payload === undefined && counter <= 10) {
      await sleep(1000);
      ++counter;
    }

    if (this.payload === undefined) {
      throw new Error("Unable to connect to Dapp");
    }

    this.session = this.connector.session;
    return this;
  }

  public async approveRequest(id: number, result: any) {
    this.connector.approveRequest({
      jsonrpc: "2.0",
      id: id,
      result: result,
    });
  }

  public async rejectRequest(id: number) {
    await this.connector.rejectRequest({
      id: id, // required
      error: {
        code: "Request Rejected", // optional
        message: "Request Rejected", // optional
      },
    });
  }

  // Approve Session
  public approve = () => {
    // Approve Session
    this.connector.approveSession({
      accounts: [
        // required
        this.selectedAccount.address,
      ],
      chainId: 1, // required
    });
    const existingV1Dapps = localStorage.getItem(FOUNDRY_WC);
    let allV1Dapps = [this];
    if (existingV1Dapps) {
      allV1Dapps = [...allV1Dapps, ...JSON.parse(existingV1Dapps)];
    }
    localStorage.setItem(FOUNDRY_WC, JSON.stringify(allV1Dapps));
  };

  // Reject Session
  public reject() {
    this.connector.rejectSession({
      message: "Session Rejected",
    });
  }

  public kill() {
    this.connector.killSession({
      message: "Session Closed",
    });
    const currentApps = localStorage.getItem(FOUNDRY_WC);
    // remove app from local storage
    localStorage.removeItem(this.uid);
    if (!currentApps) return;
    const apps = JSON.parse(currentApps);
    let connectedApps = [];
    if (Array.isArray(apps)) {
      connectedApps = apps.filter((app: any) => app.uid !== this.uid);
      connectedApps.length === 0
        ? localStorage.removeItem(FOUNDRY_WC)
        : localStorage.setItem(FOUNDRY_WC, JSON.stringify(connectedApps));
    }
    // dispatch disconnect event to frontend
    window.dispatchEvent(new Event("disconnectDappV1"));
  }
}

export { AppConnector };
