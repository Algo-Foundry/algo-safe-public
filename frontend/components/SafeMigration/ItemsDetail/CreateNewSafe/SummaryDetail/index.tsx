import styles from "./SummaryDetail.module.scss";
import SafeIdGroup from "frontend/components/UI/SafeIdGroup";
import AddressGroup from "frontend/components/UI/AddressGroup";
import BorderDivider from "frontend/components/UI/BorderDivider";
import { getExplorerURL } from "shared/utils";

interface Props {
  data: any;
}

const CreateNewSafe: React.FC<Props> = ({ data }: Props) => {
  return (
    <div className={styles["summary-details"]}>
      <BorderDivider className="mb-1" />
      <div className={styles["text-group"]}>
        <div className={styles["text-label"]}>Name of the Safe:</div>
        <div className={styles["text-content"]}>{data?.name}</div>
      </div>
      <div className={styles["text-group"]}>
        <div className={styles["text-label"]}>New Safe ID:</div>
        <div className={styles["text-content"]}>
          <SafeIdGroup safeId={data?.appId} isHash isBold />
        </div>
      </div>
      <div className={styles["text-group"]}>
        <div className={styles["text-label"]}>New Safe Address:</div>
        <div className={styles["text-content"]}>
          <AddressGroup
            address={data?.address || ""}
            className={styles.address}
            linkAddress={`${getExplorerURL()}/address/${data?.address || ""}`}
            isRow
            isResponsive
            isNoMb
            noQRCode
            noCopyButton
          />
        </div>
      </div>
      <div className={styles["text-group"]}>
        <div className={styles["text-label"]}>Number of Signer:</div>
        <div className={styles["text-content"]}>{data?.num_owners} Safe Signers</div>
      </div>
      <div className={styles["text-group"]}>
        <div className={styles["text-label"]}>Any transaction requires the confirmation of:</div>
        <div className={styles["text-content"]}>
          {data?.threshold} out of {data?.num_owners} Signers
        </div>
      </div>
    </div>
  );
};

export default CreateNewSafe;
