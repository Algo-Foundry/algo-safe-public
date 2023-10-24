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
  safeId: number;
  isConfirmation?: boolean;
  onConfirm?: () => void;
}

const ModalNotification: React.FC<Props> = ({
  modalStatus,
  title,
  seqPtxn,
  onExecute,
  lsig_address,
  removeSafe,
  onHide,
  type = "success",
  message,
  safeId,
  isConfirmation = false,
  onConfirm,
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

  return (
    <div>
      <ModalGeneral
        title={modalTitle}
        onHide={onHide}
        modalStatus={modalStatus}
        fullscreenSm
        backdrop="static"
        isPaddingTitleFixed
      >
        <div className="box-safe default gap-0">
          <div className={styles.textContent}>
            <p>
              <span style={{ fontWeight: "bold" }}>Safe ID</span> - #{safeId}
            </p>
          </div>
          <div className={styles.textContent} style={{ marginTop: "10px" }}>
            <p style={{ textAlign: "center" }}>{message}</p>
          </div>
          <div className={styles.btnContainer}>
            <Button primary className={styles["btnGoToSafe"]} onClick={() => onHide()}>
              <p>CLOSE</p>
            </Button>
            {isConfirmation && (
              <Button
                className={styles["btnGoToSafe"]}
                primary
                onClick={() => {
                  if (onConfirm) onConfirm();
                }}
              >
                <p>YES</p>
              </Button>
            )}
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalNotification;
