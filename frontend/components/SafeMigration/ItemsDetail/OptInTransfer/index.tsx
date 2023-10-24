import styles from "./OptInTransfer.module.scss";
import Alert from "frontend/components/UI/Alert";
import TableAssetTransfer from "frontend/components/SafeMigration/ItemsDetail/TableAssetTransfer";
import { useAppSelector } from "frontend/redux/hooks";
import { getstepProgressMigration } from "frontend/redux/features/migration/migrationSlice";

interface Props {
  data: any;
  fetchMigration?: () => void;
}

const OptInTransfer: React.FC<Props> = ({ data, fetchMigration }: Props) => {
  const stepProgress = useAppSelector<any>(getstepProgressMigration);

  return (
    <>
      {data?.overallAssetList?.length > 0 ? (
        <div className={`${styles["opt-transfer-container"]}`}>
          <div className={`${styles["box-text-content"]}`}>
            {stepProgress === 2 ? (
              <span>
                Below shows the breakdown of your assets. You are required to opt-in to the same assets for your new safe, and
                then transfer them from the old safe to the new safe.
              </span>
            ) : (
              <span>Below are the breakdown of assets you have in your safe.</span>
            )}
          </div>
          <Alert
            isUrgen
            isFontSizeMedium
            message="NOTE: All asset opt-ins and transfers have to be initialised by main signer and then approved by co-signers."
          />
          <TableAssetTransfer assets={data?.overallAssetList} fetchMigration={fetchMigration} />
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default OptInTransfer;
