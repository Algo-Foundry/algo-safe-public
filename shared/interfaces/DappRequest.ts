import Safe from "./Safe";
import LedgerAccount from "./LedgerAccount";

interface DappRequest {
  wcVersion: number;
  id: number;
  topic: string;
  payload: any;
  safe?: Safe;
  ledger?: LedgerAccount;
  metadata: any;
  parsedPayload?: any;
}

export default DappRequest;
