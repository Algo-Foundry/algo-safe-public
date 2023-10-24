import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { setNewSafeData, getNewSafeData, getAlertNameValidation } from "frontend/redux/features/safe/safeSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import styles from "./create-safe.module.scss";
import Layout from "frontend/components/Layouts";
import SafeName from "frontend/components/UI/Safe/SafeName";
import OwnerConfirmation from "frontend/components/UI/Safe/OwnerConfirmation";
import Review from "frontend/components/UI/Safe/Review";
import WalletModal from "frontend/components/Wallet/WalletModal";
import { useWallet } from "@txnlab/use-wallet";
import NewSafe from "shared/interfaces/NewSafe";

const CreateSafe: NextPage = () => {
  const alertNameSafe = useAppSelector(getAlertNameValidation);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [owners, setOwners] = useState<NewSafe["owners"]>([]);
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [td, setTd] = useState(1);
  const [modalWallet, setModalWallet] = useState(false);
  const { activeAddress } = useWallet();

  const newSafeData = useAppSelector(getNewSafeData);

  useEffect(() => {
    let hasError = false;
    owners.forEach((account) => {
      if ("errorName" in account || "errorAddress" in account || account.name == "" || account.addr == "" || name == "") {
        hasError = true;
      }
    });
    if (hasError || alertNameSafe) {
      setDisableConfirm(true);
    } else {
      setDisableConfirm(false);
    }
  }, [owners, name, alertNameSafe]);

  useEffect(() => {
    const creator = newSafeData.owners[0];
    if ((activeAddress && activeAddress !== creator?.addr) || activeAddress === undefined) {
      setStep(1);
      setDisableConfirm(true);
    }
  }, [activeAddress, newSafeData]);

  useEffect(() => {
    const updatedSafeData = {
      name: name,
      owners: owners,
      threshold: td,
    };
    dispatch(setNewSafeData(updatedSafeData));
  }, [name, owners, td, dispatch]);

  const addStep = async () => {
    let item = newSafeData;

    if (step == 1) {
      item = {
        name: name,
        owners: owners,
        threshold: td,
      };
    }

    dispatch(setNewSafeData(item));
    setStep(step + 1);
  };

  const backStep = () => {
    let item = newSafeData;

    item = {
      name: item.name,
      owners: owners,
      threshold: td,
    };

    dispatch(setNewSafeData(item));
    setStep(step - 1);
    if (step <= 1) {
      setStep(1);
      router.push({
        pathname: "/",
      });
    }
  };

  return (
    <>
      <WalletModal
        modalStatus={modalWallet}
        onHide={() => {
          setModalWallet(false);
        }}
      />
      <Layout pageTitle="Create Safe" layout="new-dashboard">
        <NewDashboardLayout contentClass={styles.paddingCreate} layoutLabel="Create New Safe" isBackgroundTransparent>
          <main className={`d-flex flex-column mx-auto ${styles.mainSafe}`}>
            <div className={styles.mainContent}>
              {step == 1 && (
                <div className={`d-flex flex-column mx-auto gap-3`}>
                  <SafeName onChange={setName} />
                  <OwnerConfirmation
                    onNext={addStep}
                    onBack={backStep}
                    onChangeOwner={setOwners}
                    onChangeTd={setTd}
                    disableConfirm={disableConfirm}
                  />
                </div>
              )}
              {step == 2 && <Review type="new" onNext={addStep} onBack={backStep} />}
            </div>
          </main>
        </NewDashboardLayout>
      </Layout>
    </>
  );
};

export default CreateSafe;
