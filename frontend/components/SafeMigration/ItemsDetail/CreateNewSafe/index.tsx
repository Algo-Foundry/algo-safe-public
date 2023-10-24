import ReviewDetail from "frontend/components/UI/Safe/Review/ReviewDetail";
import SummaryDetail from "frontend/components/SafeMigration/ItemsDetail/CreateNewSafe/SummaryDetail";
import { useAppSelector } from "frontend/redux/hooks";
import { getstepProgressMigration, getIsOwner, getIsMigrationActive } from "frontend/redux/features/migration/migrationSlice";
import { getOptSafe } from "frontend/redux/features/safe/safeSlice";
import Alert from "frontend/components/UI/Alert";
import BorderDivider from "frontend/components/UI/BorderDivider";
import ModalConfirm from "frontend/components/UI/Safe/ModalSafe/ModalConfirm";

interface Props {
  summaryData: any;
  fetchMigration?: () => void;
}

const CreateNewSafe: React.FC<Props> = ({ summaryData, fetchMigration }: Props) => {
  const stepProgressMigration = useAppSelector<any>(getstepProgressMigration);
  const isMigrationActive = useAppSelector<any>(getIsMigrationActive);
  const isOwner = useAppSelector<any>(getIsOwner);
  const optSafe = useAppSelector<any>(getOptSafe);

  return (
    <>
      <ModalConfirm title="Opt in Safe" modalStatus={optSafe} disabledStep />
      {stepProgressMigration === 1 ? (
        !isMigrationActive && !isOwner ? (
          <div>
            <BorderDivider className="mb-3" />
            <Alert message={"Please inform the main signer to start the migration process."} isUrgen isFontSizeMedium />
          </div>
        ) : (
          <ReviewDetail type={isOwner ? "new" : "load"} fetchMigration={fetchMigration} />
        )
      ) : (
        <SummaryDetail data={summaryData} />
      )}
    </>
  );
};

export default CreateNewSafe;
