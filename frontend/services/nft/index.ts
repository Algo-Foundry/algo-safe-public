import algosdk from "algosdk";
import { algodClient, indexerClient } from "backend/connection/algorand";
import AppConfig from "config/appConfig";
import CID from "cids";
import multicodec from "multicodec";
import multihash from "multihashes";
import { getAsset } from "backend/common/algorand/general";

export default class NftService {
  algod: algosdk.Algodv2 = algodClient();
  indexer: algosdk.Indexer = indexerClient();
  NFT_TYPES = {
    arc19: "arc19",
    arc3: "arc3",
    arc69: "arc69",
    custom: "custom",
  };

  getArc69NftMetadata = async (asaID: number) => {
    const { transactions } = await this.indexer.lookupAssetTransactions(asaID).txType("acfg").do();
    transactions.sort((a: any, b: any) => b["round-time"] - a["round-time"]);

    let arc69MetaData;
    for (const transaction of transactions) {
      if (!transaction.note) continue;

      const noteString = Buffer.from(transaction.note, "base64")
        .toString()
        .trim()
        .replace(/[^ -~]+/g, "");

      try {
        arc69MetaData = JSON.parse(noteString);
      } catch (err) {
        console.log(err);
      }

      // found our metadata
      if (arc69MetaData !== undefined) {
        break;
      }
    }

    return arc69MetaData;
  };

  getArc3NftMetadata = async (asaID: number, asaUrl?: string) => {
    if (asaUrl === undefined) {
      const newAsset = await this.algod.getAssetByID(asaID).do();
      asaUrl = newAsset.params.url;
    }

    if (asaUrl === undefined) {
      return;
    }

    // ignore ARC19
    if (asaUrl.includes("template-ipfs://")) return;

    const url = asaUrl.replace("ipfs://", AppConfig.ipfsUrlGateway);

    try {
      const ipfsMetadata = await (await fetch(url)).json();
      return ipfsMetadata;
    } catch (error) {
      return;
    }
  };

  getArc19NftMetadata = async (asaUrl: string, reserveAddress: string) => {
    type CodecName = "dag-pb" | "raw";
    type HashName = "sha2-256" | "sha2-512";
    const ErrUnknownSpec = new Error("unsupported template-ipfs spec");
    const ErrUnsupportedField = new Error("unsupported ipfscid field, only reserve is currently supported");
    const ErrUnsupportedCodec = new Error("unknown multicodec type in ipfscid spec");
    const ErrUnsupportedHash = new Error("unknown hash type in ipfscid spec");
    const ErrInvalidV0 = new Error("cid v0 must always be dag-pb and sha2-256 codec/hash type");

    const templateIPFSRegexp =
      /template-ipfs:\/\/{ipfscid:(?<version>[01]):(?<codec>[a-z0-9\-]+):(?<field>[a-z0-9\-]+):(?<hash>[a-z0-9\-]+)}/;

    const matches = asaUrl.match(templateIPFSRegexp);

    if (!matches) {
      throw ErrUnknownSpec;
    }

    if (matches?.groups?.field !== "reserve") {
      throw ErrUnsupportedField;
    }

    const codecName: CodecName = matches?.groups?.codec as CodecName;
    const codec = multicodec.getCodeFromName(codecName);
    if (!codec) {
      throw ErrUnsupportedCodec;
    }

    const hashName: HashName = matches.groups.hash as HashName;
    const multihashType = multihash.names[hashName];
    if (!multihashType) {
      throw ErrUnsupportedHash;
    }

    const hash = multihash.encode(algosdk.decodeAddress(reserveAddress).publicKey, hashName);

    let cid;
    if (matches.groups.version === "0") {
      if (codec !== multicodec.DAG_PB || matches.groups.hash !== "sha2-256") {
        throw ErrInvalidV0;
      }

      cid = new CID(0, codec, hash);
    } else {
      cid = new CID(1, codec, hash);
    }

    // IPFS content could be a json (ARC3) or the content itself
    let jsonMetadata;
    const ipfsContent = `${AppConfig.ipfsUrlGateway}${asaUrl.replace(matches[0], cid.toString())}`;
    try {
      const response = await fetch(ipfsContent);
      jsonMetadata = await response.json();
    } catch (e) {
      // content isn't JSON, return content URL as is
      console.log(e);
    }

    return {
      ipfsContent,
      jsonMetadata,
    };
  };

  getAssetDetail = async (asaID: number) => {
    const res = await getAsset(this.algod, asaID);
    return res;
  };

  formatNft = async (asaID: number, nft?: any) => {
    if (nft === undefined) {
      const { params } = await this.algod.getAssetByID(asaID).do();
      nft = params;
    }

    const formattedNft = {
      ...nft,
      name: nft.name ?? "",
      unitName: nft["unit-name"],
      standard: this.NFT_TYPES.custom,
      description: "",
      properties: {},
      contentUrl: "",
      metadata: {},
      url: nft.url ?? "",
    };

    const contentUrl = nft.url;
    if (contentUrl === undefined) {
      return formattedNft;
    }

    let metadata;
    if (contentUrl.includes("template-ipfs://") && nft.reserve) {
      formattedNft.standard = this.NFT_TYPES.arc19;
      const { ipfsContent, jsonMetadata } = await this.getArc19NftMetadata(nft.url, nft.reserve);
      metadata = jsonMetadata;
      if (jsonMetadata === undefined) {
        formattedNft.contentUrl = ipfsContent;
      }
    } else if (contentUrl.includes("ipfs://") && contentUrl.includes("#arc3")) {
      formattedNft.standard = this.NFT_TYPES.arc3;
      metadata = await this.getArc3NftMetadata(asaID, contentUrl);
      if (metadata === undefined) {
        formattedNft.contentUrl = contentUrl.replace("ipfs://", AppConfig.ipfsUrlGateway);
      }
    } else if (contentUrl.includes("ipfs://")) {
      metadata = await this.getArc69NftMetadata(asaID);
      if (metadata !== undefined) {
        formattedNft.standard = this.NFT_TYPES.arc69;
      }

      formattedNft.contentUrl = contentUrl.replace("ipfs://", AppConfig.ipfsUrlGateway);

      // for custom content, check if it is JSON
      if (formattedNft.standard === this.NFT_TYPES.custom) {
        try {
          metadata = await (await fetch(formattedNft.contentUrl)).json();
        } catch (error) {
          // not a JSON content, ignore
        }
      }
    }

    if (metadata !== undefined) {
      formattedNft.metadata = metadata;
      const { image, description, properties } = metadata;

      if (image !== undefined) {
        formattedNft.contentUrl = image.replace("ipfs://", AppConfig.ipfsUrlGateway);
      }

      if (description !== undefined) {
        formattedNft.description = description;
      }

      if (properties !== undefined) {
        formattedNft.properties = properties;
      }
    }

    return formattedNft;
  };
}
