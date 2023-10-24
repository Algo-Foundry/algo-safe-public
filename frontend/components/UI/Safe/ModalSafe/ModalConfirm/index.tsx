import styles from "./ModalConfirm.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import StepProgressBar from "frontend/components/UI/progress-bar/StepProgressBar";
import BorderDivider from "frontend/components/UI/BorderDivider";

const iconWaiting = "/images/safe/icon-safe-load.svg";
const iconWarning = "/images/icon-exclamation.svg";
const itemsModal = ["Creating ", "Success"];

interface Props {
  modalStatus: boolean;
  onHide?: () => void;
  step?: number;
  title?: any;
  items?: Array<string>;
  disabledStep?: boolean;
  disabledFooter?: boolean;
}

const ModalConfirm: React.FC<Props> = ({
  modalStatus,
  onHide,
  step = 2,
  title,
  items = itemsModal,
  disabledStep = false,
  disabledFooter = false,
}: Props) => {
  return (
    <div>
      <ModalGeneral title={title} onHide={onHide} modalStatus={modalStatus}>
        <div className={styles.modalConfirmCont}>
          {/* <img src={iconWaiting} className={styles.iconModal} alt="" /> */}
          <div className={styles.loader1}>
            <img src={iconWaiting} alt="" />
          </div>
          {!disabledStep && (
            <div className={styles.boxProgress}>
              <StepProgressBar items={items} step={step} />
            </div>
          )}
          {!disabledFooter && (
            <div className="d-flex flex-column w-100">
              <BorderDivider className="mb-3" />
              <div className={styles.mobileWarning}>
                <div className={styles.mrWarn}>
                  <img src={iconWarning} alt="icon" />
                </div>
                <div className={styles.textModal}>
                  If you are using Pera Algo Wallet, please make sure that you leave your app open on your mobile device to
                  receive and approve transactions
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalConfirm;
