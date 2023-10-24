import { digitGroupingRoundUp, priceDecimalDigit } from "shared/utils";
import styles from "./LedgerDetails.module.scss";
import Image from "next/image";
import MoneySendIcon from "frontend/components/Icons/MoneySend";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import { Dispatch, SetStateAction, MouseEventHandler } from "react";
import { useAppSelector } from "frontend/redux/hooks";
import { getIsHaveUrgentPtxn } from "frontend/redux/features/safe/safeSlice";

export default function AssetHeader({
  asset,
  index,
  onSend,
  onReceive,
  setModalMinimumBalance,
}: {
  asset: any;
  index: number;
  onSend?: MouseEventHandler;
  onReceive?: MouseEventHandler;
  setModalMinimumBalance: Dispatch<SetStateAction<boolean>>;
}) {
  const decoratedOnClick = useAccordionButton(String(asset.id));
  const isHaveUrgentPtxn: boolean = useAppSelector(getIsHaveUrgentPtxn);

  return (
    <div className={styles["token-card"]} key={index} onClick={decoratedOnClick}>
      <div className={styles["logo"]}>
        <img
          className={styles["asset-icon-mobile"]}
          src={`${asset["id"] === 0 ? "/images/assets-icons/ALGO.svg" : "/images/assets-icons/CUSTOM.svg"}`}
          alt={asset["unit-name"] + ` logo`}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = "/images/assets-icons/CUSTOM.svg";
          }}
        />
      </div>
      <div className={styles["content"]}>
        <div className={styles["left-content"]}>
          <div className={styles["header"]}>
            <div className="d-flex flex-row gap-1 align-items-center">
              {asset["unit-name"]}
              {asset["id"] === 0 && (
                <div
                  role="button"
                  className={`d-flex gap-1 align-items-center ${styles.linkIcon}`}
                  onClick={() => {
                    setModalMinimumBalance(true);
                  }}
                >
                  <Image
                    alt="Icon Info"
                    src="/images/icon-info-black.svg"
                    className="d-flex gap-1 align-items-center"
                    layout="fill"
                    objectFit="cover"
                    quality={100}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles["right-content"]}>
          <div className={styles["text-container"]}>
            <div className={styles["header"]}>
              {digitGroupingRoundUp(asset.balance ? asset.balance / Math.pow(10, asset.decimals ?? 6) : 0, asset.decimals)}
            </div>
            <div className={styles["sub-header"]}>
              {" "}
              ${digitGroupingRoundUp(asset.value || 0, priceDecimalDigit(asset.value || 0))}
            </div>
          </div>
          <div className={`${styles.sendHeader} ${isHaveUrgentPtxn && styles.disabledBtn} d-flex`} role="button" onClick={onSend}>
            <MoneySendIcon />
          </div>
          <div
            className={`${styles.sendHeader} d-flex`}
            style={{ transform: "rotate(180deg)" }}
            role="button"
            onClick={onReceive}
          >
            <MoneySendIcon />
          </div>
        </div>
      </div>
    </div>
  );
}
