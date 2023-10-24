import styles from "frontend/components/UI/Accordion/Accordion.module.scss";
// import Collapse from 'react-bootstrap/Collapse';

import Header from "frontend/components/Header";
import ArrowLeft from "frontend/components/Icons/ArrowLeft";
import MoneyReceive from "frontend/components/Icons/MoneyReceive";
import MoneySend from "frontend/components/Icons/MoneySend";
import Reverse from "frontend/components/Icons/Reverse";
import Snow from "frontend/components/Icons/Snow";
import Pencil from "frontend/components/Icons/Pencil";
import AddThree from "frontend/components/Icons/AddThree";
import AddDouble from "frontend/components/Icons/AddDouble";
import UpdateRotation from "frontend/components/Icons/UpdateRotation";
import ClearFormat from "frontend/components/Icons/ClearFormat";
import DeleteKey from "frontend/components/Icons/DeleteKey";
import InternalTransmission from "frontend/components/Icons/InternalTransmission";
import ExternalTransmission from "frontend/components/Icons/ExternalTransmission";
import NewAsset from "frontend/components/Icons/NewAsset";
import DeleteSweep from "frontend/components/Icons/DeleteSweep";
import Key from "frontend/components/Icons/Key";
import More from "frontend/components/Icons/More";
import Remove from "frontend/components/Icons/Remove";
import People from "frontend/components/Icons/People";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import Done from "frontend/components/Icons/Done";
import Close from "frontend/components/Icons/Close";
import Add from "frontend/components/Icons/Add";
import Delete from "frontend/components/Icons/Delete";
import Apps from "frontend/components/Icons/Apps";

type statuses = "need-confirm" | "reject-ready" | "confirm" | "ready" | "success" | "expired";
type types =
  | "asset-send"
  | "asset-clawback"
  | "asset-freeze"
  | "asset-new"
  | "asset-create"
  | "asset-modify"
  | "asset-destroy"
  | "other"
  | "asset-remove"
  | "remove"
  | "receive"
  | "key-registration"
  | "delete"
  | "remove-safe"
  | "dapp"
  | "dapp-create"
  | "dapp-update"
  | "dapp-delete"
  | "dapp-optin"
  | "dapp-closeout"
  | "dapp-clear";

// type coins = "plus" | "minus" | "weth";

interface Props {
  status: statuses;
  type: types;
  coinValue?: string;
  children?: React.ReactNode;
  approvers?: number;
  totalPeople?: number;
  isUrgent?: boolean;
  assetUnitName?: string;
  assetId?: string;
  assetAmmout?: string | boolean;
  expiresTime?: string;
  seqNumb?: string | number;
  dappName?: string;
  safeId?: number;
  classList?: string;
  isGreyOut?: boolean;
  handleAccordionOpen: () => void;
  open: boolean;
}

