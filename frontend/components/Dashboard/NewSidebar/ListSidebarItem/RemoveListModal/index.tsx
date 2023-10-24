import styles from "./RemoveListModal.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import AddressGroup from "frontend/components/UI/AddressGroup";
import Button from "frontend/components/Button";
import ListRemove from "frontend/components/Icons/ListRemove";
import { useState, useEffect } from "react";
import { getExplorerURL } from "shared/utils";
import useSidebar from "frontend/hooks/useSidebar";
import { useWallet } from "@txnlab/use-wallet";
import { useRouter } from "next/router";
import { useAppDispatch } from "frontend/redux/hooks";
import { setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { sidebar } from "shared/constants";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onDataModal?: any;
}

const iconDone = "/images/safe/icon-done.svg";
const iconFail = "/images/safe/icon-fail.svg";

const RemoveListModal: React.FC<Props> = ({ modalStatus, onHide, onDataModal }: Props) => {
  const [status, setStatus] = useState(0);
  const { activeAccount } = useWallet();
  const { removeItem, sidebarAccounts, selected } = useSidebar();
  const [title, setTitle] = useState("Remove From Side Panel");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const initRemove = async () => {
    try {
      if (activeAccount) {
        await removeItem(onDataModal.address, activeAccount.address);
      } else {
        await removeItem(onDataModal.address);
      }

      if (sidebarAccounts.length <= 1) {
        router.push("/dashboard/add-accounts");
      }
    } catch (err) {
      console.log("err", err);
      setStatus(3);
      return;
    }

    setStatus(2);
  };

  const closeModal = () => {
    if (selected?.address === onDataModal?.address) {
      dispatch(setSelectedAccount(sidebarAccounts[0]));
      localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(sidebarAccounts[0]));
    }
    onHide();
    setStatus(0);
  };

  useEffect(() => {
    switch (status) {
      case 0:
      case 1:
        setTitle("Remove Acc From Side Panel");
        break;
      case 2:
        setTitle("Successful Removal from Side Panel");
        break;
      case 3:
        setTitle("Failed to Remove from Side Panel");
        break;
      default:
        setTitle("Remove Acc From Side Panel");
        break;
    }
  }, [status]);

  return (
    <div style={{ zIndex: 1060 }}>
      <ModalGeneral title={title} onHide={closeModal} modalStatus={modalStatus}>
        {status === 0 && (
          <div className={styles["safe-remove-popup"]}>
            <div className={styles["content-top"]}>
              <div className={styles["box-icon"]}>
                <ListRemove />
              </div>
              <div className={styles["safe-address"]}>
                {onDataModal.appId ? (
                  <div className="d-flex gap-1" style={{ flexDirection: "column" }}>
                    <div>
                      <b>{onDataModal.name}</b>
                    </div>
                    <div className="d-flex gap-1 justify-content-center">
                      <b>Safe ID -</b>
                      <AddressGroup
                        address={`#${onDataModal.appId || ""}`}
                        linkAddress={`${getExplorerURL()}/application/${onDataModal.appId || ""}`}
                        isTruncate
                        noQRCode
                      />
                    </div>
                  </div>
                ) : (
                  <b>{onDataModal.name}</b>
                )}
                <div className="d-flex gap-1 justify-content-center">
                  <b>Safe Address -&nbsp;</b>
                  <AddressGroup
                    address={onDataModal.address || ""}
                    linkAddress={`${getExplorerURL()}/address/${onDataModal.address || ""}`}
                    isTruncate
                    noQRCode
                  />
                </div>
              </div>
              <span className={`${styles["text-info"]} ${styles.boxText}`}>
                You are about to remove this account from your side panel. You can add it back via &apos;Add Account&apos;.
              </span>
            </div>
            <div className={styles["content-bottom"]}>
              <div className={styles["btn-wrapper"]}>
                <Button cancel onClick={closeModal} className={styles["btn-cancel"]}>
                  CANCEL
                </Button>
                <Button onClick={initRemove} primary className={styles["btn-proceed"]} disabled={status !== 0}>
                  PROCEED
                </Button>
              </div>
            </div>
          </div>
        )}
        {status >= 2 && (
          <div className={styles["safe-remove-popup"]}>
            <div className={styles["content-top"]}>
              <img src={status == 2 ? iconDone : iconFail} className={styles.iconModal} alt="" />
              <span className={styles["text-info"]}>
                {status == 2
                  ? onDataModal.appId
                    ? "You have successfully removed this Safe from your side panel."
                    : "You have successfully removed this Ledger account from your side panel."
                  : onDataModal.appId
                  ? "Unable to remove this Safe from your side panel."
                  : "Unable to remove this Ledger account from your side panel."}
              </span>
              <div className={styles["safe-address"]}>
                <b>{onDataModal.name}</b>
                {onDataModal.appId && (
                  <div className="d-flex gap-1">
                    <b>Algo Safe -</b>
                    <span>#{onDataModal.appId || ""}</span>
                  </div>
                )}
                <div className="d-flex gap-1">
                  <b>Address :&nbsp;</b>
                  <AddressGroup
                    address={onDataModal.address || ""}
                    linkAddress={`${getExplorerURL()}/address/${onDataModal.address || ""}`}
                    isTruncate
                    noQRCode
                  />
                </div>
              </div>
            </div>
            <div className={styles["content-bottom"]}>
              {status === 2 ? (
                <div className={styles["btn-wrapper"]}>
                  <Button onClick={closeModal} primary className={`w-100`}>
                    DONE
                  </Button>
                </div>
              ) : (
                <div className={styles["btn-wrapper"]}>
                  <Button cancel onClick={closeModal} className={styles["btn-cancel"]}>
                    CANCEL
                  </Button>
                  <Button onClick={initRemove} primary className={styles["btn-proceed"]}>
                    RETRY
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalGeneral>
    </div>
  );
};

export default RemoveListModal;
