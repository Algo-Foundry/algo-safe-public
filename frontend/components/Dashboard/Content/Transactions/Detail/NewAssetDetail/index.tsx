import styles from "./NewAssetDetail.module.scss";
import Image from "next/image";
import TransactionStatus from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus";
import BorderDivider from "frontend/components/UI/BorderDivider";
import BoxRegular from "frontend/components/UI/Box/BoxRegular";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import { getExplorerURL } from "shared/utils";
import ModalLogicSignature from "frontend/components/Dashboard/Content/Transactions/ModalLogicSignature";
import moment from "moment";
import Alert from "frontend/components/UI/Alert";
import { useState } from "react";

interface Props {
  dataDetail: any;
  onConfirm?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onDelete?: () => void;
  isUrgent?: boolean;
  isButtonHidden?: boolean;
}

const NewAssetDetail: React.FC<Props> = ({
  dataDetail,
  onConfirm,
  onReject,
  onExecute,
  onDelete,
  isUrgent,
  isButtonHidden,
}: Props) => {
  // const [modalLogicSignatureShow, setModalLogicSignatureShow] = useState(false);
  const [modalLogicSignature, setModalLogicSignature] = useState({
    status: false,
    title: "",
  });
  const endOfTime = moment(dataDetail.expiry).format("MMM D, YYYY - h:mm:ss A");

  return (
    <div className={styles["new-asset-detail"]}>
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
        <BoxRegular className={`${styles.box} ${isUrgent && "bg-white"}`}>
          <span>You added new asset to the safe :</span>
          <span className="d-flex gap-1 align-items-center">
            <b>
              {dataDetail.parsedPayload[0]?.payloadAssetName} ({dataDetail.parsedPayload[0]?.payloadAssetID})
            </b>
            <a
              href={`${getExplorerURL()}/asset/${dataDetail.parsedPayload[0]?.payloadAssetID}`}
              className={`${styles["box-icon-sm"]}`}
              target="_blank"
              rel="noreferrer"
            >
              <Image
                alt="Icon External Link"
                src="/images/safe/icon-external-link.svg"
                layout="fill"
                objectFit="cover"
                quality={100}
              />
            </a>
          </span>
        </BoxRegular>
        <div className={styles["new-asset-info"]}>
          <FormInfo label="Transaction hash" value={dataDetail.txnId} isValueAddress isTxn />
          <FormInfo label="Expires" value={endOfTime} />
        </div>
        <div
          className="text-decoration-underline"
          style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
          role="button"
          // onClick={() => setModalLogicSignatureShow(true)}
        >
          Show Logic Signature
        </div>
        {!isUrgent && !isButtonHidden && dataDetail.status !== "Expired" && (
          <div className="mt-auto">
            <Alert
              message={
                "Make sure the safe has sufficient balance before executing this transaction (+0.1 ALGO for each asset type added)."
              }
              isWarning
            />
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

export default NewAssetDetail;
