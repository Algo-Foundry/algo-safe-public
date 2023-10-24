import React from "react";
import styles from "./SpinnerLoader.module.scss";

const SpinnerLoader = () => {
  return (
    <div className={styles.loaderContainer}>
      <img src="/images/safe/icon-safe-load.svg" alt="" />
    </div>
  );
};

export default SpinnerLoader;
