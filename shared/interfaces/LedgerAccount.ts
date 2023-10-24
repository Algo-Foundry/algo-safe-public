interface LedgerAccount {
  providerId: string;
  name: string;
  address: string;
  authAddr?: string;
  ledgerAddress: string;
  minBalance: number;
  balance: number;
}

export default LedgerAccount;
