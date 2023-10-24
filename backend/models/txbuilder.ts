export default class TXBuilder {
  tx?: Uint8Array;
  authAddr?: string;
  signers?: string[];
  signedTx?: string;

  constructor(data: TXBuilder) {
    Object.assign(this, data);
  }
}
