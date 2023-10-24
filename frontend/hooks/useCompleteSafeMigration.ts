import SafeService from "frontend/services/safe";
import { useCallback } from "react";
// import useSafeAuth from "frontend/hooks/useSafeAuth";

const useCompleteSafeMigration = () => {
  const ss = new SafeService();
  // const { authenticateSigner } = useSafeAuth();

  const handleCompleteSafeMigration = useCallback(async (safeId: number, migrationID: number, selectedAddress: string) => {
    // await authenticateSigner(safeId);

    // call api to mark safe migration as complete
    await ss.completeSafeMigration(safeId, migrationID, selectedAddress);

    // send notification to discord
    await ss.sendSafeMigrationCompleteNotification(migrationID);

    return true;
  }, []);

  return handleCompleteSafeMigration;
};

export default useCompleteSafeMigration;
