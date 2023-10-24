interface TransactionBuilder {
  transactions: {
    txn: string; // encoded txns in base64 format
    signer: string; // to determine if it should be signed by lsig | user | no one
  }[];
}

export default TransactionBuilder;
