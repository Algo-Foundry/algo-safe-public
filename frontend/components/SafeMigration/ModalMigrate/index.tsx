import styles from "./ModalMigrate.module.scss";
import Router from "next/router";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import IconMigrate from "frontend/components/Icons/Migrate";
import { strTruncateMiddle } from "shared/utils";
import { Collapse } from "react-bootstrap";
import { useAppDispatch } from "frontend/redux/hooks";
import {
  setIsOwner,
  setIsAssetListEmpty,
  setstepProgressMigration,
  setIsMigrationActive,
  setMigrationActiveData,
} from "frontend/redux/features/migration/migrationSlice";
import { useState } from "react";
import { setSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { SELECTED_SAFE } from "shared/constants";
import { Safe } from "shared/interfaces";

interface Props {
  title?: string;
  reimbursedAmount?: any;
  ptxnNeedToHandleData?: any;
  modalStatus?: boolean;
  isModalDirectLink?: boolean;
  isMigrationComplete?: boolean;
  isSafePtxnNeedToHandle?: boolean;
  newSafe?: Safe;
  onHide?: () => void;
}

const ModalMigrate: React.FC<Props> = ({
  title = "Migrate Safe",
  modalStatus = true,
  isSafePtxnNeedToHandle,
  ptxnNeedToHandleData,
  reimbursedAmount,
  isModalDirectLink,
  isMigrationComplete,
  newSafe,
  onHide,
}: Props) => {
  const [openAdr, setOpenAdr] = useState(false);
  const dispatch = useAppDispatch();
  const reimbursedAmountTotal = Math.round(reimbursedAmount?.total * 1000000) / 1000000;

  const handleMigrateBtn = () => {
    if (isSafePtxnNeedToHandle) {
      onHide && onHide();
    } else if (isMigrationComplete) {
      Router.push({
        pathname: "/dashboard",
      });
      dispatch(setSelectedSafe(newSafe));
      localStorage.setItem(SELECTED_SAFE, JSON.stringify(newSafe));
    } else if (isModalDirectLink) {
      Router.push({
        pathname: "/load-safe",
      });
    } else {
      dispatch(setMigrationActiveData({}));
      dispatch(setIsMigrationActive(false));
      dispatch(setIsAssetListEmpty(false));
      dispatch(setstepProgressMigration(0));
      dispatch(setIsOwner(false));
      Router.push({
        pathname: "/safe-migration",
      });
    }
  };

  return (
    <div>
      <ModalGeneral title={title} modalStatus={modalStatus} onHide={isSafePtxnNeedToHandle ? onHide : undefined}>
        <div className={styles.modalMigrateCont}>
          <div className={styles.boxContent}>
            <IconMigrate style={isModalDirectLink ? { color: "#E15173" } : {}} />
            {isMigrationComplete ? (
              <>
                <div className={styles.boxDescribe}>
                  Your safe migration is completed. <br /> Your reimbursement request of <b>{reimbursedAmountTotal}</b> ALGO has
                  been submitted and will be reflected in your new safe shortly.
                </div>
                <div
                  className={`${styles.textModal} ${styles.big} ${styles.collapse} d-flex align-items-center gap-1`}
                  onClick={() => setOpenAdr(!openAdr)}
                  aria-controls="conten-tx"
                  aria-expanded={openAdr}
                >
                  <span>Show Reimbursement Breakdown</span>
                  <img src="/images/safe/icon-arrow-down.svg" className={!openAdr ? styles.rotate : ""} alt="" />
                </div>
                <Collapse in={openAdr}>
                  <div id="conten-tx">
                    <div className={styles.txContent}>
                      <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center`}>
                        <span>
                          <b>Overall Asset Transfer Fees -</b>
                        </span>
                        <span>{strTruncateMiddle(reimbursedAmount.overallAssetTransferFees)} ALGO</span>
                      </div>
                      <div className={`${styles.textModal} ${styles.big} d-flex gap-1 align-items-center`}>
                        <span>
                          <b>Overall Safe Creation Fees -</b>
                        </span>
                        <span>{strTruncateMiddle(reimbursedAmount.overallSafeCreationFees)} ALGO</span>
                      </div>
                    </div>
                  </div>
                </Collapse>
              </>
            ) : (
              <>
                <div className={styles.boxDescribe}>
                  {isModalDirectLink ? (
                    "No safes selected to migrate. Please load a safe before proceeding to the migration process."
                  ) : isSafePtxnNeedToHandle ? (
                    <div className={styles.detailInfo}>
                      Your safe is due for migration. Please resolve the following issues before we begin.
                      <ul>
                        {ptxnNeedToHandleData?.ptxnSafeMaxNeedToHandle > 0 ? (
                          <li>
                            Please execute/delete at least {ptxnNeedToHandleData?.ptxnSafeMaxNeedToHandle} pending transactions.
                          </li>
                        ) : (
                          ""
                        )}
                        {ptxnNeedToHandleData?.ptxnPerOwnerNeedToHandle > 0 ? (
                          <li>
                            Please execute/delete at least {ptxnNeedToHandleData?.ptxnPerOwnerNeedToHandle} pending transactions
                            initiated by you.
                          </li>
                        ) : (
                          ""
                        )}
                        {ptxnNeedToHandleData?.isUrgentPtxnNeedToHandle ? (
                          <li>Please execute/resolve urgent pending transaction.</li>
                        ) : (
                          ""
                        )}
                      </ul>
                    </div>
                  ) : (
                    "You are using the older version of the safe. Consider migrating to a new one. "
                  )}
                </div>
                {/* {!isSafePtxnNeedToHandle &&
                    <a href='#' className={`${styles.boxDescribe} ${styles.link}`}>
                      Learn More About Safe Migration
                    </a>
                  } */}
              </>
            )}
          </div>
          <div className="box-safe default gap-0 w-100">
            <div className="box-button mx-auto mt-3 w-100">
              <button className="btn default w-100" onClick={() => handleMigrateBtn()}>
                {isMigrationComplete
                  ? "GO TO MY NEW SAFE"
                  : isModalDirectLink
                  ? "LOAD SAFE"
                  : isSafePtxnNeedToHandle
                  ? "CLOSE"
                  : "MIGRATE"}
              </button>
            </div>
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalMigrate;
