import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { dapp, errors } from "shared/constants";
import { useWallet } from "@txnlab/use-wallet";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import { LedgerAccount, DappRequest, SidebarAccount, Safe, PendingTxn } from "shared/interfaces";
import { Account } from "@txnlab/use-wallet";
import useSidebar from "frontend/hooks/useSidebar";
import LedgerService from "frontend/services/ledger";
import SafeService from "frontend/services/safe";
import useDappPtxn from "frontend/hooks/useDappPtxn";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import algosdk from "algosdk";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import styles from "./ModalDappSigning.module.scss";
import { Accordion, AccordionContext, Collapse, useAccordionButton } from "react-bootstrap";
import Button from "frontend/components/Button";
import usePtxnActions from "frontend/hooks/usePtxnActions";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import LedgerLoader from "frontend/components/UI/LedgerLoader";
import BorderDivider from "frontend/components/UI/BorderDivider";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import MoneySendIcon from "frontend/components/Icons/MoneySend";
import AppsIcon from "frontend/components/Icons/Apps";
import MoneyReceiveIcon from "frontend/components/Icons/MoneyReceive";
import NewAsset from "frontend/components/Icons/NewAsset";
import Reverse from "frontend/components/Icons/Reverse";
import Snow from "frontend/components/Icons/Snow";
import Key from "frontend/components/Icons/Key";
import Pencil from "frontend/components/Icons/Pencil";
import AddThree from "frontend/components/Icons/AddThree";
import DeleteKey from "frontend/components/Icons/DeleteKey";
import UpdateRotation from "frontend/components/Icons/UpdateRotation";
import ClearFormat from "frontend/components/Icons/ClearFormat";
import AddDouble from "frontend/components/Icons/AddDouble";
import ExternalTransmission from "frontend/components/Icons/ExternalTransmission";
import InternalTransmission from "frontend/components/Icons/InternalTransmission";
import ArrowLeftSmall from "frontend/components/Icons/ArrowLeftSmall";
import { copyText } from "shared/utils";
import { toast } from "react-toastify";
import { getSigner } from "frontend/redux/features/safe/safeSlice";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import ModalTx from "../Transactions/ModalTx";
import { useRouter } from "next/router";
import useLedger from "frontend/hooks/useLedger";
import { AppConnector } from "frontend/services/safe/appConnector";
import DappService from "frontend/services/dApp";

const ls = new LedgerService();
const ss = new SafeService();

interface Props {
  showSigningModal: boolean;
  setShowSigningModal: Dispatch<SetStateAction<boolean>>;
}

interface TxnAccordionProps {
  detail: DappRequest | null;
  setShowLogicSig: Dispatch<SetStateAction<boolean>>;
  setLogicSig: Dispatch<SetStateAction<string>>;
  rawTxns: algosdk.Transaction[];
}

interface TxnItem {
  id: number;
  payloadType: string;
  payloadDirection: string;
  displayAmount: number;
  payloadAssetUnitName: string;
}

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  message?: string;
  errorDetails?: string;
}

const getTxnTypeIcon = (payloadType: string) => {
  switch (payloadType?.toLowerCase()) {
    case "asset-optin":
      return <NewAsset />;
    case "send":
      return <MoneySendIcon />;
    case "receive":
      return <MoneyReceiveIcon />;
    case "app-call":
      return <AppsIcon />;
    case "asset-clawback":
      return <Reverse />;
    case "asset-create":
      return <AddThree />;
    case "asset-freeze":
      return <Snow />;
    case "asset-modify":
      return <Pencil />;
    case "asset-destroy":
      return <DeleteKey />;
    case "asset-new":
      return <NewAsset />;
    case "key-registration":
      return <Key />;
    case "app-closeout":
      return <ExternalTransmission />;
    case "app-create":
      return <AddDouble />;
    case "app-update":
      return <UpdateRotation />;
    case "app-delete":
      return <DeleteKey />;
    case "app-optin":
      return <InternalTransmission />;
    case "app-clear":
      return <ClearFormat />;
  }
};

