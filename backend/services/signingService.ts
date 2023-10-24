import nacl from "tweetnacl";
import AppConfig from "config/appConfig";
import { errors } from "shared/constants";
import algosdk from "algosdk";

export default class SigningService {
  static signData = async (dataToSign: string) => {
    const masterHash = AppConfig.masterHash;
    const secretKey = AppConfig.secretKey;
    if (masterHash === "" || secretKey === "") {
      throw new Error(errors.ERR_SIGN_DATA);
    }

    const signature = nacl.sign.detached(
      new Uint8Array([
        ...Array.from(new Uint8Array(Buffer.from("ProgData"))),

        // Hash of the current program NOT THE APP ADDRESS
        ...Array.from(algosdk.decodeAddress(masterHash).publicKey),

        // data
        ...Array.from(algosdk.decodeAddress(dataToSign).publicKey),
      ]),
      Buffer.from(secretKey, "base64")
    );

    return Buffer.from(signature).toString("base64");
  };
}
