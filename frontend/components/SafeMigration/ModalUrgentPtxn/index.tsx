import styles from "./ModalUrgentPtxn.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Accordion from "frontend/components/UI/Accordion";
import SendDetail from "frontend/components/Dashboard/Content/Transactions/Detail/SendDetail";
import NewAssetDetail from "frontend/components/Dashboard/Content/Transactions/Detail/NewAssetDetail";
import ModalConfirm from "frontend/components/UI/Safe/ModalSafe/ModalConfirm";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import moment from "moment";
import SafeService from "frontend/services/safe";
import { useState } from "react";
import { getSelectedAccount } from "frontend/redux/features/account/accountSlice";
import { useAppSelector } from "frontend/redux/hooks";
import { errors } from "shared/constants";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import useSafeAuth from "frontend/hooks/useSafeAuth";
import { LedgerAccount } from "shared/interfaces";
import { useWallet } from "@txnlab/use-wallet";

const ss = new SafeService();

interface resTxn {
  title: string;
  address?: string;
}

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  seqNumb?: number | string;
  message?: string;
  resTxns?: resTxn[];
  errorDetails?: string;
  txHashLabel?: string;
}

interface Props {
  modalStatus: boolean;
  title?: string;
  urgentType?: any;
  urgentRequest?: any;
  urgentPayload?: any;
  onHide?: () => void;
  fetchMigration?: () => void;
}

type AccordionState = { [key: string]: boolean };

export type txIds = {
  safeCreation: string;
  safeID: number;
  optin: string;
};

const ModalUrgentPtxn: React.FC<Props> = ({
  modalStatus,
  urgentType,
  urgentRequest,
  urgentPayload,
  onHide,
  fetchMigration,
}: Props) => {
  const selectedAccount = useAppSelector<any>(getSelectedAccount);
  const { appConnectors } = useAppConnectors();
  const statusesList: any = {
    "Need Confirmation": "need-confirm",
    "Reject Ready": "reject-ready",
    Pending: "confirm",
    Ready: "ready",
    Success: "success",
    Expired: "expired",
  };

  //modal
  const [modalShow, setModalShow] = useState(false);
  const [progress, setProgress] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const [dataModal, setDataModal] = useState<DataModal>({
    title: "Success",
    type: "success",
    txHash: "",
    seqNumb: "",
  });
  const itemsModal = ["Creating ", "Processing", "Success"];

  const { authenticateSigner, generateTokenForLedger, generateToken } = useSafeAuth();
  const { signTransactions } = useWallet();

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

  const handleResolveExecutingPtxn = async (safeID: number) => {
    setProgress(true);
    setStepProgress(1);

    try {
      await authenticateSigner(selectedAccount.address, safeID);
    } catch (err) {
      if ("ledgerAddress" in selectedAccount) {
        await generateTokenForLedger(selectedAccount as LedgerAccount);
      } else {
        await generateToken(selectedAccount.address, signTransactions);
      }
    }

    try {
      const safe = await ss.getSafe(safeID);
      const appConnector = appConnectors.get(safe.address) as AppConnectorV2;

      setStepProgress(2);
      const res: any = await ss.resolveExecutingPendingTxn(selectedAccount.address, safe, appConnector);

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
      } else {
        setDataModal({
          type: "fail",
        });
      }
      setModalShow(true);
    } catch (error: any) {
      setDataModal({
        type: "fail",
        errorDetails: error?.message,
      });

      setStepProgress(3);
      setProgress(false);
      setModalShow(true);
    }
  };

  const handleUndoRekey = async (safeId: number) => {
    setProgress(true);
    setStepProgress(1);
    setStepProgress(2);
    try {
      const safe = await ss.getSafe(safeId);

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

      const payload_response = await ss.processUndoRekey(lsig_program, safe, pTxnSender);
      setStepProgress(3);
      setProgress(false);
      setDataModal({
        type: "success",
        txHash: payload_response?.response.txId || "",
      });
      setModalShow(true);
    } catch (error: any) {
      setStepProgress(3);
      setProgress(false);
      setDataModal({
        type: "fail",
        errorDetails: error?.message,
      });
      setModalShow(true);
    }
  };

  return (
    <>
      <ModalTx
        modalStatus={modalShow}
        title={dataModal.title}
        type={dataModal.type}
        txHash={dataModal.txHash}
        seqPtxn={dataModal.seqNumb}
        message={dataModal.message}
        resTxns={dataModal.resTxns}
        errorDetails={dataModal.errorDetails}
        txHashLabel={dataModal.txHashLabel}
        onHide={() => {
          onHide && onHide();
          setModalShow(false);
          fetchMigration && fetchMigration();
        }}
      />
      <ModalConfirm title="Transaction is Processing" items={itemsModal} modalStatus={progress} step={stepProgress} />
      <ModalGeneral title={"ATTENTION"} modalStatus={!modalShow && !progress && modalStatus} isBig noBorder isNoMargin>
        <div className={styles["attention-box"]}>
          <div className={styles["attention-subtitle"]}>
            <img src="/images/icon-exclamation.svg" alt="" />
            <span>
              You will not be able to create or execute any other transactions unless the following transactions below are
              resolved.{" "}
            </span>
          </div>
        </div>
        <div className="d-flex flex-column" style={{ gap: "40px" }}>
          {urgentRequest &&
            urgentRequest.map((item: any, idx: any) => {
              return (
                <div key={idx}>
                  <Accordion
                    status={statusesList[item?.status]}
                    expiresTime={moment(item.expiry).endOf("minute").fromNow()}
                    type={urgentType}
                    dappName={item?.dappName}
                    coinValue={urgentType !== "asset-new" && urgentType !== "asset-remove" && urgentPayload.payloadDirection}
                    approvers={item.approvers}
                    totalPeople={item.safeThreshold}
                    assetAmmout={urgentType !== "asset-new" && urgentType !== "asset-remove" && urgentPayload.displayAmount}
                    assetUnitName={urgentPayload.payloadAssetUnitName}
                    assetId={
                      (urgentType == "asset-new" || urgentType === "asset-modify" || urgentType === "asset-remove") &&
                      urgentPayload.payloadAssetID
                    }
                    seqNumb={item.seq}
                    isUrgent
                    safeId={item.safeId}
                    handleAccordionOpen={() => handleAccordionOpen(idx.toString())}
                    open={accordionState[idx.toString()] || false}
                  >
                    {urgentType === "new-asset" && (
                      <NewAssetDetail
                        dataDetail={item}
                        onExecute={() => handleResolveExecutingPtxn(item.safeId)}
                        onDelete={() => handleUndoRekey(item.safeId)}
                        isUrgent
                      />
                    )}
                    {urgentType === "send" && (
                      <SendDetail
                        dataDetail={item}
                        onExecute={() => handleResolveExecutingPtxn(item.safeId)}
                        onDelete={() => handleUndoRekey(item.safeId)}
                        isUrgent
                      />
                    )}
                  </Accordion>
                </div>
              );
            })}
        </div>
      </ModalGeneral>
    </>
  );
};

export default ModalUrgentPtxn;
