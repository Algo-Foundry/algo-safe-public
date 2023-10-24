import styles from "./AppTransactionDetailLedger.module.scss";
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
import AddIcon from "frontend/components/Icons/Add";
import RemoveIcon from "frontend/components/Icons/Remove";
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
import { microalgosToAlgos } from "algosdk";
import { uitypes } from "shared/constants";

interface Props {
  data: any;
  dappType?: string;
  noAccordionTitle?: boolean;
  allAsset?: any;
  addressTx: string;
}

const getMaxDecimal = (num: number) => {
  const algoNumber = microalgosToAlgos(num).toFixed(3);

  return parseFloat(algoNumber);
};

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

const getTxnAmountIcon = (payloadType: string) => {
  switch (payloadType?.toLowerCase()) {
    case "send":
      return <RemoveIcon />;
    case "receive":
      return <AddIcon />;
  }
};

const definedTxnType = ["send", "receive", "asset-optin"];

const isDefinedTxnType = (payloadType: string) => {
  return definedTxnType.includes(payloadType?.toLowerCase());
};

function TxnHeader({ txn, index, addressTx }: { txn: any; index: number; addressTx: string }) {
  const decoratedOnClick = useAccordionButton(String(String(index) + "-" + String(addressTx)));
  const { activeEventKey } = useContext(AccordionContext);
  const isCurrentEventKey = activeEventKey === String(String(index) + "-" + String(addressTx));
  let typeTxns;

  switch (txn["ui-type"]) {
    case "Pay":
    case uitypes.UI_SEND:
      typeTxns = "send";
      break;
    case uitypes.UI_RECEIVE_ASSET:
      typeTxns = "receive";
      break;
    case uitypes.UI_NEW_ASSET:
      typeTxns = "asset-new";
      break;
    case uitypes.UI_REMOVE_ASSET:
      typeTxns = "asset-destroy";
      break;
    case uitypes.UI_APP_CALL:
      typeTxns = "app-call";
      break;
    case uitypes.UI_OTHERS:
      typeTxns = "app-clear";
      break;
    default:
      typeTxns = "app-clear";
      break;
  }

  return (
    <div className={styles["txn-header"]} role="button" onClick={decoratedOnClick}>
      <div>{getTxnTypeIcon(typeTxns)}</div>

      <div className="flex-grow-1">{txn["ui-type"]}</div>

      <div
        className={`${isDefinedTxnType(typeTxns) ? "d-flex align-items-center" : "d-none"} ${
          typeTxns === "send" ? "foundry-pink" : "foundry-green"
        }`}
      >
        <div>{getTxnAmountIcon(typeTxns)}</div>

        <div>
          {txn.txn["tx-type"] === "pay" && `${getMaxDecimal(txn.txn["payment-transaction"].amount)} ALGO`}
          {txn.txn["tx-type"] === "axfer" && `${getMaxDecimal(txn.txn["asset-transfer-transaction"].amount)} ${txn.unitName}`}
        </div>
      </div>

      <div className={`${styles.walletIcon} ${isCurrentEventKey ? "toggle-arrow-active" : "toggle-arrow-inactive"} d-flex`}>
        <ArrowDown />
      </div>
    </div>
  );
}

const AppTransactionDetailLedger: React.FC<Props> = ({ data, allAsset, noAccordionTitle = false, addressTx }: Props) => {
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
      {data?.txn["inner-txns"] !== undefined && (
        <>
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
                  {data?.txn["inner-txns"].map((item: any, i: any) => {
                    let assetDetail;
                    let newItem = item;
                    if (item.txn["asset-transfer-transaction"] !== undefined) {
                      assetDetail = allAsset.find(
                        (asset: any) => asset.id === item.txn["asset-transfer-transaction"]["asset-id"]
                      );
                      newItem = {
                        ...newItem,
                        unitName: assetDetail["unit-name"] !== undefined ? assetDetail["unit-name"] : "ALGO",
                      };
                    }
                    return (
                      <Accordion key={"accordion" + String(i) + String(addressTx)}>
                        <div className={styles["txn-card"]}>
                          <TxnHeader txn={newItem} index={i} addressTx={addressTx}></TxnHeader>

                          <Accordion.Collapse eventKey={String(i) + "-" + String(addressTx)}>
                            <div className={styles["txn-body"]}>
                              <BorderDivider></BorderDivider>

                              <div>
                                {(item["ui-type"] === uitypes.UI_SEND ||
                                  item["ui-type"] === uitypes.UI_NEW_ASSET ||
                                  item["ui-type"] === uitypes.UI_RECEIVE_ASSET) &&
                                  item.txn["asset-transfer-transaction"] !== undefined && (
                                    <div className="d-flex gap-3">
                                      <b>Asset:</b>
                                      <div className="flex-grow-1 text-end text-break">
                                        {`${newItem.unitName ? newItem.unitName : "ALGO"} (${
                                          item.txn["asset-transfer-transaction"]["asset-id"]
                                        })`}
                                      </div>
                                    </div>
                                  )}

                                {item.txn.sender && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>From :</b>
                                    <div className="flex-grow-1 text-end text-break">{item.txn.sender}</div>
                                  </div>
                                )}
                                {item["ui-type"] === uitypes.UI_APP_CALL && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>App ID: </b>
                                    <div className="flex-grow-1 text-end text-break">
                                      {item.txn["application-transaction"]["application-id"]}
                                    </div>
                                  </div>
                                )}

                                {(item["ui-type"] === uitypes.UI_SEND || item["ui-type"] === uitypes.UI_RECEIVE_ASSET) && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>To :</b>
                                    <div className="flex-grow-1 text-end text-break">
                                      {item.txn["payment-transaction"] !== undefined
                                        ? item.txn["payment-transaction"]["receiver"]
                                        : item.txn["asset-transfer-transaction"].receiver}
                                    </div>
                                  </div>
                                )}

                                {assetDetail?.clawback !== undefined && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>Clawback:</b>
                                    <div className="flex-grow-1 text-end text-break">{assetDetail.clawback}</div>
                                  </div>
                                )}

                                {assetDetail?.manager !== undefined && item.payloadType != "asset-create" && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>Manager:</b>
                                    <div className="flex-grow-1 text-end text-break">{assetDetail.manager}</div>
                                  </div>
                                )}

                                {assetDetail?.freeze !== undefined && (
                                  <div className="mt-1 d-flex gap-3">
                                    <b>Freeze:</b>
                                    <div className="flex-grow-1 text-end text-break">{assetDetail.freeze}</div>
                                  </div>
                                )}

                                <div className="mt-1 d-flex gap-3">
                                  <b>Network Fee:</b>
                                  <div className="flex-grow-1 text-end text-break">{item.txn.fee}</div>
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
        </>
      )}
    </div>
  );
};

export default AppTransactionDetailLedger;
