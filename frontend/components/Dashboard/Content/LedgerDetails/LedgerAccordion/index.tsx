import styles from "./LedgerAccordion.module.scss";
import { useState, useEffect } from "react";

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
import Delete from "frontend/components/Icons/Delete";
import Apps from "frontend/components/Icons/Apps";
import { microalgosToAlgos } from "algosdk";
import ItemResponsive from "./ItemResponsive";
import ArrowLeftDown from "frontend/components/Icons/ArrowLeftDown";

type types =
  | "asset-send"
  | "asset-receive"
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

interface Props {
  type: types | string;
  children?: React.ReactNode;
  dappName?: string;
  addressTx: string;
  appId?: number;
  asaId?: number;
  amount?: number;
  receiveAdr?: string;
  fee?: number;
  assetDetail?: any;
  date: string;
  className?: string;
  handleAccordionOpen: () => void;
  open: boolean;
}

const LedgerAccordion: React.FC<Props> = ({
  type,
  children,
  dappName,
  addressTx,
  appId,
  asaId,
  receiveAdr,
  amount,
  assetDetail,
  fee,
  date,
  className,
  handleAccordionOpen,
  open,
}: Props) => {
  const [detailAsset, setDetailAsset] = useState({
    assetName: "ALGO",
    decimal: 6,
  });

  const typeImg = () => {
    switch (type) {
      case "asset-send":
        return <MoneySend />;
      case "asset-receive":
        return <ArrowLeftDown />;
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
      case "asset-receive":
        return "Receive Asset";
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

  const getMaxDecimal = (num: number) => {
    const algoNumber = microalgosToAlgos(num).toFixed(3);

    return parseFloat(algoNumber);
  };

  useEffect(() => {
    if (assetDetail !== undefined) {
      setDetailAsset({
        assetName: assetDetail["unit-name"],
        decimal: assetDetail.decimals,
      });
    }
  }, []);

  return (
    <>
      <div
        className={`
        ${styles.boxAccordion}
        ${open && styles.active}
        `}
      >
        <ItemResponsive
          addressTx={addressTx}
          amount={amount as number}
          appId={appId}
          asaId={asaId as number}
          date={date}
          detailAsset={detailAsset}
          fee={fee}
          getMaxDecimal={getMaxDecimal}
          handleAccordionOpen={handleAccordionOpen}
          open={open}
          receiveAdr={receiveAdr}
          type={type}
          typeImg={typeImg}
          typeText={typeText}
        />
        <div className={`${styles.collapseItems} ${open ? styles.show : ""}`}>
          <div className={`d-block d-lg-none`}>
            <div className={styles["top-nav"]}>
              <div className="d-flex" onClick={handleAccordionOpen}>
                <ArrowLeft></ArrowLeft>
              </div>
              <div className={styles.title}>TRANSACTION DETAILS</div>
            </div>
          </div>
          <div className={`${styles.boxContent}`}>{children}</div>
        </div>
      </div>
      <div
        className={`${className ? className : "d-none"}      
      `}
      ></div>
    </>
  );
};

export default LedgerAccordion;
