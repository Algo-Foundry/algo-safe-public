import SafeService from "frontend/services/safe";
import { useCallback } from "react";
// import useSafeAuth from "frontend/hooks/useSafeAuth";

const useReimbursedSafeMigration = () => {
  const ss = new SafeService();
  // const { authenticateSigner } = useSafeAuth();

  const handleReimbursedSafeMigration = useCallback(async (safeId: number, migrationID: number, selectedAddress: string) => {
    // await authenticateSigner(safeId);

    // call api to mark safe migration as complete
    await ss.reimbursedSafeMigration(safeId, migrationID, selectedAddress);

    return true;
  }, []);

  return handleReimbursedSafeMigration;
};

export default useReimbursedSafeMigration;
