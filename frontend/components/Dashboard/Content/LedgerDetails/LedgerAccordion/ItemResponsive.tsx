import styles from "./LedgerAccordion.module.scss";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import { strTruncateMiddle } from "shared/utils";
import IconLink from "frontend/components/UI/Icon/iconLink";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import { algoexplorerTransactionUrl } from "frontend/utils/string";
import { thousandSeparator } from "frontend/utils/decimal";

interface Props {
  open: boolean;
  handleAccordionOpen: () => void;
  addressTx: string;
  date: string;
  amount: number;
  typeImg: () => JSX.Element | undefined;
  typeText: () => string | undefined;
  type: string;
  receiveAdr: string | undefined;
  asaId: number;
  detailAsset: {
    assetName: string;
    decimal: number;
  };
  getMaxDecimal: (num: number) => number;
  fee: number | undefined;
  appId: number | undefined;
}

const ItemResponsive = (props: Props) => {
  const {
    open,
    handleAccordionOpen,
    addressTx,
    date,
    amount,
    typeImg,
    typeText,
    type,
    receiveAdr,
    asaId,
    detailAsset,
    getMaxDecimal,
    fee,
    appId,
  } = props;

  return (
    <>
      <div className={styles.desktopMode}>
        <div
          className={`${styles.accordionItem} ${open && styles.active}`}
          onClick={handleAccordionOpen}
          aria-controls="collapse-items"
          aria-expanded={open}
        >
          <div className={`${styles.accordionItemWrap} align-items-center gap-1`}>
            <span>{`${strTruncateMiddle(addressTx, 10, 10)}`}</span>
            <IconCopy copy={addressTx ? addressTx.toString() : ""} />
            <IconLink link={algoexplorerTransactionUrl({ id: addressTx ? addressTx.toString() : "", path: "tx" })} />
          </div>
          <div className={`${styles.accordionItemWrap} justify-content-between gap-0`}>
            <span className={`d-none d-lg-block`}>{`${date}`}</span>
            <div className={`d-flex d-lg-none flex-column gap-0`}>
              <span>
                {amount ? `${detailAsset.decimal === 0 ? amount : getMaxDecimal(amount)} ${detailAsset.assetName}` : "-"}
              </span>
              <div className={`${styles.subtitle}`}>{`${date}`}</div>
            </div>
          </div>
          <div className={`${styles.accordionItemWrap} flex-column align-items-start gap-0`}>
            <div className={`${styles.boxType} d-flex align-items-center gap-1`}>
              {typeImg()}
              <span>{typeText()}</span>
            </div>
            <div className={`${styles.subtitle}`}>
              {appId
                ? `APP ID : ${appId}`
                : type === "asset-send" && receiveAdr
                ? `to ${strTruncateMiddle(receiveAdr, 5, 5)}`
                : asaId
                ? `ASA ID ${asaId}`
                : ""}
            </div>
          </div>
          <div className={`${styles.accordionItemWrap}`}>
            {type !== "asset-send" && type !== "asset-receive"
              ? "-"
              : thousandSeparator(amount as number)
              ? `${
                  detailAsset.decimal === 0
                    ? thousandSeparator(amount as number)
                    : thousandSeparator(getMaxDecimal(amount as number))
                } ${detailAsset.assetName}`
              : `0 ${detailAsset.assetName}`}
          </div>
          <div className={`${styles.accordionItemWrap} justify-content-between gap-0`}>
            <div>{`${getMaxDecimal(fee || 0)}`}</div>
            <div className={`${styles.boxArrow} ${open == true ? styles.active : ""}`}>
              <ArrowDown />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileMode}>
        <div
          className={`
            ${styles.accordionItem}
            ${open && styles.active}                         
          `}
          onClick={handleAccordionOpen}
          aria-controls="collapse-items"
          aria-expanded={open}
        >
          <div className={`${styles.accordionItemWrap} align-items-start gap-1`}>
            <span>{`${strTruncateMiddle(addressTx, 5, 5)}`}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", width: "100%" }}>
              <IconCopy copy={addressTx ? addressTx.toString() : ""} />
              <IconLink link={algoexplorerTransactionUrl({ id: addressTx ? addressTx.toString() : "", path: "tx" })} />
            </div>
          </div>
          <div className={`${styles.accordionItemWrap} flex-column align-items-start gap-0`} style={{ width: "30%" }}>
            <div className={`${styles.boxType} d-flex align-items-center gap-1`} style={{ marginLeft: "-2px", width: "100%" }}>
              {typeImg()}
              <span>{typeText()}</span>
            </div>
            <div className={`${styles.subtitle}`}>
              {appId
                ? `APP ID : ${appId}`
                : type === "asset-send" && receiveAdr
                ? `to ${strTruncateMiddle(receiveAdr, 5, 5)}`
                : asaId
                ? `ASA ID ${asaId}`
                : ""}
            </div>
          </div>
          <div className={`${styles.accordionItemWrap}`}>
            {type !== "asset-send"
              ? "-"
              : amount
              ? `${detailAsset.decimal === 0 ? amount : getMaxDecimal(amount)} ${detailAsset.assetName}`
              : `0 ${detailAsset.assetName}`}
          </div>
          <div className={`${styles.accordionItemWrap}`}>{`${getMaxDecimal(fee || 0)}`}</div>
          <div className={`${styles.accordionItemWrap} justify-content-between gap-0`}>
            <span className={`d-none d-lg-block`}>{`${date}`}</span>
            <div className={`d-flex d-lg-none flex-column gap-0 align-items-end`}>
              <span>
                {amount ? `${detailAsset.decimal === 0 ? amount : getMaxDecimal(amount)} ${detailAsset.assetName}` : "-"}
              </span>
              <div className={`${styles.subtitle}`}>{`${date}`}</div>
            </div>

            <div className={`${styles.boxArrow} ${open == true ? styles.active : ""}`}>
              <ArrowDown />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemResponsive;
