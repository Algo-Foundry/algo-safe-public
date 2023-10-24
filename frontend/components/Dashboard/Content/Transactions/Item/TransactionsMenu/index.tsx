import Image from "next/image";
import styles from "./TransactionsMenu.module.scss";
import Accordion from "frontend/components/UI/Accordion";
import GeneralDetail from "frontend/components/Dashboard/Content/Transactions/Detail/GeneralDetail";
import RemoveSafeDetail from "frontend/components/Dashboard/Content/Transactions/Detail/RemoveSafeDetail";
import ModalConfirm from "frontend/components/UI/Safe/ModalSafe/ModalConfirm";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import moment from "moment";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SafeService from "frontend/services/safe";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import {
  getSelectedSafe,
  setSelectedSafe,
  setNumOfPtxn,
  getIsNoReadOnly,
  getSigner,
  setIsHaveUrgentPtxn,
} from "frontend/redux/features/safe/safeSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import { PendingTxn, Safe } from "shared/interfaces";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { STATUS_REJECT_READY } from "shared/constants/ptxn";
import { errors } from "shared/constants";
import { getNumOfPtxn } from "frontend/redux/features/safe/safeSlice";
import AppConfig from "config/appConfig";
import ModalCheckUrgent from "frontend/components/Dashboard/ModalCheckUrgent";
import usePtxnActions from "frontend/hooks/usePtxnActions";
import { Account, useWallet } from "@txnlab/use-wallet";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import * as Sentry from "@sentry/nextjs";
import useSidebar from "frontend/hooks/useSidebar";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import useSafeAuth from "frontend/hooks/useSafeAuth";

const service = new SafeService();

interface Props {
  urgentShow?: any;
}

type AccordionState = { [key: string]: boolean };