const title = (type: string) => {
  switch (type) {
    case "app-call":
      return "Application Call";
    case "asset-optin":
      return "New Asset";
    case "asset-clawback":
      return "Clawback";
    case "asset-create":
      return "Create Asset";
    case "asset-freeze":
      return "Freeze Asset";
    case "asset-modify":
      return "Modify Asset";
    case "asset-destroy":
      return "Destroy Asset";
    case "key-registration":
      return "Key Registration";
    case "app-create":
      return `Create App`;
    case "app-update":
      return `Update App`;
    case "app-delete":
      return `Delete App`;
    case "app-optin":
      return `Opt-in App`;
    case "app-closeout":
      return `App Close Out`;
    case "app-clear":
      return `App Clear State`;
    default:
      return type;
  }
};

const definedTxnType = ["send", "receive", "asset-optin"];

const itemsModal = ["Creating ", "Processing", "Success"];

const isDefinedTxnType = (payloadType: string) => {
  return definedTxnType.includes(payloadType?.toLowerCase());
};

function TxnHeader({ txn }: { txn: TxnItem }) {
  const decoratedOnClick = useAccordionButton(String(txn.id));
  const { activeEventKey } = useContext(AccordionContext);
  const isCurrentEventKey = activeEventKey === String(txn.id);
  const typeTxns = txn.payloadType == "pay" || txn.payloadType == "asset-transfer" ? txn.payloadDirection : txn.payloadType;

  return (
    <div className={styles["txn-header"]} role="button" onClick={decoratedOnClick}>
      <div>{getTxnTypeIcon(typeTxns)}</div>

      <div style={{ textAlign: "left" }} className="flex-grow-1 ps-2">
        {title(typeTxns)}
      </div>

      <div className={`${isDefinedTxnType(typeTxns) ? "d-flex align-items-center" : "d-none"}`}>
        <div>
          <b>
            {typeTxns !== "asset-optin" && txn.displayAmount} {txn.payloadAssetUnitName}
          </b>
        </div>
      </div>

      <div className={`${isCurrentEventKey ? "toggle-arrow-active" : "toggle-arrow-inactive"} d-flex`}>
        <ArrowDown />
      </div>
    </div>
  );
}

function TxnAccordion({ detail, setShowLogicSig, setLogicSig, rawTxns }: TxnAccordionProps) {
  return (
    <Collapse in={true}>
      <div className="mt-2 w-100">
        <div className={styles["body-2"]}>
          <div className={styles["txn-container"]}>
            {detail?.parsedPayload?.map((item: any, i: any) => {
              return (
                <Accordion key={"item-" + i}>
                  <div className={styles["txn-card"]}>
                    <TxnHeader txn={item}></TxnHeader>

                    <Accordion.Collapse eventKey={String(item.safe_app_id)}>
                      <div className={styles["txn-body"]}>
                        <BorderDivider></BorderDivider>
                        <div>
                          {item.payloadExpiryDate && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">Expiry Date :</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadExpiryDate}</div>
                            </div>
                          )}
                          <div className="mt-1 d-flex gap-3">
                            <b className="text-start">Network Fee:</b>
                            <div className="flex-grow-1 text-end text-break">{item.payloadFee} ALGO</div>
                          </div>
                        </div>
                        <BorderDivider></BorderDivider>
                        <div>
                          {item.payloadAssetID && (
                            <div className="d-flex gap-3">
                              <b className="text-start">Asset:</b>
                              <div className="flex-grow-1 text-end text-break">
                                {item.payloadAssetUnitName} ({item.payloadAssetID})
                              </div>
                            </div>
                          )}

                          {item.payloadFrom && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">From :</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadFrom}</div>
                            </div>
                          )}

                          {item.payloadAppID && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">App ID: </b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadAppID}</div>
                            </div>
                          )}

                          {item.payloadTo && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">To :</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadTo}</div>
                            </div>
                          )}

                          {item.payloadClawbackAddress && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">Clawback:</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadClawbackAddress}</div>
                            </div>
                          )}

                          {item.payloadManagerAddress && item.payloadType != "asset-create" && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">Manager:</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadManagerAddress}</div>
                            </div>
                          )}

                          {item.payloadFreezeAddress && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">Freeze:</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadFreezeAddress}</div>
                            </div>
                          )}

                          {item.payloadAssetName && (
                            <div className="mt-1 d-flex gap-3">
                              <b className="text-start">Asset:</b>
                              <div className="flex-grow-1 text-end text-break">
                                {item.payloadAssetName} {item.payloadAssetID && `(${item.payloadAssetID})`}
                              </div>
                            </div>
                          )}
                          <div className="d-flex gap-3 mt-2">
                            <div
                              className="text-decoration-underline"
                              style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
                              role="button"
                              onClick={() => {
                                setShowLogicSig(true);
                                setLogicSig(JSON.stringify(rawTxns[i], undefined, 2));
                              }}
                            >
                              Show Raw Transaction
                            </div>
                          </div>
                        </div>
                      </div>
                    </Accordion.Collapse>
                  </div>
                </Accordion>
              );
            })}
          </div>
        </div>
      </div>
    </Collapse>
  );
}

