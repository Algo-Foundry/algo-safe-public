/* eslint-disable @next/next/no-img-element */
import styles from "./ModalDisconnectApps.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import { Spinner } from "react-bootstrap";
import Button from "frontend/components/Button";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onConfirm: () => void;
  disabledDcAllBtn: boolean;
}

const ModalDisconnectApps: React.FC<Props> = ({ modalStatus, onHide, onConfirm, disabledDcAllBtn }: Props) => {
  return (
    <ModalGeneral title="Disconnect All Dapps" onHide={onHide} modalStatus={modalStatus}>
      <div className={styles.modal}>
        <div className={styles["desc"]}>
          <div>Are you sure you want to disconnect your ledger/safe from all Dapps? </div>
        </div>

        <div className={styles["btn-wrapper"]}>
          <Button cancel onClick={onHide}>
            {" "}
            CANCEL{" "}
          </Button>
          <Button primary onClick={onConfirm} disabled={disabledDcAllBtn}>
            {disabledDcAllBtn ? (
              <Spinner animation="border" role="status" size="sm">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              "CONFIRM"
            )}
          </Button>
        </div>
      </div>
    </ModalGeneral>
  );
};

export default ModalDisconnectApps;
