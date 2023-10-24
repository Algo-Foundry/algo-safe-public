import PendingTxn from "./PendingTxn";
import Asset from "./Asset";
import DeleteRequest from "./DeleteRequest";
import UrgentRequest from "./UrgentRequest";

export default class NewSafe {
  name: string;
  address?: string;
  appId?: number;
  sequence?: number;
  initialized?: boolean;
  master?: number;
  num_owners?: number;
  owners: {
    name: string;
    addr: string;
    nfDomain?: string;
    isValid?: number;
  }[];
  threshold: number;
  assets?: Asset[];
  pendingTransactions?: PendingTxn[];
  status?: string;
  deleteTransaction?: DeleteRequest;
  executingTransaction?: UrgentRequest;

  constructor(data: NewSafe) {
    Object.assign(this, data);
  }
}
