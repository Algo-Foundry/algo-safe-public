// Not all parameters are described

export interface AssetTransferTransaction {
  amount: number;
  "asset-id": number;
  "close-amount": number;
  receiver: string;
}

export interface PaymentTransaction {
  amount: number;
  "close-amount": number;
  receiver: string;
}

export interface InnerTransaction {
  note: string;
  "application-transaction": {
    "application-args": string[];
    "application-id": number;
  };
  "asset-transfer-transaction": AssetTransferTransaction;
  "payment-transaction": PaymentTransaction;
  "close-rewards": number;
  "closing-amount": number;
  "confirmed-round": number;
  fee: number;
  id: string;
  "inner-txns": InnerTransaction[];
  "first-valid": number;
  "intra-round-offset": number;
  "last-valid": number;
  "receiver-rewards": number;
  "round-time": number;
  sender: string;
  "sender-rewards": number;
  "tx-type": string;
  group: string;
}

export interface TransactionResponse {
  "inner-txns": InnerTransaction[];
  "tx-type": string;
  "confirmed-round": number;
  group: string;
  note: string;
}

export interface LookupTransactionResponse {
  "current-round": number;
  transaction: TransactionResponse;
}

export interface LookupAccountTransactionResponse {
  "current-round": number;
  transactions: InnerTransaction[];
}

export interface BlockResponseTransaction {
  transactions: TransactionResponse[];
}

export interface stateData {
  key: string;
  rawValue: {
    bytes: any;
    type: number;
    uint: number;
  };
  formattedValue: string | number;
}

export interface localStateData {
  id: number;
  localState: Map<string, stateData>;
}

export interface assetParam {
  amount: number;
  "asset-id": number;
  deleted: boolean;
  "is-frozen": boolean;
  "opted-in-at-round": number;
}

export interface lookupAccountAssetsResponse {
  "current-round": number;
  "next-token": string;
  assets: assetParam[];
}
