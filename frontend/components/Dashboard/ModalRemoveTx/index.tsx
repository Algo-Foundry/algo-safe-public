import styles from "./ModalRemoveTx.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import React from "react";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
}

const ModalRemoveTx: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  const onHideModal = () => {
    onHide();
  };

  function ModalTitle() {
    return (
      <div className="d-flex align-items-center gap-2">
        <div>Delete Transaction</div>
      </div>
    );
  }

  return (
    <div>
      <ModalGeneral
        onHide={onHideModal}
        modalStatus={modalStatus}
        fullscreenSm
        titleChild={<ModalTitle />}
        backdrop="static"
        isPaddingTitleFixed
      >
        <div className={styles.modal}>
          <div className={styles["modal-body"]}>
            <div className={styles.textWrapper}>
              <p style={{ textAlign: "center" }}>
                You are about to delete this pending transaction based on the number of rejections, would you like to proceed?
              </p>
            </div>
          </div>
          <div className={`${styles["btn-wrapper"]} flex-column-reverse flex-md-row`}>
            <Button className={styles.btn} cancel>
              CANCEL
            </Button>
            <Button className={styles.btn} danger>
              DELETE
            </Button>
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalRemoveTx;
