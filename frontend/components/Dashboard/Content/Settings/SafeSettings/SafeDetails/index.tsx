import React from "react";
import styles from "./SafeDetails.module.scss";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import BorderDivider from "frontend/components/UI/BorderDivider";
import { algoexplorerTransactionUrl } from "frontend/utils/string";

const SafeDetails = () => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);

  return (
    <div className={styles.container}>
      <div className={styles.titleWrapper}>
        <p className={styles.titleHeader}>Safe Details</p>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.rowLeft}>
          <div className={styles.colOne}>
            <p>Safe ID</p>
            <div className={styles.textBold}>
              <p>{selectedSafe.appId}</p>
              <IconCopy copy={selectedSafe.appId} />
              <IconLink link={algoexplorerTransactionUrl({ id: String(selectedSafe.appId), path: "application" })} />
            </div>
          </div>
          <BorderDivider isVertical className={styles.borderWidthVertical} />
          <div className={styles.rowRight}>
            <div className={styles.colOne}>
              <p>Total number of co-signers</p>
              <p className={styles.textBold}>{selectedSafe.num_owners}</p>
            </div>
            <div className={styles.colOne}>
              <p>Required Number of signatures</p>
              <p className={styles.textBold}>{selectedSafe.threshold}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeDetails;
