import NftService from "frontend/services/nft";
import { useCallback } from "react";

const useNft = () => {
  // functions related to retrieving and formatting NFT data
  const ns = new NftService();

  const format = useCallback(async (asaID: number, nft?: any) => await ns.formatNft(asaID, nft), []);

  return {
    format,
  };
};

export default useNft;
