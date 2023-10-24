/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import styles from "./ModalConfirm.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import { useState, useMemo } from "react";
import IconQr from "frontend/components/UI/Icon/IconQr";
import IconLink from "frontend/components/UI/Icon/iconLink";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import { Safe } from "shared/interfaces";
import { getExplorerURL, strTruncateMiddle } from "shared/utils";
import { useRouter } from "next/router";

const iconDone = "/images/safe/icon-done.svg";
const iconFail = "/images/safe/icon-fail.svg";
const iconArrow = "/images/safe/icon-arrow-down.svg";

interface resTxn {
  title: string;
  address?: string;
}

interface Props {
  modalStatus: boolean;
  title?: string;
  type?: string;
  removeSafe?: boolean;
  txHash?: string;
  seqPtxn?: string | number;
  lsig_address?: string;
  message?: string;
  onHide: () => void;
  resTxns?: resTxn[];
  errorDetails?: string;
  txHashLabel?: string;
  onExecute?: () => void;
  safe: Safe | null;
  txId: string;
}

const ModalTx: React.FC<Props> = ({
  modalStatus,
  title,
  seqPtxn,
  onExecute,
  lsig_address,
  removeSafe,
  onHide,
  type = "success",
  message,
  safe,
  txId,
}: Props) => {
  const modalTitle = useMemo(() => {
    if (title) {
      return title;
    }

    switch (type) {
      case "success":
      case "success-txns":
      case "success-ptxn":
        return "Success";
      case "fail":
      default:
        return "Fail";
    }
  }, [title, type]);

  const modalMessage = useMemo(() => {
    if (message) {
      return message;
    }

    switch (type) {
      case "success":
        return "Action Completed!";
      case "success-txns":
        return "Action Completed!";
      case "success-ptxn":
        return "Action Completed!";
      case "fail":
      default:
        return "Action Failed!";
    }
  }, [message, type]);

  const typeText = () => {
    switch (type) {
      case "success":
      case "success-txns":
      case "success-ptxn":
        return iconDone;
      case "fail":
      default:
        return iconFail;
    }
  };

  const router = useRouter();
  function goToSafe() {
    router.push("/dashboard");
    onHide();
  }

  return (
    <div>
      <ModalGeneral
        title={modalTitle}
        onExecute={() => onExecute?.()}
        onHide={onHide}
        seqNumb={seqPtxn}
        lsig_address={lsig_address}
        removeSafe={removeSafe}
        modalStatus={modalStatus}
      >
        <div className={styles.modalTx}>
          <img src={typeText()} className={styles.iconModal} alt="" />
          <div className="box-safe default gap-0">
            <div className={`${styles.textModal} mt-3 text-center w-100`}>
              <span>Congratulations. You are opted-in to :</span>
            </div>
            <div className={`${styles.textModal} mt-1 text-center w-100`}>
              <p>
                <span className={styles.bold}>{safe?.name}</span> - #{safe?.appId}
              </p>
            </div>
            <div className={`${styles.textModal} mt-1 ${styles.wrapText}`}>
              <span>{strTruncateMiddle(safe?.address || "", 10, 10)}</span>
              <IconQr data={safe?.address} />
              <IconLink link={`${getExplorerURL()}/address/${safe?.address}`} />
              <IconCopy copy={"string"} />
            </div>
            <div className={`${styles.textModal} mt-1 text-center ${styles.wrapText}`}>
              <p>
                <span className={styles.bold}>Opt-in Tx Hash</span> - {strTruncateMiddle(txId || "", 10, 10)}
              </p>
              <IconLink link={`${getExplorerURL()}/tx/${txId}`} />
              <IconCopy copy={txId} />
            </div>
            <div style={{ width: "100%" }}>
              <Button className={styles["btnGoToSafe"]} primary onClick={() => goToSafe()}>
                <p>GO TO SAFE</p>
              </Button>
            </div>
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalTx;
