import styles from "./Transactions.module.scss";
import NewTabs from "frontend/components/UI/NewTabs";
import TransactionMenu from "frontend/components/Dashboard/Content/Transactions/Item/TransactionsMenu";
import LedgerTransactions from "../LedgerDetails/LedgerTransactions";
import { useState } from "react";

const Transactions = () => {
  const [tabsData, setTabsData] = useState([
    { name: "Active", isActive: true },
    { name: "History", isActive: false },
  ]);

  const selectedTabs = (index: number) => {
    setTabsData((prevItems) => prevItems.map((e, i) => ({ ...e, isActive: i === index })));
  };

  return (
    <div>
      <div className={`${styles["tab-menu"]}`}>
        <NewTabs tabsData={tabsData} selectedTab={selectedTabs} />
      </div>
      <div className={styles["tabs-details"]}>
        {tabsData[0].isActive && (
          <div className={`${styles["filter-container"]} `}>
            <div className={styles.switcher}>
              <div onClick={() => selectedTabs(0)} className={`${tabsData[0].isActive && styles["active"]} ${styles["pills"]}`}>
                {tabsData[0].name}
              </div>
              <div onClick={() => selectedTabs(1)} className={`${tabsData[1].isActive && styles["active"]} ${styles["pills"]}`}>
                {tabsData[1].name}
              </div>
            </div>
          </div>
        )}
        <div className={`${styles["table-container"]}`}>
          {tabsData[0].isActive && <TransactionMenu />}
          {tabsData[1].isActive && (
            <LedgerTransactions>
              <div className={styles.switcher}>
                <div onClick={() => selectedTabs(0)} className={`${tabsData[0].isActive && styles["active"]} ${styles["pills"]}`}>
                  {tabsData[0].name}
                </div>
                <div onClick={() => selectedTabs(1)} className={`${tabsData[1].isActive && styles["active"]} ${styles["pills"]}`}>
                  {tabsData[1].name}
                </div>
              </div>
            </LedgerTransactions>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
