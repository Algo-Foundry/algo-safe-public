import styles from "./AppTransactionDetail.module.scss";
import BorderDivider from "frontend/components/UI/BorderDivider";
import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import { useContext, useState, useEffect } from "react";
import { AccordionContext } from "react-bootstrap";
import { Collapse } from "react-bootstrap";
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
import InternalTransmission from "frontend/components/Icons/InternalTransmission";
import ExternalTransmission from "frontend/components/Icons/ExternalTransmission";
import ModalLogicSignature from "frontend/components/Dashboard/Content/Transactions/ModalLogicSignature";

interface Props {
  data: any;
  dappType?: string;
  noAccordionTitle?: boolean;
}

interface TxnItem {
  id: number;
  payloadType: string;
  payloadDirection: string;
  displayAmount: number;
  payloadAssetUnitName: string;
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

      <div className="flex-grow-1">{title(typeTxns)}</div>

      <div className={`${isDefinedTxnType(typeTxns) ? "d-flex align-items-center" : "d-none"}`}>
        <div>
          {typeTxns !== "asset-optin" && txn.displayAmount} {txn.payloadAssetUnitName}
        </div>
      </div>

      <div className={`${isCurrentEventKey ? "toggle-arrow-active" : "toggle-arrow-inactive"} d-flex`}>
        <ArrowDown />
      </div>
    </div>
  );
}

const AppTransactionDetail: React.FC<Props> = ({ data, noAccordionTitle = false }: Props) => {
  const [showTxnDetail, setShowTxnDetail] = useState(false);
  const [modalLogicSignature, setModalLogicSignature] = useState({
    status: false,
    title: "",
    isRawTxn: false,
    value: "",
  });

  useEffect(() => {
    setShowTxnDetail(noAccordionTitle);
  }, [noAccordionTitle]);

  return (
    <div className={styles["app-transaction-detail"]}>
      <ModalLogicSignature
        modalStatus={modalLogicSignature.status}
        title={modalLogicSignature.title}
        lsigValue={modalLogicSignature.value}
        isRawTxn={modalLogicSignature.isRawTxn}
        onHide={() => {
          setModalLogicSignature({
            status: false,
            isRawTxn: false,
            title: "",
            value: "",
          });
        }}
      />
      {!noAccordionTitle ? (
        <div role="button" className={`${styles["show-txn-detail"]}`} onClick={() => setShowTxnDetail(!showTxnDetail)}>
          Show Transaction Details
          <div
            className={`
              ${showTxnDetail ? "toggle-arrow-active" : "toggle-arrow-inactive"} d-flex text-dark
            `}
          >
            <ArrowDown />
          </div>
        </div>
      ) : (
        <div className={`${styles["show-txn-detail-text"]} d-none d-lg-block`}>Transactions Details</div>
      )}
      <Collapse in={showTxnDetail}>
        <div className="mt-2">
          <div className={styles["body-2"]}>
            <div className={styles["txn-container"]}>
              {data?.parsedPayload?.map((item: any, i: any) => {
                return (
                  <Accordion key={"item-" + i}>
                    <div className={styles["txn-card"]}>
                      <TxnHeader txn={item}></TxnHeader>

                      <Accordion.Collapse eventKey={String(item.safe_app_id)}>
                        <div className={styles["txn-body"]}>
                          <BorderDivider></BorderDivider>

                          <div>
                            {item.payloadAssetID && (
                              <div className="d-flex gap-3">
                                <b>Asset:</b>
                                <div className="flex-grow-1 text-end text-break">
                                  {item.payloadAssetUnitName} ({item.payloadAssetID})
                                </div>
                              </div>
                            )}

                            {item.payloadFrom && (
                              <div className="mt-1 d-flex gap-3">
                                <b>From :</b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadFrom}</div>
                              </div>
                            )}

                            {item.payloadAppID && (
                              <div className="mt-1 d-flex gap-3">
                                <b>App ID: </b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadAppID}</div>
                              </div>
                            )}

                            {item.payloadTo && (
                              <div className="mt-1 d-flex gap-3">
                                <b>To :</b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadTo}</div>
                              </div>
                            )}

                            {item.payloadClawbackAddress && (
                              <div className="mt-1 d-flex gap-3">
                                <b>Clawback:</b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadClawbackAddress}</div>
                              </div>
                            )}

                            {item.payloadManagerAddress && item.payloadType != "asset-create" && (
                              <div className="mt-1 d-flex gap-3">
                                <b>Manager:</b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadManagerAddress}</div>
                              </div>
                            )}

                            {item.payloadFreezeAddress && (
                              <div className="mt-1 d-flex gap-3">
                                <b>Freeze:</b>
                                <div className="flex-grow-1 text-end text-break">{item.payloadFreezeAddress}</div>
                              </div>
                            )}

                            <div className="mt-1 d-flex gap-3">
                              <b>Network Fee:</b>
                              <div className="flex-grow-1 text-end text-break">{item.payloadFee} ALGO</div>
                            </div>

                            <div className="d-flex gap-3 mt-2">
                              <div
                                className="text-decoration-underline"
                                style={{ color: "#258BAC", fontWeight: "500", width: "fit-content" }}
                                role="button"
                                onClick={() =>
                                  setModalLogicSignature({
                                    status: true,
                                    isRawTxn: true,
                                    title: "Raw Transaction",
                                    value: JSON.stringify(data.payload[i], undefined, 2),
                                  })
                                }
                              >
                                Raw Transaction
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
    </div>
  );
};

export default AppTransactionDetail;
