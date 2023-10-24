import styles from "./Tabs.module.scss";
import Image from "next/image";

type TabSelectionFunction = (index: number) => void;

interface Props {
  tabsData: any[];
  isSubPage?: boolean;
  selectedTab: TabSelectionFunction;
  isLedger?: boolean;
}

const MobileTabs: React.FC<Props> = ({ tabsData, selectedTab, isSubPage, isLedger }: Props) => {
  //determine tabs is a ledger
  // const isLedger = false;
  if (isLedger) {
    tabsData = tabsData.filter((item) => item.name !== "Account Settings");
  }

  return (
    <div className={`${styles.spacing} ${isSubPage ? "bg-mobile-white mb-n3" : ""}`}>
      <div className={`${styles.footer}`}>
        {tabsData.map((val, idx) => {
          if (val.name == "Transactions") {
            return (
              <button
                key={idx}
                style={{
                  borderColor: "transparent",
                  backgroundColor: "transparent",
                  color: val.isActive ? "#42A1B6" : "#B3B3B3",
                  fontWeight: "bold",
                  padding: "0",
                }}
                onClick={() => selectedTab(idx)}
              >
                <div className="d-flex flex-column gap-1">
                  <div style={{ height: "24px", position: "relative" }}>
                    <Image
                      src={`/assets/icons/${val.iconMob}${val.isActive ? "-active" : ""}.svg`}
                      width={24}
                      height={24}
                      alt="assets-icon"
                    />{" "}
                  </div>
                  <div className={styles["btn-text"]}>{val.shortName}</div>
                  {val.numReviewPtxns > 0 && (
                    <div
                      className={`
                  ${styles["ptxnNumBox"]}
                  ${val.isActive && styles["active"]}
                `}
                    >
                      {val.numReviewPtxns < 9 ? val.numReviewPtxns : `9+`}
                    </div>
                  )}
                </div>
              </button>
            );
          }
          return (
            <button
              key={idx}
              style={{
                borderColor: "transparent",
                backgroundColor: "transparent",
                color: val.isActive ? "#42A1B6" : "#B3B3B3",
                fontWeight: "bold",
                padding: "0",
              }}
              onClick={() => selectedTab(idx)}
            >
              <div className="d-flex flex-column gap-1">
                <div style={{ height: "24px", position: "relative" }}>
                  <Image
                    src={`/assets/icons/${val.iconMob}${val.isActive ? "-active" : ""}.svg`}
                    width={24}
                    height={24}
                    alt="assets-icon"
                  />{" "}
                  {/* { val.title == "Txn" && numPtxns != 0 &&
                      <div className={styles["badge-tx-mbl"]}>
                        {numPtxns}
                      </div>
                    }
                    {
                      val.title == "Assets" && minBalanceForTransaction > 0 &&
                      <div className={styles.badgeWarn}>
                        <WarningIcon />
                      </div>                      
                    } */}
                </div>

                <div className={styles["btn-text"]}>{val.shortName}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabs;
