interface Asset {
  id: number;
  clawback?: string;
  creator?: string;
  decimals: number;
  "default-frozen": boolean;
  freeze?: string;
  manager?: string;
  name: string;
  "name-b64": string;
  reserve?: string;
  total: number;
  "unit-name": string;
  "unit-name-b64": string;
  url?: string;
  "url-b64"?: string;
  "metadata-hash"?: string;
  value?: number;
  balance?: number;
  price?: number;
  isVerified?: boolean;
  imgUrl?: string;
}

export default Asset;
