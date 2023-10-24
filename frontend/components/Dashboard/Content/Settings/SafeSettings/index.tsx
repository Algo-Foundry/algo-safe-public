import React, { useEffect, useState } from "react";
import SafeSigners from "./SafeSigners";
// import SafePolicies from "./SafePolicies";
import DeleteSafe from "./DeleteSafe";
import SafeDetails from "./SafeDetails";
import SafeService from "frontend/services/safe";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";

const SafeSettings = () => {
  const [showDelete, setShowDelete] = useState(true);
  const selectedSafe: any = useAppSelector(getSelectedSafe);
  const ss = new SafeService();
  const checkDeleteSafePtxn = async () => {
    const appGS = await ss.getSafeGlobalState(selectedSafe.appId);
    if (appGS.get("d") !== undefined) {
      setShowDelete(false);
    }
  };

  useEffect(() => {
    checkDeleteSafePtxn();
  }, []);

  return (
    <div>
      <SafeDetails />
      <SafeSigners />
      {/* <SafePolicies /> */}
      <DeleteSafe showDelete={showDelete} />
    </div>
  );
};

export default SafeSettings;
