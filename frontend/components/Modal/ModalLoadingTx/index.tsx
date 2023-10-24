import styles from "./ModalLoading.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import StepProgressBar from "frontend/components/UI/progress-bar/StepProgressBar";
import BorderDivider from "frontend/components/UI/BorderDivider";

const iconWaiting = "/images/safe/icon-safe-load.svg";
const iconWarning = "/images/icon-exclamation.svg";

interface Props {
  modalStatus: boolean;
  onHide?: () => void;
  step?: number;
  title?: any;
  items?: Array<string>;
  disabledFooter?: boolean;
}

const ModalLoading: React.FC<Props> = ({ modalStatus, onHide, step, title, items, disabledFooter = false }: Props) => {
  return (
    <div>
      <ModalGeneral title={title} onHide={onHide} modalStatus={modalStatus} isNoMargin>
        <div className={styles.modalLoadingCont}>
          {/* <img src={iconWaiting} className={styles.iconModal} alt="" /> */}
          <div className={styles.loader1}>
            <img src={iconWaiting} alt="" />
          </div>
          {items && (
            <>
              <div className={styles.boxProgress}>
                <StepProgressBar items={items} step={step || 0} />
              </div>
              {!disabledFooter && (
                <>
                  <BorderDivider className="mb-3" />
                  <div className={styles.warningInfo}>
                    <div>
                      <img src={iconWarning} alt="icon" />
                    </div>
                    <div className={styles.textModal}>
                      If you are using Pera Algo Wallet, please make sure that you leave your app open on your mobile device to
                      receive and approve transactions
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalLoading;
