/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from "react";
import styles from "./SafePolicies.module.scss";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
const SafePolicies = () => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);
  return (
    <div className={`${styles.container} d-none d-lg-block`}>
      <div className={styles.titleWrapper}>
        <p className={styles.titleHeader}>Safe Policies</p>
      </div>
      <div className={styles.contentWrapper}>
        <p className={styles.textBold}>Required Confirmations</p>
        <p>Any transaction requires the confirmation of :</p>
        <div className={styles.trxWrapper}>
          <img src="images/icon-people-outline.svg" className={styles.iconStyles} />
          <p>
            {selectedSafe.threshold} out of {selectedSafe.num_owners}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafePolicies;
