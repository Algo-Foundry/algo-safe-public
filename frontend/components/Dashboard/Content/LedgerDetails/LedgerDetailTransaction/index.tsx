import styles from "./LedgerDetailTransaction.module.scss";
import BorderDivider from "frontend/components/UI/BorderDivider";
import AppTransactionDetailLedger from "frontend/components/UI/AppTransactionDetailLedger";
import ModalLogicSignature from "frontend/components/Dashboard/Content/Transactions/ModalLogicSignature";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import moment from "moment";
import { useEffect, useState } from "react";

interface Props {
  dataDetail: any;
  txnType?: string;
  asaID?: number;
  receiveAdr?: string;
  assetDetail?: any;
  allAsset?: any;
  addressTx: string;
  closeRemainderTo?: string;
  closeTo?: string;
}

const LedgerDetailTransaction: React.FC<Props> = ({
  dataDetail,
  txnType,
  asaID,
  receiveAdr,
  assetDetail,
  allAsset,
  addressTx,
  closeRemainderTo,
  closeTo,
}: Props) => {
  const endOfTime = moment(dataDetail.txn["last-valid"] * 1000).format("MMM D, YYYY - h:mm:ss A");
  const executedAt =
    dataDetail.txn["round-time"] && moment(dataDetail.txn["round-time"] * 1000).format("MMM D, YYYY - h:mm:ss A");

  const payload = dataDetail.txn;
  const netFees = Math.round(dataDetail.txn.fee) / 1000000;
  const assetID = asaID;
  const assetUnit = dataDetail.txn["asset-transfer-transaction"] !== undefined ? assetDetail["unit-name"] : "ALGO";

  const payloadTo = receiveAdr;
  const payloadFrom = dataDetail.txn.sender;
  const payloadAppID = txnType == "dapp" ? dataDetail.txn["application-transaction"]["application-id"] : undefined;

  const payloadFreezeAddr = txnType === "asset-freeze" ? assetDetail.freeze : undefined;
  const payloadClawbackAddr = txnType === "asset-clawback" ? assetDetail.clawback : undefined;
  const payloadCloseRemainderTo =
    txnType === "asset-remove" ? dataDetail.txn["asset-transfer-transaction"]["close-to"] : undefined;

  const [windowWidth, setWindowWidth] = useState(0);
  const [modalLogicSignature, setModalLogicSignature] = useState({
    status: false,
    title: "",
    isRawTxn: false,
    value: "",
  });

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowResize);
    handleWindowResize();

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [windowWidth]);

  return (
    <div className={styles["general-detail"]}>
      <ModalLogicSignature
        modalStatus={modalLogicSignature.status}
        title={modalLogicSignature.title}
        lsigValue={modalLogicSignature.value}
        isRawTxn={modalLogicSignature.isRawTxn}
        onHide={() => {
          setModalLogicSignature({
            status: false,
            isRawTxn: false,
            title: "",
            value: "",
          });
        }}
      />

      <div className={styles["detail-left"]}>
        {!executedAt && (
          <div className={styles["send-info"]}>
            <FormInfo label="Expiry Date" value={endOfTime} isWidthMinimum={!txnType} isLabelMax />
          </div>
        )}

        {executedAt && (
          <div className={styles["send-info"]}>
            <FormInfo label="Executed Date" value={executedAt} isLabelMax />
          </div>
        )}

        <div className={styles["send-info"]}>
          <FormInfo label="Network Fee" value={`${netFees} Algo`} isLabelMax />
        </div>

        {executedAt && dataDetail.txn.id && (
          <div className={styles["send-info"]}>
            <FormInfo label="Tx Hash" value={dataDetail.txn.id} isLabelMax isLabelAlignStart isTxn isNoMb isValueAddress isRow />
          </div>
        )}

        {txnType != "asset-create" && !txnType?.includes("dapp") && txnType != "key-registration" && (
          <>
            <BorderDivider isGrey />

            {txnType != "asset-new" && txnType != "asset-remove" && txnType != "asset-destroy" && txnType != "asset-modify" && (
              <div className={styles["send-info"]}>
                <FormInfo label="From" value={payloadFrom} isLabelMax isLabelAlignStart />
              </div>
            )}

            {txnType != "asset-freeze" &&
              txnType != "asset-remove" &&
              txnType != "asset-new" &&
              txnType != "asset-destroy" &&
              txnType != "asset-modify" && (
                <div className={styles["send-info"]}>
                  {closeRemainderTo ? (
                    <FormInfo label="Balance Sent To" value={closeRemainderTo} isLabelMax isLabelAlignStart />
                  ) : closeTo ? (
                    <FormInfo label="Balance Sent To" value={closeTo} isLabelMax isLabelAlignStart />
                  ) : (
                    <FormInfo label="To" value={payloadTo} isLabelMax isLabelAlignStart />
                  )}
                </div>
              )}

            {txnType != "send" && assetID && (
              <div className={styles["send-info"]}>
                <FormInfo
                  label="Asset"
                  addtionalValueBefore={assetUnit ?? "-"}
                  value={assetID}
                  isAsset
                  isValueAddress
                  isLabelMax
                  isLabelAlignStart
                  isNoMb
                  isRow
                  isBracket
                />
              </div>
            )}

            {(payloadClawbackAddr || txnType == "asset-clawback") && (
              <div className={styles["send-info"]}>
                <FormInfo label="Clawback From" value={payloadClawbackAddr} isLabelMax isLabelAlignStart />
              </div>
            )}

            {(payloadFreezeAddr || txnType == "asset-freeze") && (
              <div className={styles["send-info"]}>
                <FormInfo label="Freeze Address" value={payloadFreezeAddr} isLabelMax isLabelAlignStart />
              </div>
            )}

            {txnType == "asset-freeze" && (
              <div className={styles["send-info"]}>
                <FormInfo label="Asset Frozen" value={`n/a`} isLabelMax isLabelAlignStart />
              </div>
            )}
          </>
        )}

        {txnType != "dapp-create" && txnType != "dapp" && !txnType?.includes("asset") && txnType != "key-registration" && (
          <>
            <BorderDivider isGrey />

            <div className={styles["send-info"]}>
              <FormInfo label="App ID" value={payloadAppID} isApp isValueAddress isLabelMax isLabelAlignStart isNoMb isRow />
            </div>
          </>
        )}

        {txnType == "asset-remove" ? (
          <div className={styles["send-info"]}>
            <FormInfo label="Asset Close to" value={payloadCloseRemainderTo} isLabelMax isLabelAlignStart />
          </div>
        ) : (
          ""
        )}

        <BorderDivider isGrey className="mt-auto d-none d-lg-block" />

        <div className="d-none d-lg-flex gap-3">
          <div
            className="text-decoration-underline"
            style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
            role="button"
            onClick={() =>
              setModalLogicSignature({
                status: true,
                isRawTxn: true,
                title: "Raw Transaction",
                value: JSON.stringify(payload, undefined, 2),
              })
            }
          >
            Raw Transaction
          </div>
        </div>
      </div>
      {txnType == "dapp" && (
        <>
          <BorderDivider isResponsive className="d-none d-lg-block" />
          <div className={styles["detail-right"]}>
            <AppTransactionDetailLedger
              addressTx={addressTx}
              data={dataDetail}
              dappType={txnType}
              allAsset={allAsset}
              noAccordionTitle
            />
          </div>
        </>
      )}
      <div className="d-flex d-lg-none gap-3" style={{ padding: "0 20px" }}>
        <div
          className="text-decoration-underline"
          style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
          role="button"
          onClick={() =>
            setModalLogicSignature({
              status: true,
              isRawTxn: true,
              title: "Raw Transaction",
              value: JSON.stringify(payload, undefined, 2),
            })
          }
        >
          Raw Transaction
        </div>
      </div>
    </div>
  );
};

export default LedgerDetailTransaction;
