import algosdk from "algosdk";
import Vote from "./Vote";
import ParsedPayload from "./ParsedPayload";

interface PendingTxn {
  seq: number;
  safe_app_id: number;
  lsig_address: string;
  lsig_program?: string;
  txnId?: string;
  txns?: JSON;
  approvers: number;
  rejections: number;
  votingStatus?: Vote[];
  wc_id?: string;
  canExecute: boolean;
  expiry?: Date;
  payload?: algosdk.Transaction[];
  parsedPayload?: ParsedPayload[];
  sender: string;
  status?: string;
  dappName?: string;
  dappConnected?: boolean;
  totalFees?: number;
}

export default PendingTxn;