const ModalDappSigning: React.FC<Props> = ({ showSigningModal, setShowSigningModal }: Props) => {
  const { signTransactions, sendTransactions, activeAccount, isReady } = useWallet();
  const { handleCreateSafeDappPtxn, handleSignDappPtxnWithLedger } = useDappPtxn();
  const { appConnectors } = useAppConnectors();
  const { sidebarLedgers } = useSidebar();
  const [detail, setDetail] = useState<DappRequest | null>(null);
  const [showModalPendingTx, setShowModalPendingTx] = useState(false);
  const selectedAccount = useAppSelector(getSelectedAccount);
  const [isConnectingLedger, setIsConnectingLedger] = useState(false);
  const [isLedgerError, setIsLedgerError] = useState(false);
  const [showTxnDetail, setShowTxnDetail] = useState(false);
  const [showLogicSig, setShowLogicSig] = useState(false);
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [logicSig, setLogicSig] = useState("");
  const { handlePtxnAction } = usePtxnActions();
  const [stepProgress, setStepProgress] = useState(1);
  const [responseModalShow, setResponseModalShow] = useState(false);
  const [typeModal, setTypeModal] = useState("success-ptxn");
  const [successTxId, setSuccessTxId] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [dataModal, setDataModal] = useState<DataModal>({
    title: "Success",
    type: "success",
    txHash: "",
  });
  let signer: LedgerAccount | Account | null = useAppSelector(getSigner);
  const [appConnector, setAppConnector] = useState<AppConnectorV2>();
  const [v1appConnector, setV1AppConnector] = useState<AppConnector>();
  const [payloadGroupId, setPayloadGroupId] = useState("");
  const [decodedPayload, setDecodedPayload] = useState<algosdk.Transaction[]>([]);
  const ptxnDataSelected = useAppSelector(getPtxnData);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { connect } = useLedger();
  const [ptxnCreated, setPtxnCreated] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isReady) return;

      // get payload details
      const detail = JSON.parse(localStorage.getItem(dapp.DAPP_REQUEST_DETAILS) || "") as DappRequest;
      const decodedPl: algosdk.Transaction[] = [];
      detail?.payload.map((item: any) => {
        const decodedTxn = algosdk.decodeUnsignedTransaction(Buffer.from(item.txn, "base64"));
        decodedPl.push(decodedTxn);

        // Display group ID
        if (decodedTxn.group !== undefined) {
          const groupId = decodedTxn.group.toString("base64");
          setPayloadGroupId(groupId);
        }
      });

      // get parsed payload
      detail.parsedPayload = await ss.parsePendingTxnPayload(decodedPl);

      // to display raw txn in the modal
      setDecodedPayload(decodedPl);

      setDetail(detail);
      if (showSigningModal === true) {
        if (detail?.safe?.address === selectedAccount?.address || detail?.ledger?.address === selectedAccount?.address) {
          setShowModalPendingTx(true);
        } else {
          setShowModalPendingTx(false);
        }
      }

      // set v2 connector - this is the wc v2 connector meant for the safe / ledger
      let connectedAddr = null;
      if (detail?.safe !== undefined) {
        connectedAddr = detail.safe.address;
      } else if (detail?.ledger !== undefined) {
        connectedAddr = detail.ledger.address;
      }
      const appCon = appConnectors.get(connectedAddr as string) as AppConnectorV2;

      if (appCon === undefined) {
        throw new Error(errors.ERR_APP_CONNECTOR_NOT_FOUND);
      }
      setAppConnector(appCon);

      // set v1 connector - this is the wc v1 connector meant for the connected dapp
      const matchingAppConnector = await DappService.getConnectedDapp(appCon, detail.topic);
      if (matchingAppConnector instanceof AppConnector) {
        setV1AppConnector(matchingAppConnector);
      }
    };

    init();
  }, [isReady]);

  function closeModal() {
    setShowModalPendingTx(false);
  }

  function closeAllModal() {
    setShowSigningModal(false);
    setShowModalPendingTx(false);
  }

  const submit = async () => {
    setPtxnCreated(false);
    setIsLedgerError(false);
    if (!detail) {
      setLoadingModalShow(false);
      setTypeModal("fail");
      setErrorDetails(errors.ERR_SUBMIT_DAPP_DATA);
      setResponseModalShow(true);
    }

    let response: any;
    if (detail?.safe !== undefined) {
      if (!signer) {
        setLoadingModalShow(false);
        setTypeModal("fail");
        setErrorDetails(errors.ERR_NO_AVAILABLE_SIGNERS);
        setResponseModalShow(true);
      }

      if (activeAccount && signer?.address === activeAccount.address) {
        signer = activeAccount;
      } else {
        const safeLedgerSigner = sidebarLedgers.find((acc: SidebarAccount) => signer && acc.address === signer.address);
        if (safeLedgerSigner !== undefined && safeLedgerSigner.ledgerAddress !== undefined) {
          signer = await ls.getAccount(safeLedgerSigner.ledgerAddress, safeLedgerSigner.address, safeLedgerSigner.name);
        }
      }
      if (signer?.hasOwnProperty("ledgerAddress")) {
        try {
          setIsConnectingLedger(true);
          const transport = await connect();

          if (transport === undefined) {
            setIsLedgerError(true);
            setIsConnectingLedger(false);

            return;
          } else {
            setIsConnectingLedger(false);
          }
        } catch (error) {
          setIsLedgerError(true);
          setIsConnectingLedger(false);

          return;
        }
      } else {
        setStepProgress(1);
      }
      closeModal();

      // is safe signer online
      setLoadingModalShow(true);

      if (signer === undefined) {
        setLoadingModalShow(false);
        setTypeModal("fail");
        setErrorDetails(errors.ERR_NO_AVAILABLE_SIGNERS);
        setResponseModalShow(true);
      }

      // pass in signer, sign and send txn
      const safe = detail.safe as Safe;
      try {
        if (signer) {
          setStepProgress(2);

          const { res, lsig_address } = await handleCreateSafeDappPtxn(
            safe,
            signer,
            detail.payload,
            signTransactions,
            sendTransactions,
            detail.topic,
            detail.id,
            detail.metadata
          );
          response = res;

          const safePendingTxns = await ss.getSafePendingTransactions(safe, signer.address);
          const ptxnRecord = safePendingTxns.find((ptxn) => ptxn.lsig_address === lsig_address);

          if (ptxnRecord === undefined) {
            setLoadingModalShow(false);
            setTypeModal("fail");
            setErrorDetails(errors.ERR_PTXN_DB);
            setResponseModalShow(true);
          } else {
            // update app connection status for this ptxn
            if (v1appConnector || appConnector) {
              ptxnRecord.dappConnected = true;
            }
            dispatch(setPtxnData(ptxnRecord));

            // remove pending dapp request from localstorage when ptxn is created
            localStorage.removeItem(dapp.DAPP_REQUEST_DETAILS);
          }

          setStepProgress(3);
          setTypeModal("success-ptxn");
          setSuccessTxId(response?.txId || "");
          setDataModal({
            type: "success",
            txHash: response?.txId || "",
          });
          setResponseModalShow(true);

          // this flag prevents modal from closing the dapp connection, should the initiator require other signers to authorize the ptxn
          setPtxnCreated(true);
        }
      } catch (error: any) {
        setLoadingModalShow(false);
        setTypeModal("fail");
        setErrorDetails(error?.message);
        setDataModal({
          type: "fail",
          errorDetails: error?.message,
        });
        setResponseModalShow(true);
      }
    } else if (detail?.ledger !== undefined) {
      try {
        const transport = await connect();

        if (transport === undefined) {
          setIsLedgerError(true);
          setIsConnectingLedger(false);
          return;
        } else {
          setIsConnectingLedger(false);
        }
      } catch (error) {
        setIsLedgerError(true);
        setIsConnectingLedger(false);

        return;
      }

      closeModal();

      setStepProgress(1);
      setLoadingModalShow(true);
      setIsConnectingLedger(false);

      // get ledger account to sign
      const ledgerSigner = detail.ledger as LedgerAccount;
      try {
        // sign dapp txns with the Ledger account directly
        const signedData = await handleSignDappPtxnWithLedger(ledgerSigner, detail.payload);
        setStepProgress(2);

        // send response to dapp upon submitting signed txns
        if (signedData && appConnector !== undefined) {
          // approve request with v1 or v2 connector
          if (detail.wcVersion === 1 && v1appConnector !== undefined) {
            await v1appConnector.approveRequest(detail.id, signedData);
          } else {
            await appConnector.approveRequest(detail.id, detail.topic, signedData);
          }
        }
        setLoadingModalShow(false);
        setStepProgress(3);
        setTypeModal("success-ptxn");
        setSuccessTxId(response?.txId || "");
        setDataModal({
          type: "success",
          txHash: response?.txId || "",
        });
        setResponseModalShow(true);
      } catch (error: any) {
        setLoadingModalShow(false);
        setTypeModal("fail");
        setErrorDetails(error?.message);
        setDataModal({
          type: "fail",
          errorDetails: error?.message,
        });
        setResponseModalShow(true);
      }
    }
  };

  const makeid = (length: number) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const cancel = async () => {
    // remove pending dapp request
    localStorage.removeItem(dapp.DAPP_REQUEST_DETAILS);

    // no data to return or ptxn is already created and modal can be closed
    if (!detail || ptxnCreated) {
      closeAllModal();
      return;
    }

    // send rejection to dapp
    if (detail.wcVersion === 1 && v1appConnector !== undefined) {
      await v1appConnector.rejectRequest(detail.id);
    }

    if (detail.wcVersion === 2 && appConnector) {
      await appConnector.rejectRequest(detail.id, detail.topic);
    }

    closeAllModal();
  };

  const txAction = async (item: PendingTxn, action: string) => {
    setLoadingModalShow(true);
    setStepProgress(1);
    const safe = detail?.safe as Safe;
    try {
      const { res: executeRes } = await handlePtxnAction(
        safe,
        signer,
        signTransactions,
        sendTransactions,
        item,
        action,
        setPtxnData,
        setStepProgress,
        setTypeModal,
        setLoadingModalShow,
        setTypeModal,
        setErrorDetails,
        setResponseModalShow,
        appConnector
      );

      // clear signing details if execution is successful
      if (executeRes) {
        localStorage.removeItem(dapp.DAPP_REQUEST_DETAILS);
      }

      setStepProgress(3);
      setLoadingModalShow(false);

      setDataModal({
        type: "success",
        txHash: executeRes?.res?.txId || executeRes?.response?.txId || "",
      });

      setResponseModalShow(true);
    } catch (e: any) {
      setLoadingModalShow(false);
      setTypeModal("fail");
      setErrorDetails(e?.message);
      setDataModal({
        type: "fail",
        errorDetails: e?.message,
      });
      setResponseModalShow(true);
    }
  };

  const handleExecute = async (item: PendingTxn) => txAction(item, "execute");

  return (
    <>
      <ModalTx
        modalStatus={responseModalShow}
        type={typeModal}
        txHash={successTxId ? successTxId : dataModal?.txHash}
        errorDetails={errorDetails}
        onExecute={() => {
          setResponseModalShow(false);
          handleExecute(ptxnDataSelected);
        }}
        onHide={() => {
          if (typeModal === "success-ptxn" || typeModal === "success") {
            router.push({
              pathname: "/dashboard",
              query: { tab: 1 },
            });
            setResponseModalShow(false);
            cancel();
          } else {
            setResponseModalShow(false);
            cancel();
          }
        }}
      />
      <ModalLoadingTx
        title="Transaction is Processing"
        items={itemsModal}
        modalStatus={loadingModalShow}
        step={stepProgress}
        disabledFooter={detail?.ledger !== undefined}
      />
      <ModalGeneral
        title="Create Pending Transaction"
        onHide={() => cancel()}
        modalStatus={showModalPendingTx}
        fullscreenSm
        backdrop="static"
        isPaddingTitleFixed
      >
        {
          <div className={styles.modal}>
            {!showTxnDetail ? (
              <div className={styles["container"]}>
                <div>
                  {
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.icon}
                      alt="icon-metadata"
                      src={detail?.metadata.icons.length > 0 ? detail?.metadata.icons[0] : ""}
                    />
                  }
                </div>
                <div>
                  <b>{detail?.metadata.name}</b> #{detail?.id}
                </div>
                <a target="_blank" rel="noreferrer noopener" href={detail?.metadata.url}>
                  {detail?.metadata.url}
                </a>
                {detail?.safe !== undefined && (
                  <div>
                    You are now creating a pending transaction for <br />
                    co-signers&apos; approval. When executed, the Safe will <br />
                    send the following transaction(s) back <br />
                    to the Dapp:
                  </div>
                )}
                <div className={styles["tx-box"]}>
                  <div>
                    <b>Multiple Pending Transaction ({detail?.payload.length} Txns)</b>
                  </div>
                  {payloadGroupId && (
                    <div className="d-flex flex-column">
                      {" "}
                      <span>Group ID :</span> <span style={{ wordBreak: "break-all" }}>{payloadGroupId}</span>
                    </div>
                  )}
                  <div onClick={() => setShowTxnDetail(true)} className={styles["tx-details-link"]}>
                    Show Transaction Details
                  </div>
                </div>
              </div>
            ) : showLogicSig ? (
              <div className={styles["container"]}>
                <div className={styles["header-container"]}>
                  <div onClick={() => setShowLogicSig(false)} className={styles["back-button"]}>
                    <ArrowLeftSmall />
                  </div>
                  <div>
                    <b>Raw Transaction</b>
                  </div>
                  <div>
                    <div
                      onClick={() => {
                        copyText(logicSig);
                        toast("Copied", {
                          position: "top-right",
                          autoClose: 1000,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          theme: "light",
                          type: "info",
                          toastId: makeid(4),
                        });
                      }}
                      className={styles["tx-details-link"]}
                    >
                      copy
                    </div>
                  </div>
                </div>
                <div className={styles["pre-container"]}>
                  <pre>{logicSig}</pre>
                </div>
              </div>
            ) : (
              <div className={styles["container"]}>
                <div className={styles["header-container-multiple"]}>
                  <div onClick={() => setShowTxnDetail(false)} className={styles["back-button"]}>
                    <ArrowLeftSmall />
                  </div>
                  <div className={styles["header"]}>
                    <b>Multiple Pending Transaction ({detail?.payload.length} Txns)</b>
                  </div>
                </div>
                <TxnAccordion
                  detail={detail}
                  setShowLogicSig={setShowLogicSig}
                  setLogicSig={setLogicSig}
                  rawTxns={decodedPayload}
                />
              </div>
            )}
            <div>
              {(detail?.ledger !== undefined || signer?.hasOwnProperty("ledgerAddress")) && (
                <div className={styles.ledgerContent}>
                  <div className={styles.imgWrapper}>
                    {isLedgerError ? (
                      <img src="images/icon-ledger-red.svg" style={{ width: "100%", height: "100%" }} alt="icon" />
                    ) : !isConnectingLedger ? (
                      <img src="images/icon-ledger.svg" style={{ width: "100%", height: "100%" }} alt="icon" />
                    ) : (
                      <LedgerLoader />
                    )}
                  </div>
                  <div className={styles.textDesc}>
                    {isLedgerError ? (
                      <>
                        <p style={{ color: "#E15173" }}>
                          <span className={styles.textBold}>Connecting to Ledger Failed</span>
                        </p>
                        <p style={{ color: "#E15173" }}>{errors.ERR_LEDGER_NOT_CONNECTED}</p>
                      </>
                    ) : isConnectingLedger ? (
                      <>
                        <p>
                          <span className={styles.textBold}>Connecting to Ledger</span>
                        </p>
                        <p>Connect and sign transaction through your ledger device.</p>
                      </>
                    ) : (
                      <p>
                        <span>Connect</span> your Ledger to your computer, unlock and choose <span>Algorand app</span> before
                        continue.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={styles["btn-container"]}>
              <Button cancel onClick={async () => await cancel()} className={styles.btn}>
                Cancel
              </Button>
              <Button primary className={styles.btn} onClick={submit} disabled={isConnectingLedger}>
                {isConnectingLedger ? "CONNECTING TO LEDGER..." : "Confirm"}
              </Button>
            </div>
          </div>
        }
      </ModalGeneral>
    </>
  );
};

export default ModalDappSigning;
