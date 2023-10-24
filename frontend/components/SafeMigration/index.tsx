import { useEffect, useState } from "react";
import styles from "./safeMigration.module.scss";
import BoxStep from "frontend/components/UI/Box/BoxStep";
import CreateNewSafe from "frontend/components/SafeMigration/ItemsDetail/CreateNewSafe";
import ModalBugInfo from "frontend/components/SafeMigration/ItemsDetail/CreateNewSafe/ModalBugInfo";
import OptInTransfer from "frontend/components/SafeMigration/ItemsDetail/OptInTransfer";
import AlgoTranfer from "frontend/components/SafeMigration/ItemsDetail/AlgoTransfer";
import ModalUrgentPtxn from "frontend/components/SafeMigration/ModalUrgentPtxn";
import SafeService from "frontend/services/safe";
import ModalMigration from "frontend/components/SafeMigration/ModalMigrate";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import {
  getIsOwner,
  getIsAssetListEmpty,
  getIsMigrationActive,
  getMigrationActiveData,
  getstepProgressMigration,
  setIsOwner,
  setIsAssetListEmpty,
  setIsMigrationActive,
  setMigrationActiveData,
  setstepProgressMigration,
} from "frontend/redux/features/migration/migrationSlice";
import { setNewSafeData } from "frontend/redux/features/safe/safeSlice";
import { useRouter } from "next/router";
import { statuses } from "shared/constants";
import Loader from "frontend/components/UI/Loader";
import useCompleteSafeMigration from "frontend/hooks/useCompleteSafeMigration";
import { useWallet } from "@txnlab/use-wallet";

const ss = new SafeService();

