/* eslint-disable @next/next/no-img-element */
import styles from "./ModalTx.module.scss";
import { strTruncateMiddle } from "shared/utils";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import IconLink from "frontend/components/UI/Icon/iconLink";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import { getExplorerURL } from "shared/utils";
import { useState, useMemo } from "react";
import { Collapse } from "react-bootstrap";

const iconDone = "/images/safe/icon-done.svg";
const iconFail = "/images/safe/icon-fail.svg";
const iconArrow = "/images/safe/icon-arrow-down.svg";

//type types = "success" | "success-txns" | "success-ptxn" | "fail" ;

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
  isTxnPage?: boolean;
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
  txHash = "",
  txHashLabel = "Tx Hash",
  message,
  resTxns,
  errorDetails,
  isTxnPage = false,
}: Props) => {
  const [openAdr, setOpenAdr] = useState(false);

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
        isTxnPage={isTxnPage}
      >
        <div className={styles.modalTx}>
          <img src={typeText()} className={styles.iconModal} alt="" />
          <div className="box-safe default gap-0">
            <div className={`${styles.textModal} mt-3 text-center w-100`}>
              <span>{modalMessage}</span>
            </div>

            {type !== "fail" && txHash && (
              <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-3 mx-auto`}>
                <span className={styles.bold}>{txHashLabel} -</span>
                <span>{strTruncateMiddle(txHash)}</span>
                <IconCopy copy={txHash} />
                <IconLink link={`${getExplorerURL()}/tx/${txHash}`} />
              </div>
            )}
            {type == "success-txns" && resTxns?.length && (
              <div className="d-flex flex-column align-items-center">
                <div
                  className={`${styles.textModal} ${styles.big} ${styles.collapse} d-flex align-items-center gap-1 mt-3`}
                  onClick={() => setOpenAdr(!openAdr)}
                  aria-controls="conten-tx"
                  aria-expanded={openAdr}
                >
                  <span>Show Transaction Details</span>
                  <img src={iconArrow} className={!openAdr ? styles.rotate : ""} alt="" />
                </div>
                <Collapse in={openAdr}>
                  <div id="conten-tx">
                    <div className={styles.txContent}>
                      {resTxns.map(
                        (value, i) =>
                          value.address && (
                            <div
                              key={"tx-hash-" + i}
                              className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center`}
                            >
                              <span className={styles.bold}>{value.title} -</span>
                              <span>{strTruncateMiddle(value.address)}</span>
                              <IconLink link={`${getExplorerURL()}/tx/${value.address}`} />
                              <IconCopy copy={value.address} />
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </Collapse>
              </div>
            )}
          </div>

          {!!errorDetails && typeof errorDetails === "string" && (
            <div className="w-100">
              <div
                className={`${styles.textModal} ${styles.big} ${styles.collapse} d-flex justify-content-center align-items-center gap-1 mt-2`}
                onClick={() => setOpenAdr(!openAdr)}
                aria-controls="error-details"
                aria-expanded={openAdr}
              >
                <span>Show Details</span>
                <img src={iconArrow} className={!openAdr ? styles.rotate : ""} alt="" />
              </div>
              <Collapse in={openAdr}>
                <div id="error-details">
                  <div className={styles.errorDetailsWrapper}>
                    <div className={styles.errorDetails}>{errorDetails}</div>
                  </div>
                </div>
              </Collapse>
            </div>
          )}
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalTx;
