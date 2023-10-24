import styles from "./Tabs.module.scss";

type TabSelectionFunction = (index: number) => void;

interface TabData {
  name: string;
  shortName?: string;
  isActive: boolean;
  icon?: JSX.Element;
  iconMob?: string;
  numReviewPtxns?: number;
}

interface Props {
  tabsData: TabData[];
  isSubPage?: boolean;
  isMobileHidden?: boolean;
  selectedTab: TabSelectionFunction;
  isFullWidth?: boolean;
}

const Tabs: React.FC<Props> = ({ tabsData, selectedTab, isSubPage, isMobileHidden, isFullWidth = false }: Props) => {
  //determine tabs is a ledger
  const isLedger = false;
  if (isLedger) {
    tabsData = tabsData.filter((item) => item.name !== "Account Settings");
  }

  const tabLength = tabsData.length;

  return (
    <div
      className={`${!isFullWidth ? styles["transactions-menu"] : styles["transactions-menu-full-width"]} ${
        isMobileHidden ? styles["m-none"] : ""
      }`}
    >
      <div
        className={`
        ${styles["wrapper-tab-menu"]} 
        ${isSubPage && styles["subpage-version"]}
      `}
      >
        {tabsData.map((item, idx) => {
          if (item.name == "Transactions") {
            const numReviewPtxn = item.numReviewPtxns ? item.numReviewPtxns : 0;
            return (
              <div
                className={`
                  ${styles["tab-menu"]}
                  ${item.isActive && styles["active"]}
                `}
                onClick={() => selectedTab(idx)}
                key={idx}
              >
                <div className={`${styles["container"]}`}>
                  <div>{item.name}</div>
                  {numReviewPtxn > 0 && (
                    <div className={`${styles["ptxnNumBox"]} ${item.isActive && styles["active"]}`}>
                      {numReviewPtxn < 9 ? numReviewPtxn : `9+`}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div
              className={`
                  ${styles["tab-menu"]} 
                  ${item.isActive && styles["active"]}
                `}
              onClick={() => selectedTab(idx)}
              key={idx}
            >
              {item.name}
            </div>
          );
        })}
        <div className={`${styles["glider-bar"]} ${tabLength == 3 && styles["third"]} ${tabLength == 4 && styles["fourth"]}`} />
        {tabLength > 2 && (
          <div className={`${styles["glider-bar"]} ${tabLength == 3 && styles["third"]} ${tabLength == 4 && styles["fourth"]}`} />
        )}
        {tabLength > 3 && (
          <div className={`${styles["glider-bar"]} ${tabLength == 3 && styles["third"]} ${tabLength == 4 && styles["fourth"]}`} />
        )}
        {tabLength > 4 && (
          <div className={`${styles["glider-bar"]} ${tabLength == 3 && styles["third"]} ${tabLength == 4 && styles["fourth"]}`} />
        )}
        <div className={styles["border-bar"]} />
      </div>
    </div>
  );
};

export default Tabs;
