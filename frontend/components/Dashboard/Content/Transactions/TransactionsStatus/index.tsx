import Styles from "./TransactionsStatus.module.scss";
import TimelineStatus from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus/TimelineStatus";
import ButtonTxnModal from "frontend/components/Dashboard/Content/Transactions/TransactionsStatus/ButtonTxnModal";
import FormInfo from "frontend/components/UI/Form/FormInfo";
import Button from "frontend/components/Button";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import { Collapse } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  STATUS_READY,
  STATUS_PENDING,
  STATUS_EXPIRED,
  STATUS_REJECT_READY,
  STATUS_NEED_CONFIRMATION,
} from "shared/constants/ptxn";
import { getSigner } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import LedgerLoader from "frontend/components/UI/LedgerLoader";
import useLedger from "frontend/hooks/useLedger";
import DappService from "frontend/services/dApp";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import useSidebar from "frontend/hooks/useSidebar";

interface Props {
  data: any;
  onConfirm?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onDelete?: () => void;
  isUrgent?: boolean;
  isButtonHidden?: boolean;
}

const TransactionsStatus: React.FC<Props> = ({
  data,
  onConfirm,
  onReject,
  onExecute,
  onDelete,
  isUrgent,
  isButtonHidden,
}: Props) => {
  const [modalBtnShow, setModalBtnShow] = useState(false);
  const [showTxnDetail, setShowTxnDetail] = useState(false);
  const [modalContentStatus, setModalContentStatus] = useState<any>(false);
  const [isConnectingLedger, setIsConnectingLedger] = useState(false);
  const { appConnectors } = useAppConnectors();
  const { selected } = useSidebar();
  const safeAddress = selected?.address;
  const initiator = data.sender;
  const isDappPtxn = data.dappName;
  const canExecute = data.canExecute;
  const signer = useAppSelector(getSigner);

  const checkDappConnection = async () => {
    const appCon = appConnectors.get(safeAddress as string) as AppConnectorV2;
    const connectedDapp = await DappService.getConnectedDapp(appCon, data.wc_id);
    if (connectedDapp) {
      data.canExecute = true;
    } else {
      data.canExecute = false;
    }
  };

  useEffect(() => {
    if (data.wc_id) {
      checkDappConnection();
    }
  }, []);

  const handleBtnStatus = (val: string) => {
    const btnGroup = [];

    //set delete for all urgent ptxn
    if (isUrgent) {
      btnGroup.push("delete");
    }

    //set btn non-vote
    switch (data.status) {
      case STATUS_READY:
        if (!isDappPtxn || (isDappPtxn && canExecute && initiator === signer?.address)) {
          btnGroup.push("execute");
        }

        break;
      case STATUS_REJECT_READY:
        btnGroup.push("execute-reject");
        break;
      case STATUS_EXPIRED:
        btnGroup.push("delete");
        break;
      case STATUS_PENDING:
        if (initiator === signer?.address) {
          btnGroup.push("execute-disable");
        }
        break;
      case STATUS_NEED_CONFIRMATION:
        btnGroup.push("need-confirmation");
        break;
      default:
        break;
    }
    return btnGroup.includes(val);
  };

  const handleBtnModal = (val: any) => {
    setModalBtnShow(true);
    setModalContentStatus(val);
  };

  const { connect } = useLedger();

  const approve = async () => {
    setModalBtnShow(false);
    if (signer?.hasOwnProperty("ledgerAddress")) {
      try {
        setIsConnectingLedger(true);
        const transport = await connect();
        if (transport === undefined) {
          return;
        } else {
          onConfirm && onConfirm();
        }
      } catch (error) {
        return;
      } finally {
        setIsConnectingLedger(false);
      }
    } else {
      onConfirm && onConfirm();
    }
  };

  const reject = async () => {
    setModalBtnShow(false);
    if (signer?.hasOwnProperty("ledgerAddress")) {
      try {
        setIsConnectingLedger(true);
        const transport = await connect();
        if (transport === undefined) {
          return;
        } else {
          onReject && onReject();
        }
      } catch (error) {
        return;
      } finally {
        setIsConnectingLedger(false);
      }
    } else {
      onReject && onReject();
    }
  };

  return (
    <div className={Styles["transaction-status"]}>
      {/* <div className={Styles["status--number"]}> */}
      <FormInfo label="Number of Approvals" value={data.approvers} isGreen isLabelMax />
      {/* </div> */}
      {/* <div className={Styles["status--number"]}> */}
      <FormInfo label="Number of Rejections" value={data.rejections} isRed isLabelMax />
      {/* </div> */}
      <div className={Styles["status--timeline"]}>
        {!isUrgent && (
          <div>
            <div role="button" className={Styles["show-txn-detail"]} onClick={() => setShowTxnDetail(!showTxnDetail)}>
              Show Confirmation Timeline
              <div
                className={`
                ${showTxnDetail ? "toggle-arrow-active" : "toggle-arrow-inactive"} d-flex text-dark
                `}
              >
                <ArrowDown />
              </div>
            </div>

            <Collapse in={showTxnDetail}>
              <div className={Styles["collapse-timeline"]}>
                <TimelineStatus data={data} isUrgent={isUrgent} />
              </div>
            </Collapse>
          </div>
        )}
        <ButtonTxnModal
          modalStatus={modalBtnShow}
          isLedger={signer?.hasOwnProperty("ledgerAddress") ? true : false}
          onHide={() => setModalBtnShow(false)}
          onConfirm={() => {
            setModalBtnShow(false);
            onConfirm && onConfirm();
          }}
          onReject={() => {
            setModalBtnShow(false);
            onReject && onReject();
          }}
          onLedgerExecute={async () => {
            setModalBtnShow(false);
            try {
              setIsConnectingLedger(true);
              const transport = await connect();

              if (transport === undefined) {
                return;
              } else {
                if (modalContentStatus === "execute") onExecute && onExecute();
                else if (modalContentStatus === "execute-reject") onDelete && onDelete();
              }
            } catch (error) {
              return;
            } finally {
              setIsConnectingLedger(false);
            }
          }}
          onExecute={() => {
            setModalBtnShow(false);
            if (modalContentStatus === "execute") onExecute && onExecute();
            else if (modalContentStatus === "execute-reject") onDelete && onDelete();
          }}
          modalContentStatus={modalContentStatus}
        />

        {signer?.hasOwnProperty("ledgerAddress") && (
          <div>
            {isConnectingLedger ? (
              <div className={Styles.ledgerBoxIcon}>
                {<LedgerLoader />}
                <div className={Styles.ledgerText}>Connect and sign transaction(s) through your ledger device.</div>
              </div>
            ) : (
              <div className={Styles.ledgerBoxIcon}>
                <img src="/images/dashboard/ledger-import-blue-big-transparent.svg" alt="icon" className={Styles.ledgerIcon} />
                <div className={Styles.ledgerText}>
                  Connect your Ledger to your computer, unlock, and choose the &#39;Algorand&#39; app before connecting.
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnectingLedger ? (
          <div>
            {!isButtonHidden && (
              <div className={Styles["btn-wrapper"]}>
                {handleBtnStatus("delete") && (
                  <Button className={Styles["btn"]} danger onClick={() => handleBtnModal("execute-reject")}>
                    <p>DELETE</p>
                  </Button>
                )}

                {handleBtnStatus("execute-disable") && (
                  <Button className={Styles["btn-disabled"]} primary disabled>
                    <p>EXECUTE</p>
                  </Button>
                )}

                {handleBtnStatus("need-confirmation") && (
                  <div className={`${Styles["btn-wrapper"]}`} style={{ marginTop: "0" }}>
                    <Button danger onClick={reject} className={Styles["btn"]}>
                      <p>REJECT</p>
                    </Button>
                    <Button onClick={approve} primary className={Styles["btn"]}>
                      <p>APPROVE</p>
                    </Button>
                  </div>
                )}

                {(handleBtnStatus("execute") || handleBtnStatus("execute-reject")) && (
                  <Button
                    className={Styles["btn"]}
                    primary
                    danger={handleBtnStatus("execute-reject")}
                    onClick={() => handleBtnModal(handleBtnStatus("execute") ? "execute" : "execute-reject")}
                  >
                    <p>{handleBtnStatus("execute-reject") ? "DELETE" : "EXECUTE"}</p>
                  </Button>
                )}

                {handleBtnStatus("sign") && (
                  <Button className={Styles["btn"]} primary onClick={() => handleBtnModal("vote")}>
                    <p>SIGN</p>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={Styles["btn-wrapper"]}>
            <Button primary className={`${Styles["btn"]} flex-grow-1 w-100`} disabled={true}>
              CONNECTING TO LEDGER...
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsStatus;
