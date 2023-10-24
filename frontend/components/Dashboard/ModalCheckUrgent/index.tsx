import styles from "./ModalCheckUrgent.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import Attention from "frontend/components/Icons/Attention";
import Router from "next/router";
import { errors } from "shared/constants";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
}

const ModalCheckUrgent: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  return (
    <div>
      <ModalGeneral title="Resolve Urgent Transactions" onHide={onHide} modalStatus={modalStatus}>
        <div className={styles.modal}>
          <div className={`${styles["box-icon"]}`}>
            <Attention />
          </div>

          <div className={`${styles["text-discribe"]}`}>{errors.ERR_URGENT_PTXN_EXISTS}</div>

          <Button
            primary
            className={`${styles["close-btn"]}`}
            onClick={() => {
              if (Router.pathname === "/dashboard?tab=1") {
                Router.reload();
              } else {
                Router.push("/dashboard?tab=1");
              }
              onHide();
            }}
          >
            Go to transactions
          </Button>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalCheckUrgent;
