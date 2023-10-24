import styles from "./RenameLedgerModal.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import { useState, useEffect } from "react";
import { getExplorerURL } from "shared/utils";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import useSidebar from "frontend/hooks/useSidebar";
import { useWallet } from "@txnlab/use-wallet";
import Loader from "frontend/components/Icons/Loader";
import AddressGroup from "frontend/components/UI/AddressGroup";
import { useAppDispatch } from "frontend/redux/hooks";
import { setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import Router from "next/router";
import { sidebar } from "shared/constants";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onDataModal?: any;
}

const iconDone = "/images/safe/icon-done.svg";
const iconFail = "/images/safe/icon-fail.svg";

const RenameLedgerModal: React.FC<Props> = ({ modalStatus, onHide, onDataModal }: Props) => {
  const dispatch = useAppDispatch();
  const [inputName, setInputName] = useState("");
  const { activeAccount } = useWallet();
  const { renameLedger, sidebarAccounts } = useSidebar();
  const [alertMsg, setAlertMsg] = useState(false);
  const [status, setStatus] = useState(0);
  const [title, setTitle] = useState("Rename Ledger Account");
  const initRename = async () => {
    const isNameExist = sidebarAccounts.some((account: any) => account.name === inputName);

    if (isNameExist) {
      setAlertMsg(true);

      return;
    } else {
      setAlertMsg(false);
    }

    setStatus(1);

    try {
      if (activeAccount) {
        await renameLedger(sidebarAccounts, onDataModal.address, inputName, activeAccount.address);
      } else {
        await renameLedger(sidebarAccounts, onDataModal.address, inputName);
      }
    } catch (err: any) {
      setStatus(3);
      return;
    }
    setStatus(2);
  };

  useEffect(() => {
    setInputName(onDataModal.name || "");
  }, [onDataModal]);

  const closeModal = () => {
    onHide();
    setStatus(0);
  };

  const goToDashboard = () => {
    const newAccount = {
      address: onDataModal.address,
      ledgerAddress: onDataModal.ledgerAddress,
      name: inputName,
    };

    dispatch(setSelectedAccount(newAccount));
    localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(newAccount));
    Router.push("/dashboard");
    closeModal();
  };

  useEffect(() => {
    switch (status) {
      case 0:
      case 1:
        setTitle("Rename Acc");
        break;
      case 2:
        setTitle("Successful Renaming of Account");
        break;
      case 3:
        setTitle("Failed to Rename Acc");
        break;
      default:
        setTitle("Rename Acc");
        break;
    }
  }, [status]);

  return (
    <ModalGeneral title={title} onHide={closeModal} modalStatus={modalStatus}>
      {status === 0 && (
        <div className={styles["rename-popup"]}>
          <div className={styles["content-top"]}>
            <div className={`${styles["ledger-content"]} w-100`}>
              <div className="d-flex justify-content-between align-items-center w-100">
                <b>Account Name</b>
              </div>
              <div className="d-flex flex-column w-100">
                <div className={styles.inputName}>
                  <input
                    type="text"
                    className={`form-controls ${styles.pInput} ${alertMsg ? styles.textWarn : "text-black"}`}
                    placeholder="Enter New Ledger Name"
                    maxLength={32}
                    onChange={(evt) => setInputName(evt.target.value)}
                    value={inputName}
                  />
                  <div className={styles.textCount}>{`${inputName?.length}/32`}</div>
                </div>
                {alertMsg && <div className={`${styles.boxWarn}`}>This name is already in use</div>}
              </div>
            </div>
            <div className={styles["ledger-content"]}>
              <div className="d-flex justify-content-between align-items-center w-100">
                <b>Address</b>
                <div className="d-flex gap-1 align-items-center">
                  <IconCopy copy={onDataModal.address || ""} />
                  <IconLink link={`${getExplorerURL()}/address/${onDataModal.address || ""}`} />
                </div>
              </div>
              <div className="w-100" style={{ wordBreak: "break-all", textAlign: "start" }}>
                {onDataModal.address}
              </div>
            </div>
            {onDataModal.appId && (
              <div className={`${styles["ledger-content"]} w-100`}>
                <div className="d-flex justify-content-between align-items-center w-100">
                  <b>Safe ID</b>
                  <div className="d-flex gap-1 align-items-center">
                    <IconCopy copy={onDataModal.appId || ""} />
                    <IconLink link={`${getExplorerURL()}/application/${onDataModal.appId || ""}`} />
                  </div>
                </div>
                <div className="w-100" style={{ wordBreak: "break-all", textAlign: "start" }}>
                  {onDataModal.appId}
                </div>
              </div>
            )}
          </div>
          <div className={styles["text-info"]}>
            You are about to rename an account. Account name will only be reflected on your dashboard.
          </div>

          <div className={styles["content-bottom"]}>
            <div className={styles["btn-wrapper"]}>
              <Button cancel onClick={closeModal} className={styles["btn-cancel"]}>
                CANCEL
              </Button>
              <Button onClick={initRename} primary className={styles["btn-save"]}>
                SAVE
              </Button>
            </div>
          </div>
        </div>
      )}
      {status === 1 && (
        <div className={styles["rename-popup"]}>
          <div className={`${styles["content-top"]} ${styles.borderNone} p-0`}>
            <div className={`${styles.wrapLoader}`}>
              <Loader />
            </div>
            <b className={`${styles.textLoader}`}>Renaming Account</b>
          </div>
        </div>
      )}
      {status >= 2 && (
        <div className={styles["rename-popup"]}>
          <div className={`${styles["content-top"]} ${styles.borderNone} gap-2`}>
            <img src={status == 2 ? iconDone : iconFail} className={styles.iconModal} alt="" />
            {status == 2 ? (
              <span>You have successfully renamed this account to:</span>
            ) : (
              <span>Unable to remove this Ledger account from your side panel.</span>
            )}
            <div className={`${styles["ledger-content"]} gap-1`}>
              <b>{status == 2 ? inputName : onDataModal.name}</b>
              <div className="d-flex gap-1" style={{ alignItems: "baseline" }}>
                <b>Address -&nbsp;</b>
                <AddressGroup
                  address={onDataModal.address || ""}
                  linkAddress={`${getExplorerURL()}/address/${onDataModal.address || ""}`}
                  isTruncate
                  noQRCode
                />
              </div>
              {onDataModal.appId && (
                <div className="d-flex gap-1" style={{ alignItems: "baseline" }}>
                  <b>Safe ID -&nbsp;</b>
                  <AddressGroup
                    address={onDataModal.appId || ""}
                    linkAddress={`${getExplorerURL()}/application/${onDataModal.appId || ""}`}
                    isTruncate
                    noQRCode
                  />
                </div>
              )}
            </div>
          </div>
          <div className={styles["content-bottom"]}>
            {status === 2 ? (
              <div className={styles["btn-wrapper"]}>
                <Button
                  onClick={() => {
                    goToDashboard();
                  }}
                  primary
                  className={`w-100`}
                >
                  GO TO DASHBOARD
                </Button>
              </div>
            ) : (
              <div className={styles["btn-wrapper"]}>
                <Button cancel onClick={closeModal} className={styles["btn-cancel"]}>
                  CANCEL
                </Button>
                <Button onClick={initRename} primary className={styles["btn-save"]}>
                  RETRY
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalGeneral>
  );
};

export default RenameLedgerModal;