const ActiveMenu: React.FC<Props> = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const numOfPtxn = useAppSelector(getNumOfPtxn);

  //data
  const selectedSafe = useAppSelector<any>(getSelectedSafe); // this is not a safe object

  const [ptxnsData, setPtxnsData] = useState<any>([]);
  const [deleteRequest, setDeleteRequest] = useState<any>();

  const selectedAccount = useAppSelector<any>(getSelectedAccount);
  const { appConnectors } = useAppConnectors();

  const isNoReadOnly = useAppSelector(getIsNoReadOnly);
  const [urgentRequest, setUrgentRequest] = useState<any>(null);
  const [urgentPayload, setUrgentPayload] = useState<any>({});
  const [urgentType, setUrgentType] = useState<any>({});
  const ptxnDataSelected = useAppSelector(getPtxnData);
  const signer: LedgerAccount | Account | null = useAppSelector(getSigner);
  const { authenticateSigner, generateTokenForLedger, generateToken } = useSafeAuth();

  interface resTxn {
    title: string;
    address?: string;
  }

  interface DataModal {
    title?: string;
    type: string;
    txHash?: string;
    removeSafe?: boolean;
    seqNumb?: number | string;
    message?: string;
    resTxns?: resTxn[];
    errorDetails?: string;
    txHashLabel?: string;
  }

  //modal
  const [loader, setLoader] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [progress, setProgress] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const [safeRemoved, setSafeRemoved] = useState(false);
  const [checkUrgentModal, setCheckUrgentModal] = useState(false);
  const [reloader, setReloader] = useState(0);
  const [dataModal, setDataModal] = useState<DataModal>({
    title: "Success",
    type: "success",
    txHash: "",
    seqNumb: "",
  });
  const itemsModal = ["Creating ", "Processing", "Success"];
  const { removeItem } = useSidebar();

  //accordion handling
  const [accordionState, setAccordionState] = useState<AccordionState>({});

  const handleAccordionOpen = (key: string) => {
    const newAccordionState: AccordionState = {};
    Object.keys(accordionState).forEach((key) => {
      newAccordionState[parseInt(key)] = false;
    });
    // Open clicked accordion
    if (accordionState[key]) {
      newAccordionState[key] = false;
    } else {
      newAccordionState[key] = true;
    }
    setAccordionState(newAccordionState);
  };

  // fetch safe pending txns
  const fetchData = async (addr: string) => {
    const reqData: Array<PendingTxn> = [];
    let newSelectedSafes = selectedSafe;
    if (!modalShow) {
      setLoader(true);
    }

    if (!newSelectedSafes.appId || selectedAccount.appId !== newSelectedSafes.appId) {
      const safe = await service.getSafe(Number(selectedAccount.appId));
      dispatch(setSelectedSafe(safe));
      newSelectedSafes = safe;
    }

    try {
      const appGS = await service.getSafeGlobalState(newSelectedSafes.appId);
      const ptxns = await service.getSafePendingTransactions(newSelectedSafes, addr, appGS);
      const getDeleteRequestPtxn = await service.getDeleteSafePtxn(newSelectedSafes, addr, appGS);
      const getUrgentRequestPtxn = await service.getUrgentPtxn(newSelectedSafes, appGS);
      ptxns
        .sort((a: any, b: any) => b.expiry - a.expiry)
        .sort((a: any, b: any) => (a.status > b.status ? 1 : a.status < b.status ? -1 : 0))
        .forEach((e) => {
          if (e.status !== "Success") {
            reqData.push(e);
          }
        });
      if (getDeleteRequestPtxn) {
        setDeleteRequest(getDeleteRequestPtxn);
      } else {
        setDeleteRequest("");
      }

      if (!urgentRequest) {
        setUrgentRequest(getUrgentRequestPtxn);
        if (getUrgentRequestPtxn) {
          const parsedPayload = getUrgentRequestPtxn.parsedPayload[0];
          let types = parsedPayload.payloadTxType;

          if (getUrgentRequestPtxn.dappName) {
            types = "dapp";
          }

          setUrgentType(types);
          setUrgentPayload(parsedPayload);
        }
      }
      setLoader(false);
      setPtxnsData(reqData.reverse());
      dispatch(setNumOfPtxn(ptxns.length));
      if (getDeleteRequestPtxn || getUrgentRequestPtxn) {
        dispatch(setIsHaveUrgentPtxn(true));
      } else {
        dispatch(setIsHaveUrgentPtxn(false));
      }
    } catch (err) {
      const safeEmpty = String(err).includes("404");
      if (safeEmpty) {
        setLoader(false);
        setSafeRemoved(true);
      }
    }
  };

  const { handlePtxnAction } = usePtxnActions();
  const { signTransactions, sendTransactions, activeAddress } = useWallet();

  useEffect(() => {
    if (!selectedAccount?.appId) {
      Router.push("/");
    }

    fetchData(signer?.address || "");

    if (safeRemoved) {
      localStorage.removeItem("SelectedSafe");
    }
  }, [signer, safeRemoved, selectedAccount]);

  // txn Action
  const txAction = async (item: PendingTxn, action: string) => {
    setProgress(true);
    setStepProgress(1);

    if (action === "execute" || action === "reject" || action === "confirm") {
      const getUrgentRequestPtxn = await service.getUrgentPtxn(selectedSafe);
      if (getUrgentRequestPtxn) {
        setProgress(false);
        setCheckUrgentModal(true);
        return;
      }
    }

    if (item.parsedPayload) {
      if (item.parsedPayload[0].payloadType === "asset-optin" && action === "execute") {
        const { enoughAlgos, minBalance } = await service.enoughAlgosToHoldNewAsset(selectedSafe);
        if (!enoughAlgos) {
          setProgress(false);
          setModalShow(true);
          setDataModal({
            type: "fail",
            errorDetails: `Please ensure that you have at least ${(minBalance / 1e6).toFixed(
              3
            )} Algos in the Safe before executing this transaction.`,
          });
          return;
        }
      }
    }

    try {
      // determine if an app connector exists
      const appConnector = appConnectors.get(selectedSafe.address) as AppConnectorV2;

      const res = await handlePtxnAction(
        selectedSafe,
        signer,
        signTransactions,
        sendTransactions,
        item,
        action,
        setPtxnData,
        setStepProgress,
        setDataModal,
        undefined,
        undefined,
        undefined,
        undefined,
        appConnector
      );

      if (item.status == STATUS_REJECT_READY || action === "execute-remove-safe" || action === "cancel-remove-safe") {
        dispatch(setPtxnData({}));
      }
      setStepProgress(3);
      setProgress(false);

      if (
        action === "reject-remove-safe" ||
        action === "confirm-remove-safe" ||
        action === "execute-remove-safe" ||
        action === "cancel-remove-safe"
      ) {
        setDataModal({
          type: "success",
          removeSafe: true,
          txHash: res?.res?.txId || "",
        });
      } else {
        setDataModal({
          type: "success",
          seqNumb: action !== "delete" ? item.seq : "",
          txHash: res?.res?.txId || "",
        });
      }

      if (action === "execute-remove-safe") {
        setSafeRemoved(true);
      }
      setModalShow(true);
      setReloader(1);
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Safe Txn Action",
          appId: selectedSafe.appId,
          sender: signer?.address,
          item: JSON.stringify(item),
          action: action,
        },
      });
      setProgress(false);
      setModalShow(true);
      setDataModal({
        type: "fail",
        errorDetails: err?.message,
      });
      if (action === "execute") {
        setReloader(1);
      }
    }
  };

  // handle Action
  const handleReject = async (item: PendingTxn) => txAction(item, "reject");
  const handleConfirm = async (item: PendingTxn) => txAction(item, "confirm");
  const handleExecute = async (item: PendingTxn) => txAction(item, "execute");
  const handleDelete = async (item: PendingTxn) => txAction(item, "delete");
  const handleRejectRemove = async (item: PendingTxn) => txAction(item, "reject-remove-safe");
  const handleConfirmRemove = async (item: PendingTxn) => txAction(item, "confirm-remove-safe");
  const handleExecuteRemove = async (item: PendingTxn) =>
    txAction(
      item,
      item.status === STATUS_REJECT_READY || ptxnDataSelected?.status == STATUS_REJECT_READY
        ? "cancel-remove-safe"
        : "execute-remove-safe"
    );

  const handleResolveExecutingPtxn = async () => {
    setProgress(true);
    setStepProgress(1);

    if (!signer) throw new Error("Missing Signer");

    try {
      await authenticateSigner(signer.address, selectedSafe.appId);
    } catch (err) {
      if ("ledgerAddress" in signer) {
        await generateTokenForLedger(signer as LedgerAccount);
      } else {
        await generateToken(signer.address, signTransactions);
      }
    }

    try {
      setStepProgress(2);

      const appConnector = appConnectors.get(selectedSafe.address) as AppConnectorV2;
      const res: any = await service.resolveExecutingPendingTxn(selectedAccount.address, selectedSafe as Safe, appConnector);

      const resTxns = [];
      if (res?.payload_response?.response?.txId) {
        resTxns.push({
          title: "Tx Hash",
          address: res.payload_response.response.txId,
        });
      }

      if (res?.undorekey_response?.response?.txId) {
        resTxns.push({
          title: "Undorekey Tx Hash",
          address: res.undorekey_response.response.txId,
        });
      }

      setStepProgress(3);
      setProgress(false);
      if (resTxns.length > 0) {
        setDataModal({
          type: "success-txns",
          resTxns,
        });
        setReloader(1);
      } else {
        setDataModal({
          type: "fail",
        });
      }
      setModalShow(true);
      dispatch(setPtxnData({}));
      dispatch(setIsHaveUrgentPtxn(false));
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          step: "resolve executing ptxn",
          appId: selectedSafe.appId,
        },
      });
      setDataModal({
        type: "fail",
        errorDetails: error?.message,
      });

      setStepProgress(3);
      setProgress(false);
      setModalShow(true);
    }
  };

  const handleUndoRekey = async () => {
    setProgress(true);
    setStepProgress(1);
    setStepProgress(2);
    try {
      const safe = await service.getSafe(selectedSafe.appId);

      const execTxn = safe.executingTransaction;
      const pTxnSender = execTxn?.sender;
      if (pTxnSender === undefined) {
        throw new Error(errors.ERR_NO_SENDER_ADDRESS);
      }
      // get program from chain
      const lsig_program = execTxn?.lsig_program;
      if (lsig_program === undefined) {
        throw new Error(errors.ERR_NO_LSIG_PROGRAM);
      }

      const payload_response = await service.processUndoRekey(lsig_program, safe, pTxnSender);
      const getUrgentRequestPtxn = await service.getUrgentPtxn(selectedSafe);
      setUrgentRequest(getUrgentRequestPtxn);
      setStepProgress(3);
      setProgress(false);
      setDataModal({
        type: "success",
        txHash: payload_response?.response.txId || "",
      });
      setModalShow(true);
      dispatch(setIsHaveUrgentPtxn(false));
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          step: "undo rekey",
          appId: selectedSafe.appId,
          lsig_program: selectedSafe.executingTransaction?.lsig_program,
        },
      });
      setStepProgress(3);
      setProgress(false);
      setDataModal({
        type: "fail",
        errorDetails: error?.message,
      });
      setModalShow(true);
    }
  };

  const statusesList: any = {
    "Need Confirmation": "need-confirm",
    "Reject Ready": "reject-ready",
    Pending: "confirm",
    Ready: "ready",
    Success: "success",
    Expired: "expired",
  };

  return (
    <>
      <ModalCheckUrgent
        modalStatus={checkUrgentModal}
        onHide={() => {
          setCheckUrgentModal(false);
        }}
      />
      <ModalTx
        isTxnPage={true}
        modalStatus={modalShow}
        title={dataModal.title}
        type={dataModal.type}
        removeSafe={dataModal.removeSafe}
        txHash={dataModal.txHash}
        seqPtxn={dataModal.seqNumb}
        message={dataModal.message}
        resTxns={dataModal.resTxns}
        errorDetails={dataModal.errorDetails}
        txHashLabel={dataModal.txHashLabel}
        onExecute={() => {
          setModalShow(false);
          if (dataModal.removeSafe) {
            handleExecuteRemove(deleteRequest && deleteRequest);
          } else {
            handleExecute(ptxnDataSelected);
          }
        }}
        onHide={async () => {
          setModalShow(false);
          if (reloader == 2 || safeRemoved) {
            if (safeRemoved) await removeItem(selectedSafe.address, activeAddress);
            router.push({
              pathname: "/",
            });
          } else if (reloader == 1 && dataModal.type !== "fail") {
            setLoader(true);
            fetchData(signer?.address || "");
          }
          setReloader(0);
        }}
      />
      <ModalConfirm
        title="Transaction is Processing"
        items={itemsModal}
        modalStatus={progress}
        step={stepProgress}
        disabledFooter={signer?.providerId === undefined}
      />
      <ModalLoadingTx title="Fetching Transactions..." modalStatus={loader} />
      <div className={styles["active-menu"]}>
        <div className={styles.listHeader}>
          <div className={styles.boxHeader}>
            <div className={`${styles.itemHeader} ${styles.pLeft}`}>Type</div>
            <div className={styles.itemHeader}>Amount</div>
            <div className={styles.itemHeader}>Expiry</div>
          </div>
          <div className={styles.boxHeader}>
            <div className={styles.itemHeaderRight}>Confirmations</div>
            <div className={styles.itemHeaderRight}>Status</div>
          </div>
        </div>

        {urgentRequest && (
          <Accordion
            status={statusesList[urgentRequest.status]}
            expiresTime={moment(urgentRequest.expiry).endOf("minute").fromNow()}
            type={urgentType}
            dappName={urgentRequest?.dappName}
            coinValue={urgentType !== "asset-new" && urgentType !== "asset-remove" && urgentPayload.payloadDirection}
            approvers={urgentRequest.approvers}
            totalPeople={selectedSafe?.threshold}
            assetAmmout={urgentType !== "asset-new" && urgentType !== "asset-remove" && urgentPayload.displayAmount}
            assetUnitName={urgentPayload.payloadAssetUnitName}
            assetId={
              (urgentType === "asset-new" || urgentType === "asset-modify" || urgentType === "asset-remove") &&
              urgentPayload.payloadAssetID
            }
            seqNumb={urgentRequest.seq}
            isUrgent
            classList={styles.boxBorder}
            handleAccordionOpen={() => handleAccordionOpen("urgentRequest")}
            open={accordionState["urgentRequest"] || false}
          >
            <GeneralDetail
              dataDetail={urgentRequest}
              txnType={urgentType}
              onConfirm={() => handleConfirm(urgentRequest)}
              onReject={() => handleReject(urgentRequest)}
              onExecute={() => handleResolveExecutingPtxn()}
              onDelete={() => handleUndoRekey()}
              isUrgent
            />
          </Accordion>
        )}

        {deleteRequest && (
          <Accordion
            status={statusesList[deleteRequest.status]}
            type="remove-safe"
            approvers={deleteRequest.approvers}
            totalPeople={selectedSafe?.threshold}
            classList={styles.boxBorder}
            handleAccordionOpen={() => handleAccordionOpen("deleteRequest")}
            open={accordionState["deleteRequest"] || false}
          >
            <RemoveSafeDetail
              dataDetail={deleteRequest}
              onConfirm={() => handleConfirmRemove(deleteRequest)}
              onReject={() => handleRejectRemove(deleteRequest)}
              onExecute={() => handleExecuteRemove(deleteRequest)}
              onDelete={() => handleExecuteRemove(deleteRequest)}
            />
          </Accordion>
        )}

        {isNoReadOnly && ptxnsData.length > 0 && (
          <span className={styles["text-title"]}>
            ACTIVE ({numOfPtxn}/{AppConfig.maxPtxn})
          </span>
        )}

        {ptxnsData?.map((item: any, key: number) => {
          const endOfTime = moment(item.expiry).endOf("minute").fromNow();
          const parsed = item.parsedPayload[0];
          let types = parsed.payloadTxType;

          if (item.dappName) {
            types = "dapp";
          }

          return (
            <div key={`${item.txnId}-${key}`}>
              <Accordion
                status={statusesList[item.status]}
                expiresTime={endOfTime}
                type={types}
                dappName={item.dappName}
                coinValue={types != "asset-new" && types != "asset-remove" && item.parsedPayload[0]?.payloadDirection}
                approvers={item.approvers}
                totalPeople={selectedSafe?.threshold}
                assetAmmout={types != "asset-new" && types != "asset-remove" && parsed?.displayAmount}
                assetUnitName={parsed?.payloadAssetUnitName}
                assetId={
                  (types === "asset-new" || types === "asset-modify" || types === "asset-remove") && parsed?.payloadAssetID
                }
                seqNumb={item.seq}
                classList={styles.boxBorder}
                isGreyOut={urgentRequest || deleteRequest}
                handleAccordionOpen={() => handleAccordionOpen(key.toString())}
                open={accordionState[key.toString()] || false}
              >
                <GeneralDetail
                  dataDetail={item}
                  txnType={types}
                  onConfirm={() => handleConfirm(item)}
                  onReject={() => handleReject(item)}
                  onExecute={() => handleExecute(item)}
                  onDelete={() => handleDelete(item)}
                  isButtonHidden={urgentRequest || deleteRequest}
                />
              </Accordion>
            </div>
          );
        })}

        {!loader && ptxnsData <= 0 && !urgentRequest && !deleteRequest && (
          <div className={styles["empty-data"]}>
            <div className={styles["box-icon-sm"]}>
              <Image
                alt="Icon transaction"
                src="/images/icon-receipt-disable.svg"
                layout="fill"
                objectFit="cover"
                quality={100}
                priority={true}
              />
            </div>
            <span className={styles.text}>There are no active transactions at the moment</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ActiveMenu;
