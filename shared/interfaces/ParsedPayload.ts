interface ParsedPayload {
  payloadType: string | null;
  payloadTxType: string | null;
  payloadAssetName: string | null;
  payloadAssetID: number | null;
  payloadAssetDecimals: number;
  payloadDirection: string | null;
  payloadAmount: number;
  displayAmount: number;
  payloadAppID: number | null;
  payloadFrom: string | null;
  payloadTo: string | null;
  payloadFreezeAddress: string | null;
  payloadClawbackAddress: string | null;
  payloadIsAssetFrozen: boolean;
  payloadManagerAddress: string | null;
  payloadCloseRemainderTo: string | null;
  payloadFee: number;
}

export default ParsedPayload;
