import styles from "../QrCodeModal.module.scss";
import AddressGroup from "frontend/components/UI/AddressGroup";
import QRCode from "react-qr-code";
import BorderDivider from "frontend/components/UI/BorderDivider";
import { getExplorerURL } from "shared/utils";
import IconCopy from "frontend/components/UI/Icon/IconCopy";

interface Props {
  safeQrCode?: boolean;
  safeName?: string;
  safeAppId?: string;
  codeValue: string;
  linkAddressQR?: string;
  isCenterPosition?: boolean;
}

const QrCodeBody: React.FC<Props> = ({ safeQrCode, codeValue, linkAddressQR, safeName, safeAppId, isCenterPosition }: Props) => {
  return (
    <div className={styles["qr-code-modal"]}>
      <div className={styles["img-scan"]}>
        <QRCode value={"algorand://" + codeValue} size={222} bgColor="#11ffee00" />
      </div>
      <div className="d-flex flex-column align-items-center gap-2">
        {safeQrCode && <label>{safeName ? safeName : "-"}</label>}
        {safeQrCode && safeAppId && (
          <div className="d-flex align-items-center gap-2">
            <span className={styles["mb-sm"]}>ID : #{safeAppId}</span>
            <IconCopy copy={String(safeAppId)} />
            <a href={`${getExplorerURL()}/application/${safeAppId}`} target="_blank" rel="noreferrer">
              <img alt="Icon External Link" src="/images/icon-external-link-outline.svg" className={styles["img-sm"]} />
            </a>
          </div>
        )}
        {/* {safeQrCode && <span># {safeAppId? safeAppId : '-'}</span>} */}
        <div className="d-flex flex-column align-items-center">
          <div className={styles["title-adr"]}>Address:</div>
          <AddressGroup address={codeValue} linkAddress={linkAddressQR} isCenterPosition={isCenterPosition} noQRCode />
        </div>
      </div>
      <BorderDivider />
      <div className="text-start">
        To receive an asset, you are required to opt-in first. Make sure you have{" "}
        <b>
          <u>opted-in</u>
        </b>{" "}
        to the asset that you are going to receive.
      </div>
    </div>
  );
};

export default QrCodeBody;
