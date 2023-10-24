import styles from "./AlgoTransfer.module.scss";
import TableAssetTransfer from "frontend/components/SafeMigration/ItemsDetail/TableAssetTransfer";
import BorderDivider from "frontend/components/UI/BorderDivider";

interface Props {
  data: any;
  fetchMigration?: () => void;
}

const AlgoTransfer: React.FC<Props> = ({ data, fetchMigration }: Props) => {
  return (
    <>
      <BorderDivider />
      <div className={`${styles["algo-transfer-container"]}`}>
        <TableAssetTransfer assets={data.overallAlgoXfer} fetchMigration={fetchMigration} />
      </div>
    </>
  );
};

export default AlgoTransfer;