const Accordion: React.FC<Props> = ({
  status,
  type,
  coinValue,
  children,
  isUrgent,
  assetUnitName,
  assetId,
  assetAmmout,
  approvers,
  totalPeople,
  expiresTime,
  seqNumb,
  dappName,
  safeId,
  classList,
  isGreyOut,
  handleAccordionOpen,
  open,
}: Props) => {
  const typeImg = () => {
    switch (type) {
      case "asset-send":
        return <MoneySend />;
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
      case "asset-remove":
        return <DeleteSweep />;
      case "key-registration":
        return <Key />;
      case "other":
        return <More />;
      case "receive":
        return <MoneyReceive />;
      case "delete":
      case "remove-safe":
        return <Delete />;
      case "dapp":
        return <Apps />;
      case "dapp-closeout":
        return <ExternalTransmission />;
      case "dapp-create":
        return <AddDouble />;
      case "dapp-update":
        return <UpdateRotation />;
      case "dapp-delete":
        return <DeleteKey />;
      case "dapp-optin":
        return <InternalTransmission />;
      case "dapp-clear":
        return <ClearFormat />;
      default:
        break;
    }
  };

  const typeText = () => {
    const dapp = dappName ? (dappName.length > 15 ? dappName.substring(0, 15) + "..." : dappName) : "Dapp";

    switch (type) {
      case "asset-send":
        return "Send Asset";
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
      case "asset-new":
        return "New Asset";
      case "asset-remove":
        return "Remove Asset";
      case "key-registration":
        return "Key Registration";
      case "other":
        return "Others";
      case "receive":
        return "Receive";
      case "delete":
        return "Delete";
      case "remove-safe":
        return "Remove Safe";
      case "dapp":
        return dapp;
      case "dapp-create":
        return `Create App`;
      case "dapp-update":
        return `Update App`;
      case "dapp-delete":
        return `Delete App`;
      case "dapp-optin":
        return `Opt-in App`;
      case "dapp-closeout":
        return `App Close Out`;
      case "dapp-clear":
        return `App Clear State`;
      default:
        break;
    }
  };

  const dappInclude = type.includes("dapp");

  return (
    <>
      <div
        className={`
        ${styles.boxAccordion}
        ${open ? styles.active : ""}
        ${isGreyOut && styles.isGreyOut}
        ${isUrgent && styles.urgent}        
        ${type == "delete" || type == "remove-safe" ? styles.bgDelete : ""}
        `}
      >
        {safeId ? <div className={styles["safe-id"]}>Safe ID: {safeId}</div> : ""}
        <div
          className={`
            ${styles.accordionItem}
            ${
              status == "need-confirm" && type != "delete" && type != "remove-safe" ? styles.onNeed : ""
            }                           
          `}
          onClick={handleAccordionOpen}
          aria-controls="collapse-items"
          aria-expanded={open}
        >
          <div className={styles.boxNum}>
            {/* { type != 'delete' && type != 'co-owner' && type != 'main-owner' && type != 'dapp' && type != 'safe-creation' &&
            <span>236</span>
            } */}
            <span>{seqNumb}</span>
          </div>
          <div className={styles.accordionItemWrap}>
            <div
              className={`${styles.boxType} ${
                type == "delete" || type == "remove-safe" ? styles.pink : ""
              } d-flex align-items-center gap-1`}
            >
              {typeImg()}
              <span>{typeText()}</span>
            </div>
            <div className={`${styles.boxCoin}`}>
              {type != "delete" &&
                type != "remove-safe" &&
                !dappInclude &&
                type != "asset-freeze" &&
                type != "asset-destroy" &&
                type != "asset-create" &&
                type !== "key-registration" && (
                  <div className="d-flex align-items-center gap-1">
                    {type != "asset-clawback" && (
                      <>
                        {/* {coinValue == 'Receive' && <Add />}
                      {coinValue == 'Send' && <Remove />} */}
                        {coinValue !== "Send" && coinValue !== "Receive" && coinValue}
                      </>
                    )}
                    <span>{assetId ? `${assetUnitName ?? "-"} (${assetId})` : `${assetAmmout} ${assetUnitName}`}</span>
                  </div>
                )}
            </div>

            <div className={`${styles.boxDate}`}>{status === "expired" ? "" : expiresTime ? "Expires " + expiresTime : ""}</div>
          </div>
          <div className={`${styles.accordionItemWrap} ${styles.wrapMob}`}>
            <div className={`${styles.boxMember} d-flex align-items-center gap-1`}>
              <People />
              <span>
                {approvers} of {totalPeople}
              </span>
            </div>
            <div
              className={`
              ${styles.boxStatus}
              ${status == "need-confirm" || "reject-ready" || status == "expired" ? styles.pink : ""}
              ${status == "confirm" ? styles.orange : ""}
              ${status == "success" || status == "ready" ? styles.green : ""} 
              align-items-center
              `}
            >
              <div className={styles.dot}></div>
              {status == "need-confirm" && <span>Need confirmation</span>}
              {status == "confirm" && <span>Pending</span>}
              {status == "ready" && <span>Ready</span>}
              {status == "reject-ready" && <span>Reject Ready</span>}
              {status == "success" && <span>Success</span>}
              {status == "expired" && <span>Expired</span>}
            </div>
            <div className={`${styles.boxConfirm}`}>
              <div className={`${styles.green} d-flex align-items-center gap-1`}>
                <Done />
                <span>Confirm</span>
              </div>
              <div className={`${styles.pink} d-flex align-items-center gap-1`}>
                <Close />
                <span>Reject</span>
              </div>
            </div>
          </div>
          <div className={`${styles.boxArrow} ${open == true ? styles.active : ""}`}>
            <ArrowDown />
          </div>
        </div>
        <div className={`${styles.collapseItems} ${open ? styles.show : ""}`}>
          <div className={`d-block d-lg-none`}>
            <div className={`${styles.bgHeaderCollapse}`}>
              <Header />
            </div>
            <div className={styles["top-nav"]}>
              <div className="d-flex" onClick={handleAccordionOpen}>
                <ArrowLeft></ArrowLeft>
              </div>
              <div className={styles.title}>TRANSACTION DETAILS</div>
            </div>
            <div
              className={`
                ${styles.accordionItem}
                ${
                  status == "need-confirm" && type != "delete" && type != "remove-safe" ? styles.onNeed : ""
                }                           
              `}
            >
              <div className={styles.boxNum}>{type != "delete" && type != "remove-safe" && <span>{seqNumb}</span>}</div>
              <div className={styles.accordionItemWrap}>
                <div
                  className={`${styles.boxType} ${
                    type == "delete" || type == "remove-safe" ? styles.pink : ""
                  } d-flex align-items-center gap-1`}
                >
                  {typeImg()}
                  <span>{typeText()}</span>
                </div>
                <div className={`${styles.boxCoin}`}>
                  {type != "delete" &&
                    type != "remove-safe" &&
                    !dappInclude &&
                    type != "asset-freeze" &&
                    type != "asset-destroy" &&
                    type != "asset-create" &&
                    type !== "key-registration" && (
                      <div className="d-flex align-items-center gap-1">
                        {coinValue == "Receive" && <Add />}
                        {coinValue == "Send" && <Remove />}
                        {coinValue !== "Send" && coinValue !== "Receive" && coinValue}
                        <span>
                          {assetUnitName} {assetId ? `(${assetId})` : assetAmmout}
                        </span>
                      </div>
                    )}
                </div>
                <div className={`${styles.boxDate}`}>
                  {status === "expired" ? "" : expiresTime ? "Expires " + expiresTime : ""}
                </div>
              </div>
              <div className={`${styles.accordionItemWrap} ${styles.wrapMob}`}>
                <div className={`${styles.boxMember} d-flex align-items-center gap-1`}>
                  <People />
                  <span>
                    {approvers} of {totalPeople}
                  </span>
                </div>
                <div
                  className={`
                  ${styles.boxStatus}
                  ${status == "need-confirm" || status == "reject-ready" || status == "expired" ? styles.pink : ""}
                  ${status == "confirm" ? styles.orange : ""}
                  ${status == "success" || status == "ready" ? styles.green : ""}              
                  align-items-center
                  `}
                >
                  <div className={styles.dot}></div>
                  {status == "need-confirm" && <span>Need confirmation</span>}
                  {status == "confirm" && <span>Pending</span>}
                  {status == "ready" && <span>Ready</span>}
                  {status == "reject-ready" && <span>Reject Ready</span>}
                  {status == "success" && <span>Success</span>}
                  {status == "expired" && <span>Expired</span>}
                </div>
                <div className={`${styles.boxConfirm}`}>
                  <div className={`${styles.green} d-flex align-items-center gap-1`}>
                    <Done />
                    <span>Confirm</span>
                  </div>
                  <div className={`${styles.pink} d-flex align-items-center gap-1`}>
                    <Close />
                    <span>Reject</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${styles.boxContent} ${
              type == "delete" || type == "remove-safe" ? styles.borderDelete : styles.borderActive
            }`}
          >
            {children}
          </div>
        </div>
      </div>
      <div
        className={`        
        ${classList ? classList : "d-none"}        
        `}
      ></div>
    </>
  );
};

export default Accordion;
