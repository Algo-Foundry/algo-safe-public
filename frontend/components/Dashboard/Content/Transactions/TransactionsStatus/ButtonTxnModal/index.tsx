import styles from "./ButtonTxnModal.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";

interface Props {
  modalStatus: boolean;
  isLedger: boolean;
  modalContentStatus?: string;
  onConfirm?: () => void;
  onReject?: () => void;
  onLedgerExecute?: () => void;
  onExecute?: () => void;
  onHide: () => void;
}

const ButtonTxnModal: React.FC<Props> = ({
  modalStatus,
  onConfirm,
  onReject,
  onExecute,
  modalContentStatus,
  onHide,
  onLedgerExecute,
  isLedger,
}: Props) => {
  const title = {
    vote: "Sign",
    "change-vote": "Change Vote",
    execute: "Execute Transaction",
    "execute-reject": "Delete Transaction",
  };

  return (
    <ModalGeneral title={title[modalContentStatus as keyof typeof title]} onHide={onHide} modalStatus={modalStatus}>
      <div className={styles["modal"]}>
        {(modalContentStatus === "execute" || modalContentStatus === "execute-reject") && (
          <div>
            <div className={styles["modal-body"]}>
              <p style={{ textAlign: "center" }}>
                You are about to {modalContentStatus === "execute" ? " execute" : " delete"} this pending transaction based on the
                number of {modalContentStatus === "execute" ? " approvals" : "rejections"}, <br />
                would you like to proceed?
              </p>
            </div>
            <div className={`${styles["btn-wrapper"]} ${styles["execute"]}`}>
              <Button cancel onClick={onHide} className={styles["btn-cancel"]}>
                <p>CANCEL</p>
              </Button>
              <Button
                primary
                onClick={isLedger ? onLedgerExecute : onExecute}
                danger={modalContentStatus === "execute-reject"}
                className={styles["btn-proceed"]}
              >
                <p>{modalContentStatus === "execute-reject" ? "DELETE" : "EXECUTE"}</p>
              </Button>
            </div>
          </div>
        )}

        {modalContentStatus === "vote" && (
          <div className={`${styles["btn-wrapper"]}`}>
            <Button danger onClick={onReject} className={styles["btn-cancel"]}>
              <p>REJECT</p>
            </Button>
            <Button onClick={onConfirm} primary className={styles["btn-proceed"]}>
              <p>APPROVE</p>
            </Button>
          </div>
        )}
      </div>
    </ModalGeneral>
  );
};

export default ButtonTxnModal;
