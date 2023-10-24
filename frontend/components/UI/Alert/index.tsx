/* eslint-disable @next/next/no-img-element */
import styles from "frontend/components/UI/Alert/Alert.module.scss";
//import Image from 'next/image';

interface Props {
  message: string;
  boldMessage?: string;
  isUrgen?: boolean;
  isWarning?: boolean;
  isSuccess?: boolean;
  isDelete?: boolean;
  isFontSizeMedium?: boolean;
  isSigner?: boolean;
}

const icon = {
  fail: "/images/safe/icon-error.svg",
  warningRed: "/images/icon-warning-red.svg",
  warningOrange: "/images/icon-warning-orange.svg",
  success: "/images/icon-playlist-add-check.svg",
  delete: "/images/icon-delete-red.svg",
  warnSigner: "/images/icon-signer.svg",
};

const Alert: React.FC<Props> = ({
  message,
  boldMessage,
  isUrgen,
  isDelete,
  isWarning,
  isSuccess,
  isFontSizeMedium,
  isSigner,
}: Props) => {
  return (
    <div
      className={`
        ${styles.alertWrapper}
        ${isUrgen && styles.urgent}
        ${(isSuccess || isSigner) && styles.success}
      `}
    >
      <img
        src={
          isSuccess
            ? icon.success
            : isUrgen
            ? icon.warningOrange
            : isWarning
            ? icon.warningRed
            : isDelete
            ? icon.delete
            : isSigner
            ? icon.warnSigner
            : icon.fail
        }
        alt=""
      />
      <div
        className={`
        ${styles.text}
        ${isFontSizeMedium && styles.textMedium}
      `}
      >
        {message}
        <b> {boldMessage}</b>
      </div>
    </div>
  );
};

export default Alert;
