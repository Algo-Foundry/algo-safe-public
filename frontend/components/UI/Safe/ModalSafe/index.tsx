import styles from "./ModalSafe.module.scss";
import { strTruncateMiddle } from "shared/utils";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import { Collapse } from "react-bootstrap";
import { useState } from "react";
import IconLink from "../../Icon/iconLink";
import IconCopy from "../../Icon/IconCopy";
import IconQr from "../../Icon/IconQr";
import { txIds } from "frontend/components/UI/Safe/Review/ReviewDetail";
import { getExplorerURL } from "shared/utils";

const iconDone = "/images/safe/icon-done.svg";
const iconFail = "/images/safe/icon-error.svg";
const iconArrow = "/images/safe/icon-arrow-down.svg";

const txDetail = [
  // Safe Creation
  {
    title: "Safe Creation Tx Hash",
    address: "",
  },
  {
    title: "Safe Init Tx Hash",
    address: "",
  },
  {
    title: "Opt In Tx Hash",
    address: "",
  },
];

interface Props {
  modalStatus: boolean;
  title: string;
  type?: string;
  errMessage?: string;
  txInformation: txIds;
  isMigration?: boolean;
  noCloseBtn?: boolean;
  onHide: () => void;
  onRetry?: () => void;
  isResume?: boolean;
}

