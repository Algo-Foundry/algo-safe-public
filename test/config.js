require("dotenv").config();
const algosdk = require("algosdk");

const algod_token = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
const algod_server = process.env.NEXT_PUBLIC_ALGOD_ADDRESS;
const algod_port = process.env.NEXT_PUBLIC_ALGOD_PORT;

const algodClient = new algosdk.Algodv2(algod_token, algod_server, algod_port);

const indexer_token = process.env.NEXT_PUBLIC_INDEXER_TOKEN;
const indexer_server = process.env.NEXT_PUBLIC_INDEXER_ADDRESS;
const indexer_port = process.env.NEXT_PUBLIC_INDEXER_PORT;

const indexerClient = new algosdk.Indexer(indexer_token, indexer_server, indexer_port);

const fundAccount = algosdk.mnemonicToSecretKey(process.env.TC_CREATOR_MNEMONIC);

const publicKey = process.env.SIGNATURE_PUBLIC_KEY;
const secretKey = process.env.SIGNATURE_SECRET_KEY;

module.exports = {
  algodClient,
  indexerClient,
  fundAccount,
  publicKey,
  secretKey,
};
