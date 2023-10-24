/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import styles from "./AddressGroup.module.scss";
import QrCodeModal from "frontend/components/UI/AddressGroup/QrCodeModal";
import { strTruncateMiddle } from "shared/utils";
import { useState } from "react";
import IconCopy from "frontend/components/UI/Icon/IconCopy";

interface Props {
  address: string;
  linkAddress?: string;
  isTruncate?: boolean;
  noQRCode?: boolean;
  noLink?: boolean;
  noCopyButton?: boolean;
  className?: string;
  safeQrCode?: boolean;
  safeName?: string;
  safeAppId?: string;
  labelAddress?: boolean;
  isRow?: boolean;
  isNoMb?: boolean;
  reverseIcon?: boolean;
  isResponsive?: boolean;
  isCenterPosition?: boolean;
  isBalanceOverviewSafeId?: boolean;
}

const AddressGroup: React.FC<Props> = ({
  address,
  linkAddress,
  isTruncate,
  noQRCode,
  noLink,
  noCopyButton,
  className,
  safeQrCode,
  safeName,
  safeAppId,
  labelAddress,
  isRow,
  isNoMb,
  reverseIcon,
  isResponsive,
  isCenterPosition,
  isBalanceOverviewSafeId,
}: Props) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const [modalShow, setModalShow] = useState(false);

  const formatAddress = (input: string) => {
    let adr = input;
    if (isBalanceOverviewSafeId) {
      adr = `#${adr}`;
    }

    if (isResponsive || isTruncate) {
      return strTruncateMiddle(adr, 5, 5);
    }

    return adr;
  };

  return (
    <>
      {!noQRCode && (
        <QrCodeModal
          safeQrCode={safeQrCode}
          safeName={safeName}
          safeAppId={safeAppId}
          codeValue={address}
          linkAddressQR={linkAddress}
          modalStatus={modalShow}
          onHide={() => {
            setModalShow(false);
          }}
        />
      )}
      <div
        className={`
          ${styles["address-group"]}
          ${className}
          ${isRow ? `${styles["row-flex"]} justify-content-between` : ""}
          ${!isTruncate ? styles["column-flex"] : ""}        
        `}
      >
        {isTruncate ? (
          <span className={`${!isNoMb ? styles["mb-sm"] : styles.mtAddr} normalLineHeight`}>
            {labelAddress && "ADD : "}
            {formatAddress(address)}
          </span>
        ) : isResponsive ? (
          <>
            <span className={`${styles["mobile-visible"]} normalLineHeight`}>{formatAddress(address)}</span>
            <span className={`${styles["desktop-visible"]} normalLineHeight`}>{address}</span>
          </>
        ) : (
          <span className={`${isCenterPosition ? "text-center" : ""} normalLineHeight`}>{formatAddress(address)}</span>
        )}
        <div className={`d-flex gap-1 align-items-center ${reverseIcon ? "flex-row-reverse" : ""}`}>
          {!noCopyButton && <IconCopy copy={address} />}
          {!noQRCode && (
            <a role="button" onClick={() => setModalShow(true)}>
              <Image alt="Icon QRCode" src="/images/icon-qrcode.svg" layout="fill" objectFit="cover" quality={100} />
            </a>
          )}
          {!noLink && (
            <a href={linkAddress} target="_blank" rel="noreferrer">
              <Image
                alt="Icon External Link"
                src="/images/safe/icon-external-link.svg"
                layout="fill"
                objectFit="cover"
                quality={100}
              />
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default AddressGroup;
