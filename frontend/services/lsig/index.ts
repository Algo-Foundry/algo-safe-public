import algosdk from "algosdk";
import AppConfig from "config/appConfig";
import { errors } from "shared/constants";
import { Algodv2, Transaction } from "algosdk";

export default class LsigService {
  lsig: string;
  algod: Algodv2;

  constructor(algod: Algodv2) {
    this.lsig = AppConfig.lsigTemplate;
    this.algod = algod;
  }

  createLsig = async (txs: Transaction[], safeID: number) => {
    if (this.lsig === undefined) {
      throw new Error(errors.ERR_NO_LSIG_PROGRAM);
    }

    // 1. Replace the template inside the LSIG template
    this.lsig = Buffer.from(this.lsig, "base64").toString();
    this.lsig = this.lsig.replace(/<SAFE_ID>/g, safeID.toString());
    this.lsig = this.lsig.replace(/<SAFE_ADDRESS>/g, algosdk.getApplicationAddress(safeID));

    // Input group size validation
    this.lsig = this.lsig.concat(`
    global GroupSize
    int ${txs.length}
    ==
    assert
    `);

    // Input the TX ID validation
    // 2. Loop through the transaction
    txs.forEach((tx, index) => {
      const txID = algosdk.encodeAddress(new Uint8Array(tx.rawTxID()));
      this.lsig = this.lsig.concat(`
      gtxn ${index} TxID
      addr ${txID}
      ==
      assert
      `);
    });

    // let idx = 0;
    // for (var tx of txs) {
    //   switch (tx.type) {
    //     case algosdk.TransactionType.pay:
    //       this.lsig = this.lsig.concat(await this.validatePay(tx, idx));
    //       break;
    //     case algosdk.TransactionType.axfer:
    //       this.lsig = this.lsig.concat(await this.validateAxfer(tx, idx));
    //       break;
    //     case algosdk.TransactionType.appl:
    //       this.lsig = this.lsig.concat(await this.validateAppl(tx, idx));
    //       break;
    //     default:
    //       break;
    //   }

    //   idx++
    // }

    this.lsig = this.lsig.concat(`
    b finish`);

    // console.log(this.lsig);

    // Compile the LSIG
    const results = await this.algod.compile(new Uint8Array(Buffer.from(this.lsig))).do();

    const program = new Uint8Array(Buffer.from(results.result, "base64"));

    const lsa = new algosdk.LogicSigAccount(program);

    return { ...results, lsa };
  };

  validatePay = async (tx: algosdk.Transaction, idx: number) => {
    // payment
    const receiver = algosdk.encodeAddress(tx.to.publicKey);
    const amt = tx.amount;

    let lsigBlock = `
    gtxn ${idx} TypeEnum
    int pay
    ==
    gtxn ${idx} Receiver
    addr ${receiver}
    ==
    `;

    if (amt !== undefined) {
      lsigBlock = lsigBlock.concat(`
      gtxn ${idx} Amount
      int ${amt}
      ==
      `);
    }

    lsigBlock = lsigBlock.concat(`
    &&
    assert
    `);

    return lsigBlock;
  };

  validateAxfer = async (tx: algosdk.Transaction, idx: number) => {
    // asset transfer, opt-in, clawback
    const receiver = algosdk.encodeAddress(tx.to.publicKey);
    const amt = tx.amount;

    let lsigBlock = `
    gtxn ${idx} TypeEnum
    int axfer
    ==
    gtxn ${idx} XferAsset
    int ${tx.assetIndex}
    ==
    &&`;

    // asset opt in txn will not have amt
    if (amt !== undefined) {
      lsigBlock = lsigBlock.concat(`
      gtxn ${idx} AssetAmount
      int ${amt}
      ==
      &&`);
    }

    // asset clawback will have revocation address
    if (tx.assetRevocationTarget !== undefined) {
      const revokeFrom = algosdk.encodeAddress(tx.assetRevocationTarget.publicKey);
      lsigBlock = lsigBlock.concat(`
      gtxn ${idx} AssetSender
      addr ${revokeFrom}
      ==
      &&`);
    }

    lsigBlock = lsigBlock.concat(`
      gtxn ${idx} AssetReceiver
      addr ${receiver}
      ==
      &&
      assert`);

    return lsigBlock;
  };

  validateAppl = async (tx: algosdk.Transaction, idx: number) => {
    // noop, create, update, delete, opt in, close out, clear state
    const appIndex = tx.appIndex;

    let lsigBlock = `
    gtxn ${idx} TypeEnum
    int appl
    ==`;

    if (appIndex === undefined) {
      // create app
      lsigBlock = lsigBlock.concat(`
      assert`);
    } else {
      // app call
      lsigBlock = lsigBlock.concat(`
      gtxn ${idx} ApplicationID
      int ${appIndex}
      ==
      &&
      assert`);
    }

    return lsigBlock;
  };
}
