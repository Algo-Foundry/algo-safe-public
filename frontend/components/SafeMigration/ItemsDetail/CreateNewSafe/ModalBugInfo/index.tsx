import styles from "./ModalBugInfo.module.scss";
import Button from "frontend/components/Button";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Fail from "frontend/components/Icons/Fail";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  title?: string;
  message?: string;
}

const ModalBugInfo: React.FC<Props> = ({ modalStatus, onHide, title = "ALGO SAFE V1.1", message = "" }: Props) => {
  return (
    <div>
      <ModalGeneral title={title} onHide={onHide} modalStatus={modalStatus}>
        {message == "" && (
          <div className={styles["modal-info"]}>
            <b>Updates</b>
            <ul>
              <li>Removal of expired pending transactions does not reduce the over number of safe pending transactions.</li>
              <li>The maximum number of pending transactions can exceed 21.</li>
              <li>
                Delete safe request cannot be removed in the event of a deadlock. A deadlock occurs where all the signers have
                signed the request and the number of rejections and approvals did not meet the signing threshold.
              </li>
            </ul>
          </div>
        )}
        {message != "" && (
          <div className={styles["modal-info"]}>
            <div className={styles.icon}>
              <Fail />
            </div>
            <p className="text-center">{message}</p>
          </div>
        )}
        <Button primary className="w-100" onClick={onHide}>
          CLOSE
        </Button>
      </ModalGeneral>
    </div>
  );
};

export default ModalBugInfo;
