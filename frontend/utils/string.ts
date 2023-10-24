/* eslint-disable @typescript-eslint/no-explicit-any */

export const encodeString = (text: string) => {
  return Buffer.from(text).toString("base64");
};

/**
 * Generate URL to algoexplorer.io transaction page based on transaction/contract ID
 * @param {{id:string, path?:string}} id: ID of contract/transaction; (optional) path: 'tx' for transaction, 'address' for contract, default to 'tx'
 * @returns {String} https://(sandnet.|mainnet.|)algoexplorer.io/(address|tx)/QWERTY...
 */
export const algoexplorerTransactionUrl = ({
  id,
  path = "tx",
}: {
  id: string;
  path?: "address" | "tx" | "application" | "asset";
}) => {
  const ledger: string = process.env.NEXT_PUBLIC_DEFAULT_LEDGER || "SandNet";
  let subdomain = "";

  if (!id.trim()) {
    return "";
  }

  if (ledger.toLowerCase() !== "mainnet") {
    subdomain = `${ledger.toLowerCase()}.`;
  }

  return `https://${subdomain}algoexplorer.io/${path}/${id.trim()}`;
};
