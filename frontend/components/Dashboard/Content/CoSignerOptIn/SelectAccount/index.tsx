import React, { useState } from "react";
import styles from "./CoSignerOptIn.module.scss";
import SelectWalletDropdown from "frontend/components/UI/Safe/SelectWalletDropdown";
import Button from "frontend/components/Button";
import SafeService from "frontend/services/safe";
import ModalNotification from "../ModalNotification";
import { Safe, SidebarAccount } from "shared/interfaces";
import useSidebar from "frontend/hooks/useSidebar";
import { useRouter } from "next/router";
import { useAppDispatch } from "frontend/redux/hooks";
import { setSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { SELECTED_SAFE } from "shared/constants";
import { useWallet } from "@txnlab/use-wallet";

interface PageProps {
  onChangeComponent: (component: string) => void;
  setSafe: React.Dispatch<React.SetStateAction<Safe | null>>;
  safe: Safe | null;
  setSelectedAccount: React.Dispatch<
    React.SetStateAction<{
      address: string;
      name: string;
      providerId: string;
    }>
  >;
  selectedAccount: any;
  isOnExistingSafe?: boolean;
}

const CoSignerOptInSelectAccount = (props: PageProps) => {
  const { onChangeComponent, setSafe, safe, setSelectedAccount, selectedAccount, isOnExistingSafe = false } = props;
  const [safeId, setSafeId] = useState("");
  const [showModalNotification, setShowModalNotification] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [modalText, setModalText] = useState({ title: "", description: "" });
  const { sidebarAccounts, saveList, setSidebarAccount } = useSidebar();
  const router = useRouter();
  const ss = new SafeService();
  const dispatch = useAppDispatch();
  const { activeAccount } = useWallet();

  async function saveSafe() {
    setIsConfirmation(false);
    setShowModalNotification(false);
    const safeObj = { name: safe?.name, address: safe?.address, appId: safe?.appId };
    const accounts = [...sidebarAccounts, safeObj];
    if (activeAccount) {
      await saveList(accounts as SidebarAccount[], selectedAccount.address);
    } else {
      await saveList(accounts as SidebarAccount[]);
    }
    dispatch(setSelectedSafe(safe));
    localStorage.setItem(SELECTED_SAFE, JSON.stringify(safe));
    setSidebarAccount(safeObj as any);
    router.push("/dashboard");
  }

  async function confirm() {
    try {
      const selectedSafe = await ss.getSafe(Number(safeId));
      setSafe(selectedSafe);
      if (!selectedSafe.initialized) {
        setModalText({
          title: "Safe Not Initialized",
          description: "The safe hasn't been initialized. Please check the safe ID and try again.",
        });
        setShowModalNotification(true);
        return;
      }

      try {
        const verifiedSafe = await ss.verifySafeOwnership(selectedSafe, selectedAccount.address);
        if (verifiedSafe.status === "owner") {
          const safeOnSidebar = sidebarAccounts.find((account: any) => account.address === selectedSafe.address);
          if (safeOnSidebar) {
            dispatch(setSelectedSafe(verifiedSafe));
            localStorage.setItem(SELECTED_SAFE, JSON.stringify(verifiedSafe));
            setSidebarAccount(safeOnSidebar);
            router.push("/dashboard");
          } else {
            setModalText({
              title: "Opted-in to the Safe",
              description: "You have successfully opted-in to the Safe. Would you like to manage this Safe now?",
            });
            setIsConfirmation(true);
            setShowModalNotification(true);
          }
        } else if (verifiedSafe.status === "optin") {
          onChangeComponent("details");
        } else {
          setModalText({
            title: "Not Co-Signer",
            description: "You are not the co-signer of this Safe. Please check your selected account or Safe ID.",
          });
          setShowModalNotification(true);
          setIsConfirmation(false);
        }
      } catch (e) {
        setModalText({
          title: "Not Co-Signer",
          description: "You are not the co-signer of this Safe. Please check your selected account or Safe ID.",
        });
        setShowModalNotification(true);
        setIsConfirmation(false);
      }
    } catch (e) {
      setModalText({
        title: "Safe Doesn’t Exist",
        description: "The Safe ID you have entered doesn’t exist. Please check the Safe ID and try again.",
      });
      setShowModalNotification(true);
      setIsConfirmation(false);
    }
  }

  return (
    <>
      <ModalNotification
        modalStatus={showModalNotification}
        title={modalText.title}
        message={modalText.description}
        safeId={Number(safeId)}
        onHide={() => setShowModalNotification(false)}
        isConfirmation={isConfirmation}
        onConfirm={() => saveSafe()}
      />
      <div className={styles["container"]}>
        {isOnExistingSafe ? (
          <div className={`box-safe ${styles["wrapper"]}`}>
            <div className={styles["titleField"]}>
              <p>
                Can’t find your Safe? You may not have opted-in to your Safe yet. Enter your Safe ID to opt-in and add your Safe.
              </p>
              <div className={styles["inputSafeId"]}>
                <input
                  value={safeId}
                  onChange={(e) => setSafeId(e.target.value)}
                  type="text"
                  className={styles["inputText"]}
                  placeholder="Enter Safe ID"
                />
                <div className={`divider ${styles["mlDivider"]}`}></div>
                <Button
                  disabled={safeId === "" || !activeAccount}
                  primary
                  onClick={async () => {
                    await confirm();
                  }}
                  className={styles["btnConfirm"]}
                >
                  <p>CONFIRM</p>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`box-safe ${styles["wrapper"]}`}>
            <div className={styles["titleField"]}>
              <p className={styles["textBold"]}>Select Account</p>
              <SelectWalletDropdown onChangeAccount={setSelectedAccount} />
            </div>
            <div className={styles["titleField"]}>
              <p className={styles["textBold"]}>Safe ID</p>
              <div className={styles["inputSafeId"]}>
                <input
                  value={safeId}
                  onChange={(e) => setSafeId(e.target.value)}
                  type="text"
                  className={styles["inputText"]}
                  placeholder="Enter Safe ID"
                />
                <div className={`divider ${styles["mlDivider"]}`}></div>
                <Button
                  disabled={safeId === "" || !selectedAccount}
                  primary
                  onClick={async () => {
                    await confirm();
                  }}
                  className={styles["btnConfirm"]}
                >
                  <p>CONFIRM</p>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoSignerOptInSelectAccount;
