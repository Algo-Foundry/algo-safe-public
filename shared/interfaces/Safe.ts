import PendingTxn from "./PendingTxn";
import Asset from "./Asset";
import DeleteRequest from "./DeleteRequest";
import UrgentRequest from "./UrgentRequest";

interface Safe {
  name: string;
  address: string;
  appId: number;
  sequence: number;
  initialized: boolean;
  master: number;
  num_owners: number;
  owners: {
    name: string;
    addr: string;
  }[];
  threshold: number;
  assets?: Asset[];
  pendingTransactions?: PendingTxn[];
  status?: string;
  deleteRequest?: DeleteRequest;
  executingTransaction?: UrgentRequest;
  value: number;
  ptxs?: number;
  isChecked?: boolean;
  isExist?: boolean;
}

export default Safe;
