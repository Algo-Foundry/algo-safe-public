/* eslint-disable @next/next/no-img-element */
import styles from "./ModalConnectApps.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
//import WarningIcon from "frontend/components/Icons/Warning";
import BorderDivider from "frontend/components/UI/BorderDivider";
import Button from "frontend/components/Button";

interface AppDetail {
  description: string;
  icons: string[];
  name: string;
  url: string;
}
interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onConfirm: () => void;
  app: AppDetail;
}

const ModalConnectApps: React.FC<Props> = ({ modalStatus, onHide, onConfirm, app }: Props) => {
  return (
    <ModalGeneral title="Connect to Dapps" onHide={onHide} modalStatus={modalStatus}>
      <div className={styles.modal}>
        <div className={styles.modalImg}>
          <img src={app.icons[0]} alt="App logo"></img>
        </div>

        <div className=" text-center">
          <div className="d-flex justify-content-center align-items-center gap-2">
            <div className={styles["app-name"]}>{app.name}</div>
            {/* <div className={styles["app-id"]}>#</div> */}
          </div>

          <div className={styles["app-link"]}>{app.url}</div>
        </div>

        <BorderDivider></BorderDivider>

        <div className={styles["desc"]}>
          <div>
            You are about to connect your account to this external Dapp. <b>Only connect with sites you trust.</b>
          </div>
        </div>

        <BorderDivider></BorderDivider>

        <div className={styles["btn-wrapper"]}>
          <Button cancel onClick={onHide}>
            {" "}
            CANCEL{" "}
          </Button>
          <Button primary onClick={onConfirm}>
            {" "}
            CONNECT{" "}
          </Button>
        </div>
      </div>
    </ModalGeneral>
  );
};

export default ModalConnectApps;
