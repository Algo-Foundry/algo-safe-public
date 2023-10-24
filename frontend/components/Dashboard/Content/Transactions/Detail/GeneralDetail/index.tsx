import styles from "./GeneralDetail.module.scss";
import TransactionStatus from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus";
import BorderDivider from "frontend/components/UI/BorderDivider";
import AppTransactionDetail from "frontend/components/UI/AppTransactionDetail";
import Alert from "frontend/components/UI/Alert";
import ModalLogicSignature from "frontend/components/Dashboard/Content/Transactions/ModalLogicSignature";
import ModalNft from "frontend/components/Dashboard/Content/AssetsTable/ModalNft";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import NftImage from "frontend/components/UI/NftImage";
import moment from "moment";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getExplorerURL } from "shared/utils";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import NftService from "frontend/services/nft";

interface Props {
  dataDetail: any;
  onConfirm?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onDelete?: () => void;
  isUrgent?: boolean;
  isButtonHidden?: boolean;
  txnType?: string;
}

const GeneralDetail: React.FC<Props> = ({
  dataDetail,
  txnType,
  onConfirm,
  onReject,
  onExecute,
  onDelete,
  isUrgent,
  isButtonHidden,
}: Props) => {
  const ns = new NftService();
  const selectedSafe: any = useAppSelector(getSelectedSafe);
  const endOfTime = moment(dataDetail.expiry).format("MMM D, YYYY - h:mm:ss A");
  const executedAt = dataDetail.updated_at && moment(dataDetail.updated_at).format("MMM D, YYYY - h:mm:ss A");
  const initiatorName = selectedSafe.owners?.find((v: any) => v.addr === dataDetail.sender)?.name;
  const initiatorLink = `${getExplorerURL()}/address/${dataDetail.sender}`;
  const parsedPayload = dataDetail.parsedPayload[0];
  const payload = dataDetail.payload[0];
  const totalNetFees = Math.round(dataDetail.totalFees * 1000000) / 1000000;

  //parsedPayload detail
  const assetID = parsedPayload.payloadAssetID;
  const assetName = parsedPayload.payloadAssetName;
  const assetUnit = parsedPayload.payloadAssetUnitName;
  const isNftActive = parsedPayload.payloadIsNft;
  const assetNftImgUrl = parsedPayload.payloadNftImgUrl;
  const payloadTo = parsedPayload.payloadTo;
  const payloadFrom = parsedPayload.payloadFrom;
  const payloadAppID = parsedPayload.payloadAppID;
  const payloadDisplayAmount = parsedPayload.displayAmount;
  const payloadFreezeAddr = parsedPayload.payloadFreezeAddress;
  const payloadManagerAddr = parsedPayload.payloadManagerAddress;
  const payloadClawbackAddr = parsedPayload.payloadClawbackAddress;
  const payloadIsAssetFrozen = parsedPayload.payloadIsAssetFrozen;
  const payloadCloseRemainderTo = parsedPayload.payloadCloseRemainderTo;

  const [windowWidth, setWindowWidth] = useState(0);
  const [modalDetailNft, setModalDetailNft] = useState(false);
  const [modalLogicSignature, setModalLogicSignature] = useState({
    status: false,
    title: "",
    isRawTxn: false,
    value: "",
  });
  const [newNfts, setNewNfts] = useState<any[]>([]);

  const getDetailNft = async () => {
    if (!assetNftImgUrl) return;
    let assetNft = { id: assetID };
    try {
      const res = await ns.getAssetDetail(assetID);
      if (res.params) {
        assetNft = res.params;
        assetNft.id = assetID;
      }
    } catch (err: any) {
      console.log(err);
    }
    const dataNft = await ns.formatNft(assetID);
    setNewNfts([dataNft]);
  };

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

  useEffect(() => {
    getDetailNft();
  }, [modalDetailNft]);

  return (
    <>
      {modalDetailNft ? (
        <ModalNft
          modalStatus={modalDetailNft}
          onHide={() => {
            setModalDetailNft(false);
          }}
          isHideButton={true}
          dataNft={newNfts[0]}
        />
      ) : (
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
            <div className={`${styles["initiator-info"]} ${txnType && styles["initiator-space"]}`}>
              <label>
                <b>Initiator :</b>
              </label>
              {initiatorName ? (
                <div className={styles["initiator-value"]}>
                  <div className={styles["value-group"]}>
                    <b>{initiatorName}</b>
                    <a href={initiatorLink} className={`${styles["box-icon-sm"]}`} target="_blank" rel="noreferrer">
                      <Image
                        alt="Icon External Link"
                        src="/images/safe/icon-external-link.svg"
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                      />
                    </a>
                  </div>
                  <span>{dataDetail.sender}</span>
                </div>
              ) : (
                "-"
              )}
            </div>

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
              <FormInfo label="Network Fee" value={`${totalNetFees} Algo`} isLabelMax />
            </div>

            {executedAt && dataDetail.txnId && (
              <div className={styles["send-info"]}>
                <FormInfo label="Tx Hash" value={dataDetail.txnId} isLabelMax isLabelAlignStart isValueAddress isTxn isNoMb />
              </div>
            )}

            {txnType == "dapp" && (
              <div className={styles["send-info"]}>
                <FormInfo label="No. of Txns" value={dataDetail.payload?.length} isLabelMax />
              </div>
            )}

            {txnType != "asset-create" && !txnType?.includes("dapp") && txnType != "key-registration" && (
              <>
                <BorderDivider isGrey />

                {txnType != "send" &&
                  assetID &&
                  (isNftActive ? (
                    <div className={styles["nft-info"]}>
                      <label>
                        <b>Asset :</b>
                      </label>
                      <div className={styles["nft-asset"]}>
                        <NftImage url={assetNftImgUrl} isIconLinkSm />
                        <div className="d-block">
                          <span role="button" onClick={() => setModalDetailNft(true)}>
                            {assetName}
                          </span>
                          <p>
                            {assetID} | {assetUnit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  ))}

                {txnType != "asset-new" &&
                  txnType != "asset-remove" &&
                  txnType != "asset-destroy" &&
                  txnType != "asset-modify" && (
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
                      <FormInfo label="To" value={payloadTo} isLabelMax isLabelAlignStart />
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

                {(payloadManagerAddr || txnType == "asset-create") && (
                  <div className={styles["send-info"]}>
                    <FormInfo label="Manager Address" value={payloadManagerAddr} isLabelMax isLabelAlignStart />
                  </div>
                )}

                {txnType == "asset-freeze" && (
                  <div className={styles["send-info"]}>
                    <FormInfo label="Asset Frozen" value={`${payloadIsAssetFrozen}`} isLabelMax isLabelAlignStart />
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

            {txnType == "asset-remove" && payloadDisplayAmount ? (
              <>
                <BorderDivider isGrey />

                <div className={styles["send-info"]}>
                  <FormInfo label="Balance Amount" value={`${payloadDisplayAmount} ${assetUnit ?? "-"}`} isLabelMax />
                </div>

                <div className={styles["send-info"]}>
                  <FormInfo label="Transfer To" value={payloadCloseRemainderTo} isLabelMax isLabelAlignStart />
                </div>
              </>
            ) : (
              ""
            )}

            <BorderDivider isGrey />

            {txnType == "dapp" && <AppTransactionDetail data={dataDetail} dappType={txnType} />}

            <div className="d-flex gap-3">
              {txnType != "dapp" && (
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
              )}

              <div
                className="text-decoration-underline"
                style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
                role="button"
                onClick={() =>
                  setModalLogicSignature({
                    status: true,
                    isRawTxn: false,
                    title: "Logic Signature",
                    value: dataDetail.lsig_program,
                  })
                }
              >
                Show Logic Signature
              </div>
            </div>

            {txnType == "asset-new" && !isUrgent && !isButtonHidden && dataDetail.status !== "Expired" && (
              <div className="mt-auto">
                <Alert
                  message={
                    "Make sure the safe has sufficient balance before executing this transaction (+0.1 ALGO for each asset type added)."
                  }
                  isWarning
                />
              </div>
            )}

            {dataDetail.status !== "Success" && txnType?.includes("dapp") && (
              <div className="mt-1">
                <Alert message={"Only the initiator is able to execute Dapp transactions."} isWarning />
              </div>
            )}
          </div>

          <BorderDivider isResponsive isOrange={isUrgent} />

          <div className={styles["detail-right"]}>
            <TransactionStatus
              data={dataDetail}
              onConfirm={onConfirm}
              onReject={onReject}
              onDelete={onDelete}
              onExecute={onExecute}
              isUrgent={isUrgent}
              isButtonHidden={isButtonHidden}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GeneralDetail;
