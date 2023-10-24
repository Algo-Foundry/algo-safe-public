import styles from "./BalanceOverview.module.scss";
import AddressGroup from "frontend/components/UI/AddressGroup";
import { getExplorerURL } from "shared/utils";
import SelectWalletDropdown from "frontend/components/UI/Safe/SelectWalletDropdown";
import { MouseEventHandler } from "react";
import { useAppSelector } from "frontend/redux/hooks";
import { getIsHaveUrgentPtxn } from "frontend/redux/features/safe/safeSlice";
import { thousandSeparator } from "frontend/utils/decimal";

interface Props {
  name: string;
  balance: number;
  addr?: string;
  appId?: number;
  onReceive?: MouseEventHandler;
  onSend?: MouseEventHandler;
}

const BalanceOverview: React.FC<Props> = ({ name, balance, addr, appId, onReceive, onSend }: Props) => {
  const isLedger = appId === undefined;
  const isHaveUrgentPtxn: boolean = useAppSelector(getIsHaveUrgentPtxn);

  const standardizeBalance = (balance: number) => {
    const _balance = balance === 0 ? balance.toFixed(0) : balance.toFixed(2);
    return _balance as unknown as number;
  };

  return (
    <div>
      <div className={styles.desktopVer}>
        <div className={`${styles.wrapperNew} ${isLedger ? styles.borderRadiusLedger : styles.borderRadiusSafe}`}>
          <div className={styles.container}>
            <img
              src={isLedger ? "/images/ledger-safe-transparent.svg" : "/images/create-safe-transparent.svg"}
              alt="icon"
              className={styles["label-img-desktop"]}
            />
            <div className={styles.gapWrapper}>
              <div className={styles.balanceWrapper}>
                <p className={`${name.length > 20 && styles.small}`}>{name}</p>
                {!isLedger ? (
                  <AddressGroup
                    // address={appId.toString()}
                    address={addr?.toString() || ""}
                    isRow
                    isTruncate
                    isNoMb
                    noQRCode
                    className={styles["address-text"]}
                    linkAddress={`${getExplorerURL()}/address/${addr || ""}`}
                  />
                ) : (
                  <AddressGroup
                    address={addr?.toString() || ""}
                    isRow
                    isTruncate
                    isNoMb
                    className={styles["address-text"]}
                    linkAddress={`${getExplorerURL()}/address/${addr || ""}`}
                    noQRCode
                  />
                )}
              </div>
              <div className={styles.amountWrapper}>
                <p className={styles.balanceText}>${thousandSeparator(standardizeBalance(balance))}</p>
                <div className={styles.icons}>
                  <div
                    className={`${styles.iconWrapper} ${isHaveUrgentPtxn && styles.disabledBtn}`}
                    role="button"
                    onClick={onSend}
                  >
                    <button style={{ border: "none" }} className="p-0">
                      {!isHaveUrgentPtxn ? (
                        <img src="images/icon-arrow-send.svg" alt="" className={`${styles.iconStyles}`} />
                      ) : (
                        <img src="images/icon-arrow-send-grey.svg" alt="" className={`${styles.iconStyles}`} />
                      )}
                    </button>
                    <div className={styles.boxTooltips}>Send</div>
                  </div>
                  <div className={styles.iconWrapper} role="button" onClick={onReceive}>
                    <button style={{ border: "none" }} className="p-0">
                      <img src="images/icon-arrow-receive.svg" alt="" className={styles.iconStyles} />
                    </button>
                    <div className={styles.boxTooltips}>Receive</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!isLedger && (
          <div className={styles.activeSigner}>
            <p>Active Signer :</p>

            <SelectWalletDropdown isComponentSm={true} isSafe={!isLedger} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceOverview;