const ModalSafe: React.FC<Props> = ({
  modalStatus,
  errMessage,
  title,
  onHide,
  onRetry,
  type = "create",
  isMigration,
  txInformation,
  noCloseBtn,
  isResume = false,
}: Props) => {
  const [openAdr, setOpenAdr] = useState(false);

  txDetail[0].address = txInformation.safeCreation;
  txDetail[1].address = txInformation.initAppCall;
  txDetail[2].address = txInformation.optin;

  let retryTxDetail = {
    label: "Create",
    txId: txInformation.safeCreation,
  };
  if (type === "fail optin") {
    retryTxDetail = {
      label: "Init",
      txId: txInformation.initAppCall,
    };
  }

  return (
    <div>
      <ModalGeneral title={title} onHide={onHide} noCloseBtn={noCloseBtn} modalStatus={modalStatus}>
        <div className={styles.modalSafeCont}>
          <img
            src={type == "create" || type == "load" || type == "delete" ? iconDone : iconFail}
            className={styles.iconModal}
            alt=""
          />
          {type == "create" && (
            <div className="d-flex flex-column w-100 align-items-center">
              {isMigration ? (
                <div className={`${styles.textModal} mt-2`}>
                  You have created a new safe for your migration. <br /> Your co-signers will need to reopt-in to the safe using
                  this new safe ID.
                </div>
              ) : (
                <div className={`${styles.textModal} mt-2`}>
                  The safe has been created. Your co-signers will need to opt-in to the safe using this safe ID.
                </div>
              )}
              <div className={`${styles.textModal} ${styles.big} mt-3 d-flex mt-1 gap-2 align-items-center`}>
                <span> #{txInformation.safeID}</span>
                <IconCopy copy={String(txInformation.safeID)} />
              </div>
              {/* <div className={`${styles.textModal} ${styles.big} d-flex mt-1 gap-2 align-items-center`}>
                <span>{strTruncateMiddle(txInformation.safeCreation)}</span>
                <IconLink link={`${getExplorerURL()}/tx/${txInformation.safeCreation}`}/>
                <IconCopy copy={txInformation.safeCreation} />
              </div> */}
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
                    {txDetail.map((value, index) => (
                      <div key={index} className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center`}>
                        <span className={styles.bold}>{value.title} -</span>
                        <span>{strTruncateMiddle(value.address)}</span>
                        <IconLink link={`${getExplorerURL()}/tx/${value.address}`} />
                        <IconCopy copy={value.address} />
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse>
              <div className={`box-safe p-0 w-100 ${styles.mt20}`}>
                <div className="box-button mx-auto w-100">
                  <button className="btn default w-100" onClick={onHide}>
                    {isMigration ? "CLOSE" : " GO TO SAFE"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {type == "load" && (
            <div className="d-flex flex-column w-100 align-items-center">
              <div className={`${styles.textModal} mt-2`}>Congratulations. You are opted-in to :</div>
              <div className={`${styles.textModal} ${styles.big} mt-2`}>
                <span className={styles.bold}>Algo Safe -</span> #{txInformation.safeID}
              </div>
              {txInformation.safeCreation && (
                <div className={`${styles.textModal} ${styles.big} d-flex align-items-center mt-1 gap-1`}>
                  <span>{strTruncateMiddle(txInformation.safeCreation)}</span>
                  <IconQr data="null" />
                  <IconLink link={`${getExplorerURL()}/application/${txInformation.safeCreation}`} />
                  <IconCopy copy={txInformation.safeCreation} />
                </div>
              )}
              {txInformation.address && (
                <div className={`${styles.textModal} ${styles.big} d-flex align-items-center mt-1 gap-1`}>
                  <span>{strTruncateMiddle(txInformation.address)}</span>
                  <IconQr data={txInformation.address} />
                  <IconLink link={`${getExplorerURL()}/address/${txInformation.address}`} />
                  <IconCopy copy={txInformation.address} />
                </div>
              )}
              <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-2`}>
                <span className={styles.bold}>Opt in Tx Hash -</span>
                <span>{strTruncateMiddle(txInformation.optin)}</span>
                <IconLink link={`${getExplorerURL()}/tx/${txInformation.optin}`} />
                <IconCopy copy={txInformation.optin} />
              </div>
              <div className={`box-safe p-0 w-100 ${styles.mt20}`}>
                <div className="box-button mx-auto w-100">
                  <button className="btn default w-100" onClick={onHide}>
                    GO TO SAFE
                  </button>
                </div>
              </div>
            </div>
          )}
          {type == "delete" && (
            <div className="d-flex flex-column w-100 align-items-center">
              <div className={`${styles.textModal} mt-2 text-center`}>
                A pending transaction has been created. Your co-signers will need to confirm before deleting the safe.
              </div>
              <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-4`}>
                <span className={styles.bold}>Tx Hash -</span>
                <span>{strTruncateMiddle(txInformation.optin)}</span>
                <IconLink link={`${getExplorerURL()}/tx/${txInformation.optin}`} />
                <IconCopy copy={txInformation.optin} />
              </div>
            </div>
          )}
          {(type == "fail create" || type == "fail load") && (
            <div className={`${styles.textModal} mt-3 text-center`}>
              Unable to submit transactions to {`${type == "fail load" ? "load the safe." : "create the safe."}`}
              <br />
              {`${errMessage && errMessage?.length > 0 ? errMessage : ""}`}
            </div>
          )}
          {type == "fail reject" && (
            <div className={`${styles.textModal} mt-3 text-center`}>The transaction was cancelled by the user.</div>
          )}
          {type == "fail delete" && (
            <div className={`${styles.textModal} mt-3 text-center`}>Unable to initialize safe removal.</div>
          )}
          {type == "fail nonowner init" && (
            <div className={`${styles.textModal} mt-3 text-center`}>
              Please inform the main owner to load the safe and complete the Safe creation process.
            </div>
          )}
          {(type == "fail init" || type == "fail optin") && (
            <div className="box-safe default gap-0">
              <div className={`${styles.textModal} mt-3 text-center mx-auto`}>
                {type == "fail init" && "Unable to initialize the Safe. Please try again."}
                {type == "fail optin" && "Unable to opt into the Safe. Please try again."}
              </div>
              <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-3 mx-auto`}>
                <span className={styles.bold}>Safe ID - #</span>
                <span>{txInformation.safeID}</span>
                {/* <IconQr data='null'/> */}
                <IconLink link={`${getExplorerURL()}/application/${txInformation.safeID}`} />
                <IconCopy copy={`${txInformation.safeID}`} />
              </div>
              <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-3 mx-auto`}>
                <span className={styles.bold}>Safe Address -</span>
                <span>{strTruncateMiddle(txInformation.address || "")}</span>
                {/* <IconQr data='null'/> */}
                <IconLink link={`${getExplorerURL()}/address/${txInformation.address || ""}`} />
                <IconCopy copy={txInformation.address || ""} />
              </div>
              {!isResume && (
                <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center mt-3 mx-auto`}>
                  <span className={styles.bold}>Safe {retryTxDetail.label} Tx Hash -</span>
                  <span>{strTruncateMiddle(retryTxDetail.txId)}</span>
                  <IconLink link={`${getExplorerURL()}/tx/${retryTxDetail.txId}`} />
                  <IconCopy copy={retryTxDetail.txId} />
                </div>
              )}
              <div className="box-button mx-auto mt-3">
                <button className="btn btn-white" onClick={onHide}>
                  cancel
                </button>
                <button className="btn default" onClick={onRetry}>
                  retry
                </button>
              </div>
            </div>
          )}
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalSafe;
