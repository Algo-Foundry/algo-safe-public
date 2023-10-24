import styles from "./ModalConfirm.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import { useMemo, useState } from "react";
import IconLink from "frontend/components/UI/Icon/iconLink";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import { Safe } from "shared/interfaces";
import useGetDeleteSafePtxn from "frontend/hooks/useGetDeleteSafePtxn";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedSafe, getSigner } from "frontend/redux/features/safe/safeSlice";
import { Account, useWallet } from "@txnlab/use-wallet";
import SafeService from "frontend/services/safe";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import { encodeUnsignedTransaction } from "algosdk";
import useSidebar from "frontend/hooks/useSidebar";
import { algoexplorerTransactionUrl } from "frontend/utils/string";

interface resTxn {
  title: string;
  address?: string;
}

interface Props {
  modalStatus: boolean;
  title?: string;
  setModalStatus: (status: boolean) => void;
  type?: string;
  removeSafe?: boolean;
  txHash?: string;
  seqPtxn?: string | number;
  lsig_address?: string;
  message?: string;
  onHide: () => void;
  resTxns?: resTxn[];
  errorDetails?: string;
  txHashLabel?: string;
  onExecute?: () => void;
  safe?: Safe | null;
  txId?: string;
  selectedTabs?: () => void;
  onFail?: () => void;
  isLedger?: boolean;
}

