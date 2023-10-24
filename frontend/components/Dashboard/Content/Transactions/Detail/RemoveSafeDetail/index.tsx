import styles from "./RemoveSafeDetail.module.scss";
import TransactionStatus from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus";
import AddressGroup from "frontend/components/UI/AddressGroup";
import BorderDivider from "frontend/components/UI/BorderDivider";
import BoxRegular from "frontend/components/UI/Box/BoxRegular";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import Alert from "frontend/components/UI/Alert";
import { getExplorerURL } from "shared/utils";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";

interface Props {
  dataDetail: any;
  onConfirm?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onDelete?: () => void;
}

const RemoveSafeDetail: React.FC<Props> = ({ dataDetail, onConfirm, onReject, onExecute, onDelete }: Props) => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);

  return (
    <div className={styles["send-detail"]}>
      <div className={styles["detail-left"]}>
        <BoxRegular className="bg-white">
          <span>You are about to remove this safe:</span>
          <b>
            <AddressGroup
              address={selectedSafe.address}
              linkAddress={`${getExplorerURL()}/address/${selectedSafe?.address}`}
              noQRCode
              isTruncate
              noCopyButton
            />
          </b>
        </BoxRegular>
        <div className={styles["send-info"]}>
          <FormInfo label="Initiator" value={dataDetail.initiator} isValueAddress isWidthMinimum />
        </div>
        <div className="mt-auto">
          <Alert
            message={"Once this transaction is confirmed, this Safe and its balances will be removed permanently."}
            isWarning
          />
        </div>
      </div>

      <BorderDivider isResponsive isRed />

      <div className={styles["detail-right"]}>
        <TransactionStatus
          data={dataDetail}
          onConfirm={onConfirm}
          onReject={onReject}
          onDelete={onDelete}
          onExecute={onExecute}
        />
      </div>
    </div>
  );
};

export default RemoveSafeDetail;
