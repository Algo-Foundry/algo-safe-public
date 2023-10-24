import styles from "./Loader.module.scss";
import Loader from "frontend/components/Icons/Loader";

interface Props {
  isLedger?: boolean;
  loadingMessage?: string;
}

const LoaderUI: React.FC<Props> = ({ isLedger, loadingMessage }: Props) => {
  return (
    <div className={`${styles.boxLoader} my-auto`}>
      <div className={`${styles.wrapLoader} ${isLedger ? styles.ledger : ""}`}>
        <Loader />
        {isLedger && (
          <img src="/images/dashboard/ledger-import-blue-big-transparent.svg" alt="icon" className={styles["ledger-icon"]} />
        )}
      </div>
      <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>
        {loadingMessage ? loadingMessage : isLedger ? "Connecting Ledger..." : "Loading ...."}
      </div>
    </div>
  );
};

export default LoaderUI;