const ModalDanger: React.FC<Props> = ({
  modalStatus,
  title,
  setModalStatus,
  seqPtxn,
  onExecute,
  selectedTabs,
  removeSafe,
  onHide,
  type = "success",
  isLedger = false,
}: Props) => {
  const ss = new SafeService();
  const signer: LedgerAccount | Account | null = useAppSelector(getSigner);
  const selectedSafe: any = useAppSelector(getSelectedSafe);

  const { signTransactions, sendTransactions, activeAccount, activeAddress } = useWallet();
  const { removeItem } = useSidebar();
  const { getVoteOrDeleteSafeTxn } = useGetDeleteSafePtxn();

  const [stepProgress, setStepProgress] = useState(1);
  const itemsModal = ["Creating ", "Processing", "Success"];
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [errorDetails, setErrorDetails] = useState("");
  const [typeModal, setTypeModal] = useState("success-ptxn");
  const [responseModalShow, setResponseModalShow] = useState(false);
  const [modalDeleteExecute, setModalDeleteExecute] = useState(false);

  function catchError(err: any) {
    setTypeModal("fail");
    setErrorDetails(err?.message);
    if (err.response?.status == 401) {
      setErrorDetails(err?.response?.data?.message);
    }
    setResponseModalShow(true);
  }

  function finishTransaction() {
    setResponseModalShow(true);
    setLoadingModalShow(false);
    setModalStatus(false);
  }

  const modalTitle = useMemo(() => {
    if (title) {
      return title;
    }

    switch (type) {
      case "success":
        return "Success";
      case "success-txns":
      case "success-ptxn":
        return "Success";
      case "fail":
      default:
        return "Fail";
    }
  }, [title, type]);

  const isSafeSignerLedger = () => {
    if (!signer) {
      return false;
    }
    return signer && "ledgerAddress" in signer;
  };

  const deleteTxn = async () => {
    setLoadingModalShow(true);
    try {
      const { res, confirmation } = await getVoteOrDeleteSafeTxn(
        selectedSafe,
        activeAccount,
        setStepProgress,
        signTransactions,
        sendTransactions
      );
      if (confirmation !== undefined || res["confirmed-round"] !== undefined) {
        finishTransaction();
      }
    } catch (err: any) {
      catchError(err);
    } finally {
      setLoadingModalShow(false);
    }
  };

  onExecute = async () => {
    const appGS = await ss.getSafeGlobalState(selectedSafe.appId);
    if (activeAccount) {
      if (appGS.get("d") == undefined) {
        await deleteTxn();
      }
      if (selectedSafe.threshold == 1) {
        removeSafe = true;
        setResponseModalShow(false);
        setModalDeleteExecute(true);
      }
      setModalStatus(false);
    }
  };

  const handleDelete = async () => {
    setModalDeleteExecute(false);
    setStepProgress(1);
    if (activeAccount) {
      setLoadingModalShow(true);
      try {
        const delTxn = await ss.getExecuteDeleteSafeTxn(selectedSafe, activeAccount.address);
        const encodedTxns = delTxn.map((txn) => encodeUnsignedTransaction(txn));
        setStepProgress(2);
        const signedTxn = await signTransactions(encodedTxns);
        const res = await sendTransactions(signedTxn);
        if (res["confirmed-round"] !== undefined) {
          setStepProgress(3);
          setModalDeleteExecute(false);
          await removeItem(selectedSafe.address, activeAddress);
        }
      } catch (err: any) {
        catchError(err);
      }
    }
  };

  if (!selectedSafe?.address) return null;

  return (
    <div>
      {modalDeleteExecute && (
        <ModalTx
          modalStatus={modalDeleteExecute}
          removeSafe={true}
          onHide={() => {
            setModalDeleteExecute(false);
          }}
          onExecute={() => {
            handleDelete();
          }}
        />
      )}
      <ModalTx
        modalStatus={responseModalShow}
        type={typeModal}
        errorDetails={errorDetails}
        onHide={() => {
          if (typeModal === "success-ptxn" || typeModal === "success") {
            selectedTabs && selectedTabs();
            setResponseModalShow(false);
          } else {
            setResponseModalShow(false);
          }
        }}
      />

      <ModalLoadingTx
        title="Transaction is Processing"
        items={itemsModal}
        modalStatus={loadingModalShow}
        step={stepProgress}
        disabledFooter={isLedger || isSafeSignerLedger()}
      />
      {selectedSafe.address && (
        <ModalGeneral
          title={modalTitle}
          onExecute={onExecute}
          onHide={onHide}
          seqNumb={seqPtxn}
          removeSafe={removeSafe}
          modalStatus={modalStatus}
        >
          <div className={styles.modalTx}>
            <img src={"images/icon-danger-pink.svg"} className={styles.iconModal} alt="" />
            <div className="box-safe default gap-0 mt-4">
              <div className={`${styles.textModal} mt-1 text-center w-100`}>
                <p>
                  <span className={styles.bold}>{selectedSafe.name}</span>
                </p>
              </div>
              <div className={`${styles.textModal} mt-1 ${styles.wrapText}`}>
                <p>
                  <span className={styles.bold}>Safe ID</span> - # {selectedSafe.appId}
                </p>
                <IconLink link={selectedSafe.appId} />
                <IconCopy copy={algoexplorerTransactionUrl({ id: String(selectedSafe.appId), path: "application" })} />
              </div>
              <div className={`${styles.textModal} mt-1 ${styles.wrapText}`}>
                <p>
                  <span className={styles.bold}>Address : </span>
                  {selectedSafe.address.slice(0, 5)} ... {selectedSafe.address.slice(-5)}
                </p>
                <IconLink link={selectedSafe.address} />
                <IconCopy copy={algoexplorerTransactionUrl({ id: selectedSafe.address, path: "address" })} />
              </div>
              <div className={`${styles.textModal} mt-2 text-center ${styles.wrapText}`}>
                <p style={{ textAlign: "center", color: "#E15173" }}>
                  {`${"You're about to create a pending transaction which will permanently delete this Safe upon execution. Do you wish to proceed?"}`}
                </p>
              </div>
              <div style={{ width: "100%", marginTop: "20px" }}>
                <div className={styles.btnWrapper}>
                  <button onClick={onHide} className={styles.btnCancel}>
                    <p className={styles.text}>CANCEL</p>
                  </button>
                  <button onClick={onExecute} className={styles.btnProceed}>
                    <p className={styles.text}>PROCEED</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalGeneral>
      )}
    </div>
  );
};

export default ModalDanger;
