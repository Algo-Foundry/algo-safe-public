import styles from "./ConfirmCreateLeaveModal.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onConfirm: () => void;
}

const ConfirmCreateLeaveModal: React.FC<Props> = ({ modalStatus, onHide, onConfirm }: Props) => {
  return (
    <ModalGeneral title={"Continue Progress"} onHide={onHide} modalStatus={modalStatus} noCloseBtn>
      <div className={styles["createLeaveModal"]}>
        <div className={`${styles["content-top"]}`}>
          <span>
            Are you sure you want to leave?
            <br />
            Your progress and data will be discarded if you navigate away from this page.
          </span>
        </div>
        <div className={`${styles["content-bottom"]} ${styles.borderNone}`}>
          <div className={styles["btn-wrapper"]}>
            <Button cancel onClick={onConfirm} className={styles["btn-cancel"]}>
              DISCARD
            </Button>
            <Button onClick={onHide} primary className={styles["btn-confirm"]}>
              STAY ON PAGE
            </Button>
          </div>
        </div>
      </div>
    </ModalGeneral>
  );
};

export default ConfirmCreateLeaveModal;
