import styles from "./style.module.scss";
import Image from "next/image";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import AppConfig from "config/appConfig";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
}

const ModalExceedPtxn: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  return (
    <ModalGeneral title="Warning" onHide={onHide} modalStatus={modalStatus}>
      <div className={styles["safe-remove-popup"]}>
        <div className={styles["content-top"]}>
          <Image alt="Safe Button" src="/images/icon-warning-red.svg" width={100} height={100} />
          <span className={styles["text-info"]}>
            Your current pending transactions are hitting the maximum number of transactions ({AppConfig.maxPtxn})
          </span>
        </div>
      </div>
    </ModalGeneral>
  );
};

export default ModalExceedPtxn;
