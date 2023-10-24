import styles from "./Tabs.module.scss";

interface Props {
  tabsData: any[];
  isSubPage?: boolean;
  selectedTab: (id: number) => void;
}

const Tabs: React.FC<Props> = ({ tabsData, selectedTab, isSubPage }: Props) => {
  return (
    <div className={styles["transactions-menu"]}>
      <div
        className={`
        ${styles["wrapper-tab-menu"]} 
        ${isSubPage && styles["subpage-version"]}
      `}
      >
        {tabsData.map((item, idx) => {
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
        <div className={styles["glider-bar"]} />
        <div className={styles["border-bar"]} />
      </div>
    </div>
  );
};

export default Tabs;
