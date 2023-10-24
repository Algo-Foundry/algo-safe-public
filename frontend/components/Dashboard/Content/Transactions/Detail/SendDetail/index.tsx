import styles from "./SendDetail.module.scss";
import TransactionStatus from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus";
import AddressGroup from "frontend/components/UI/AddressGroup";
import BorderDivider from "frontend/components/UI/BorderDivider";
import BoxRegular from "frontend/components/UI/Box/BoxRegular";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import ModalLogicSignature from "frontend/components/Dashboard/Content/Transactions/ModalLogicSignature";
import { useState } from "react";
import { getExplorerURL } from "shared/utils";
import moment from "moment";
import { encodeAddress } from "algosdk";

interface Props {
  txnType?: string;
  dataDetail: any;
  onConfirm?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onDelete?: () => void;
  isUrgent?: boolean;
  isButtonHidden?: boolean;
}

const SendDetail: React.FC<Props> = ({
  txnType,
  dataDetail,
  onConfirm,
  onReject,
  onExecute,
  onDelete,
  isUrgent,
  isButtonHidden,
}: Props) => {
  const assetID = dataDetail.payload[0].assetIndex;
  const endOfTime = moment(dataDetail.expiry).format("MMM D, YYYY - h:mm:ss A");
  const executedAt = dataDetail.updated_at && moment(dataDetail.updated_at).format("MMM D, YYYY - h:mm:ss A");
  const sendToAddr = dataDetail?.payload[0].to && encodeAddress(dataDetail.payload[0]?.to?.publicKey);
  const freezeAddr = dataDetail?.payload[0].freezeAccount && encodeAddress(dataDetail.payload[0]?.freezeAccount?.publicKey);
  const assetFrozen = dataDetail?.payload[0].freezeState && dataDetail?.payload[0].freezeState;

  const [modalLogicSignature, setModalLogicSignature] = useState({
    status: false,
    title: "",
  });

  return (
    <div className={styles["send-detail"]}>
      <ModalLogicSignature
        lsigValue={dataDetail.lsig_program}
        modalStatus={modalLogicSignature.status}
        title={modalLogicSignature.title}
        onHide={() => {
          setModalLogicSignature({
            status: false,
            title: "",
          });
        }}
      />
      <div className={styles["detail-left"]}>
        {txnType === "freeze-asset" ? (
          <BoxRegular>
            <span>
              You are freezing <strong> YLDY (#{assetID})</strong>
            </span>
          </BoxRegular>
        ) : (
          <BoxRegular className={`${isUrgent && "bg-white"}`}>
            <span>
              You are sending{" "}
              <b>
                {dataDetail.parsedPayload[0]?.displayAmount} {dataDetail.parsedPayload[0]?.payloadAssetName}
              </b>{" "}
              to :
            </span>
            <AddressGroup
              address={sendToAddr}
              linkAddress={`${getExplorerURL()}/address/${sendToAddr}`}
              noQRCode
              noCopyButton
              isTruncate
            />
          </BoxRegular>
        )}
        <div className={styles["send-info"]}>
          {txnType === "clawback" && <FormInfo label="Asset ID" value={assetID} isValueAddress isAsset />}
          {txnType === "freeze-asset" && <FormInfo label="Freeze Address" value={freezeAddr} isValueAddress />}
          {txnType === "freeze-asset" && <FormInfo label="Asset Frozen" value={assetFrozen ? "True" : "False"} />}
          {txnType !== "freeze-asset" && <FormInfo label="Transaction hash" value={dataDetail.txnId} isValueAddress isTxn />}
          {dataDetail?.parsedPayload[0]?.payloadType === "close-asset" && (
            <FormInfo label="Close remainder" value={dataDetail.parsedPayload[0].payloadCloseRemainderTo} isValueAddress isTxn />
          )}
          {!executedAt && <FormInfo label="Expires" value={endOfTime} />}
          {executedAt && <FormInfo label="Executed at" value={executedAt} />}
        </div>

        {txnType === "send" && (
          <div
            className="text-decoration-underline"
            style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
            role="button"
            onClick={() =>
              setModalLogicSignature({
                status: true,
                title: "Logic Signature",
              })
            }
          >
            Show Logic Signature
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
  );
};

export default SendDetail;