export default function SafeMigration() {
  const Router = useRouter();
  const dispatch = useAppDispatch();
  const isOwner = useAppSelector<any>(getIsOwner);
  const selectedAddress = useWallet().getAddress() as string;
  const isAssetListEmpty = useAppSelector<any>(getIsAssetListEmpty);
  const stepProgress = useAppSelector<any>(getstepProgressMigration);
  const isMigrationActive = useAppSelector<any>(getIsMigrationActive);
  const migrationActiveData = useAppSelector<any>(getMigrationActiveData);

  const [loader, setLoader] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [modalStatus, setModalStatus] = useState(false);
  const [modalMigration, setModalMigration] = useState(false);
  const [isMigrationComplete, setIsMigrationComplete] = useState(false);

  const [newSafe, setNewSafe] = useState<any>({});
  const [summaryData, setSummaryData] = useState<any>({});
  const [optInTransferData, setOptInTransferData] = useState<any>({});
  const [AlgoTransferData, setAlgoTransferData] = useState<any>({});
  const [reimbursedAmount, setReimbursedAmount] = useState<any>({});

  const [urgentType, setUrgentType] = useState<any>({});
  const [urgentRequest, setUrgentRequest] = useState<any>(null);
  const [urgentPayload, setUrgentPayload] = useState<any>({});

  const handleCompleteSafeMigration = useCompleteSafeMigration();

  const typesList: any = {
    "asset-optin": "new-asset",
    "asset-transfer": "send",
    "close-asset": "send",
    pay: "send",
    appl: "dapp",
    "app-call": "dapp",
  };

  useEffect(() => {
    Router.push("/dashboard/add-accounts");
    // fetchMigration();
  }, [isMigrationActive]);

  const fetchMigration = async () => {
    setLoader(true);
    const safeFromLC: any = localStorage.getItem("SelectedSafe");
    const selectedSafe = JSON.parse(safeFromLC);
    const currentID = selectedSafe?.appId;
    const selectedID = Number(process.env.NEXT_PUBLIC_SAFE_MIGRATE_CHECK);

    //determine new aafe & the owner
    const isNewID = currentID > selectedID;
    const isTheOwner = selectedSafe?.owners[0]?.addr === selectedAddress;

    //direct user to the dashboard if the user using new safe ID
    if (isNewID) {
      Router.push("/dashboard");
    }

    //set the owner status
    if (isTheOwner) {
      dispatch(setIsOwner(true));
    }

    if (!selectedSafe) {
      setModalMigration(true);
      setLoader(false);
    } else {
      //check migration data
      try {
        const activeMigration = await ss.getSafeMigrationViaSafeId(selectedSafe.appId);
        dispatch(setMigrationActiveData(activeMigration));
        dispatch(setIsMigrationActive(true));

        //set optin to co-owner
        if (stepProgress < 2 && !isTheOwner) {
          const safe = await ss.getSafe(activeMigration?.data?.to_safe);
          dispatch(setNewSafeData(safe));
        }
      } catch (error) {
        setLoader(false);
        dispatch(setIsMigrationActive(false));
        dispatch(setstepProgressMigration(1));

        //set create migration for the main owner
        if (isTheOwner) {
          const safe = await ss.getSafe(selectedSafe.appId);
          dispatch(setNewSafeData(safe));
        }
      }

      const migrationCompleted = async () => {
        // old and new safe should have the same number of owners and threshold
        const newSafe = await ss.getSafe(migrationActiveData?.data?.to_safe);
        const reimbursedData = ss.getReimbursedAmount(
          newSafe.threshold,
          migrationActiveData?.data?.assets_to_transfer,
          newSafe.num_owners
        );
        setNewSafe(newSafe);
        setReimbursedAmount(reimbursedData);
        setIsMigrationComplete(true);
        setModalMigration(true);
        setLoader(false);
      };

      //condition when migration completed
      if (migrationActiveData?.data?.migrate_status === "completed") {
        migrationCompleted();
      }

      //condition when migration active
      if (migrationActiveData?.data?.migrate_status === "active") {
        const thisSafe = await ss.getSafe(migrationActiveData?.data?.from_safe);
        const newSafe = await ss.getSafe(migrationActiveData?.data?.to_safe);
        const verifySafeOwner = await ss.verifySafeOwnership(newSafe, selectedAddress);
        setSummaryData(newSafe);

        if (verifySafeOwner?.status === statuses.REQUIRE_OPTIN) {
          dispatch(setstepProgressMigration(1));
        } else if (verifySafeOwner?.status === statuses.OWNER) {
          dispatch(setstepProgressMigration(2));

          //handle stepProgress > 1
          const safeMigrationAssets = await ss.getSafeMigrationAssetTransferStatus(thisSafe, newSafe, selectedAddress);
          setOptInTransferData(safeMigrationAssets);

          //check is the step should proceed to the next step
          if (safeMigrationAssets.assetMigrationCompleted) {
            dispatch(setstepProgressMigration(3));
            const safeMigrationAlgo = await ss.getSafeMigrationAlgoTransferStatus(
              migrationActiveData?.data?.id,
              thisSafe,
              newSafe,
              selectedAddress
            );
            setAlgoTransferData(safeMigrationAlgo);

            if (safeMigrationAlgo.algoMigrationCompleted) {
              const migrationID = migrationActiveData?.data?.id;
              const oldSafe = await ss.getSafe(migrationActiveData?.data?.from_safe);
              const isComplete = await handleCompleteSafeMigration(oldSafe.appId, migrationID, selectedAddress);
              if (isComplete) migrationCompleted();
            }
          }

          //check is Assets List empty (for the UI purpose)
          if (safeMigrationAssets.overallAssetList?.length == 0) {
            dispatch(setIsAssetListEmpty(true));
          }
        } else {
          Router.push("/dashboard");
        }

        /** Start for set urgent ptxn */
        const appGS1 = await ss.getSafeGlobalState(thisSafe.appId);
        const appGS2 = await ss.getSafeGlobalState(newSafe.appId);
        const getOldUrgentRequestPtxn = await ss.getUrgentPtxn(thisSafe, appGS1);
        const getNewUrgentRequestPtxn = await ss.getUrgentPtxn(newSafe, appGS2);

        const urgentPtxns = [];

        //modal condition
        if (getNewUrgentRequestPtxn || getOldUrgentRequestPtxn) {
          setModalShow(true);
        } else {
          setModalShow(false);
        }

        //setUrgentPtxnToArray
        if (getOldUrgentRequestPtxn) {
          const oldUrgetPtxn = { ...getOldUrgentRequestPtxn, safeId: thisSafe.appId, safeThreshold: thisSafe.threshold };
          urgentPtxns.push(oldUrgetPtxn);
        }
        if (getNewUrgentRequestPtxn) {
          const newUrgetPtxn = { ...getNewUrgentRequestPtxn, safeId: newSafe.appId, safeThreshold: newSafe.threshold };
          urgentPtxns.push(newUrgetPtxn);
        }

        if (urgentPtxns.length > 0) {
          setUrgentRequest(urgentPtxns);
          if (getNewUrgentRequestPtxn) {
            setModalShow(true);
            const type = getNewUrgentRequestPtxn.parsedPayload[0].payloadType || "";
            setUrgentType(typesList[type]);
            setUrgentPayload(getNewUrgentRequestPtxn.parsedPayload[0]);
          }
          if (getOldUrgentRequestPtxn) {
            setModalShow(true);
            const type = getOldUrgentRequestPtxn.parsedPayload[0].payloadType || "";
            setUrgentType(typesList[type]);
            setUrgentPayload(getOldUrgentRequestPtxn.parsedPayload[0]);
          }
        }
        /** End for set urgent ptxn */
        setLoader(false);
      }
    }
  };

  return (
    <>
      <ModalMigration
        reimbursedAmount={reimbursedAmount}
        modalStatus={modalMigration}
        isModalDirectLink={!isMigrationComplete}
        isMigrationComplete={isMigrationComplete}
        newSafe={newSafe}
      />
      <ModalUrgentPtxn
        modalStatus={modalShow}
        urgentType={urgentType}
        urgentPayload={urgentPayload}
        urgentRequest={urgentRequest}
        fetchMigration={fetchMigration}
        onHide={() => setModalShow(false)}
      />
      <ModalBugInfo modalStatus={modalStatus} onHide={() => setModalStatus(false)} />
      <div className={styles["migration-content"]}>
        <div className={styles.notice}>
          Fees incurred during this migration process will be reimbursed to your new safe account shortly after this migration is
          complete.
        </div>
        {loader ? (
          <Loader />
        ) : (
          <>
            <BoxStep
              isActive={stepProgress > 0}
              numberHeader={1}
              titleHeader={!isOwner ? "OPT-IN TO NEW SAFE" : "NEW SAFE CREATION"}
              titleInfo="ALGO SAFE V1.1"
              isDone={stepProgress > 1}
              onTitleInfo={() => setModalStatus(true)}
            >
              <CreateNewSafe summaryData={summaryData} fetchMigration={fetchMigration} />
            </BoxStep>
            <BoxStep
              isActive={stepProgress > 1}
              numberHeader={2}
              titleHeader="OPT-IN & TRANSFER ASSETS"
              isDone={stepProgress > 2}
              isContentEmpty={isAssetListEmpty}
            >
              <OptInTransfer data={optInTransferData} fetchMigration={fetchMigration} />
            </BoxStep>
            <BoxStep isActive={stepProgress === 3} numberHeader={3} titleHeader="ALGO TRANSFER">
              <AlgoTranfer data={AlgoTransferData} fetchMigration={fetchMigration} />
            </BoxStep>
          </>
        )}
      </div>
    </>
  );
}
