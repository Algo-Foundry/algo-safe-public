import algosdk from "algosdk";
import ParsedPayload from "./ParsedPayload";

interface UrgentRequest {
  approvers: number;
  rejections: number;
  txnId: string;
  sender: string;
  expiry?: Date;
  lsig_address: string;
  lsig_program?: string;
  payload?: algosdk.Transaction[];
  parsedPayload: ParsedPayload[];
  status?: string;
  canExecute: boolean;
}

export default UrgentRequest;
