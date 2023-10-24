/* eslint-disable @next/next/no-img-element */
import styles from "./Loader.module.scss";

const LedgerLoader = () => {
  return (
    <div className={`${styles.wrapLoader}`}>
      <div className={styles.loader}>
        <img src="/images/safe/icon-loader.svg" className={styles.iconSizer} alt="icon" />
      </div>
      <img src="/images/dashboard/ledger-import-blue-big-transparent.svg" alt="icon" className={styles["ledger-icon"]} />
    </div>
  );
};

export default LedgerLoader;
