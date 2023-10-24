import styles from "./TableAssetTransfer.module.scss";
import ArrowRightTbl from "frontend/components/Icons/ArrowRightTbl";
import InfoIcon from "frontend/components/Icons/Info";
import Button from "frontend/components/Button";
// import SafeService from "frontend/services/safe";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import moment from "moment";
import { useState } from "react";
// import { Transaction } from 'algosdk';
import { useAppSelector } from "frontend/redux/hooks";
import { getIsOwner } from "frontend/redux/features/migration/migrationSlice";
// import { getIsOwner, getMigrationActiveData } from "frontend/redux/features/migration/migrationSlice";
// import { convertToTxnBuilder } from 'shared/utils';
//import useSafeAuth from "frontend/hooks/useSafeAuth";

interface Props {
  assets?: Array<any>;
  testAction?: boolean;
  fetchData?: () => void;
  fetchMigration?: () => void;
}

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

const TableAssetTransfer: React.FC<Props> = ({ assets, fetchData, fetchMigration }: Props) => {
  // const ss = new SafeService();
  const isOwner = useAppSelector<any>(getIsOwner);
  // const migrationActiveData = useAppSelector<any>(getMigrationActiveData);

  //modal
  const [stepProgress, setStepProgress] = useState(1);
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [responseModalShow, setResponseModalShow] = useState(false);
  const [dataModal, setDataModal] = useState<DataModal>({
    title: "Success",
    type: "success",
    txHash: "",
    seqNumb: "",
  });
  const itemsModal = ["Creating ", "Processing", "Success"];

  // const { authenticateSigner } = useSafeAuth();

  const handeAction = async (item: any, action: string, step?: number) => {
    // TODO: update fn
    console.log(item, action, step);
    setLoadingModalShow(true);
    setStepProgress(step ? step + 1 : 1);
    setDataModal({
      type: "fail",
      errorDetails: "TODO",
    });

    // const addr = localStorage.SelectedAccount;
    // const unitName = item?.assetDetails?.params?.name
    // const assetID = item?.asset && Number(item?.asset['asset-id'])
    // const oldSafeID = migrationActiveData?.data?.from_safe
    // const newSafeID = migrationActiveData?.data?.to_safe
    // const migrationID = migrationActiveData.data.id

    // // fetch safes
    // const safe = await ss.getSafe(newSafeID);
    // const oldSafe = await ss.getSafe(oldSafeID);

    // let txn:Transaction[] = []
    // let initTxn:any;
    // let executingSafe;

    // switch (action) {
    //   case 'optin':
    // 		executingSafe = safe;
    //     initTxn = await ss.getAddAssetToSafePendingTxn(safe, addr, assetID);
    //     break;
    //   case 'transfer':
    // 		executingSafe = oldSafe;
    //     initTxn = await ss.getAssetCloseToPendingTxn(oldSafe, assetID, addr, safe.address);
    //     break;
    //   case 'transfer-algo':
    // 		executingSafe = oldSafe;
    //     initTxn = await ss.getMigrateAlgosToSafePendingTxn(oldSafe, safe, addr);
    //     break;
    // 	case 'approve':
    // 		executingSafe = item?.ptxn.safe_app_id === oldSafe.appId ? oldSafe : safe;
    // 		txn = await ss.getVotePendingTxn(item?.ptxn, addr, 1);
    // 		break;
    // 	case 'delete':
    // 		executingSafe = item?.ptxn.safe_app_id === oldSafe.appId ? oldSafe : safe;
    //     txn = await ss.getDeleteExpiredPendingTxn(item?.ptxn, addr);
    //     break;
    // 	case 'execute':
    // 		executingSafe = item?.ptxn.safe_app_id === oldSafe.appId ? oldSafe : safe;
    //     txn = await ss.getExecutePendingTxn(item?.ptxn, addr);
    //     break;
    //   default:
    //     break;
    // }

    // if (executingSafe === undefined) {
    // 	throw new Error("Executing safe is undefined");
    // }

    // try {
    // 	// await authenticateSigner(executingSafe.appId);
    //   setStepProgress(2);

    // 	// TODO: update this fn
    // 	// const txnData = action === 'optin' || action === 'transfer' || action === 'transfer-algo'? initTxn.txns : txn
    //   // const txnBuilder = convertToTxnBuilder(txnData);
    //   // const res = await ws.signAndSubmitTxn(txnBuilder);

    // 	//for execution, optin and transfer
    //   if (action === 'execute' || action === 'optin' || action === 'transfer' || action === 'transfer-algo') {
    //     // TODO: update fn
    // 		switch (action) {
    // 			case 'execute':
    // 				await ss.processExecutedPendingTxn(addr, item.ptxn, executingSafe);
    // 				break;
    // 			case 'optin':
    // 			case 'transfer':
    // 			case 'transfer-algo':
    // 				const encodedPayload = convertToTxnBuilder(initTxn.payload);
    // 				await ss.savePendingTxnPayloadToDatabase(
    // 					addr,
    // 					executingSafe,
    // 					encodedPayload,
    // 					initTxn.lsa.lsa,
    // 					initTxn.lsa.result
    // 				);
    // 				if (action === 'transfer-algo') await ss.saveAlgoTransferPtxnForSafeMigration(oldSafe, migrationID, addr)
    // 				break;
    // 			default:
    // 				break;
    // 		}
    //   }

    // 	if (action === 'delete') {
    // 		let checkAction;

    // 		if (item.stage == 'Transfer') {
    // 			if (unitName == 'Algo') {
    // 				checkAction = 'transfer-algo';
    // 			} else {
    // 				checkAction = 'transfer';
    // 			}
    // 		} else  {
    // 			checkAction = 'optin';
    // 		}

    // 		handeAction(item, checkAction, stepProgress);

    // 	} else {
    // 		setStepProgress(3);
    // 		setLoadingModalShow(false);

    // 		// TODO: update with txn hash from sign and submit
    // 		setDataModal({
    // 			type: 'success',
    // 			txHash: ""
    // 		});
    // 		setResponseModalShow(true);
    // 	}
    // } catch(e: any) {
    //   setLoadingModalShow(false);
    //   setDataModal({
    //     type: "fail",
    //     errorDetails: e?.message,
    //   });
    //   setResponseModalShow(true);
    // }
  };

  const renderTooltip = (props?: any, status?: string, expiredAt?: any) => (
    <Tooltip id="button-tooltip" {...props} className={styles.tooltip}>
      <div className="d-flex flex-column">
        {status}
        {expiredAt ? <b>Expires {expiredAt}</b> : ""}
      </div>
    </Tooltip>
  );

  return (
    <div>
      <ModalTx
        modalStatus={responseModalShow}
        title={dataModal.title}
        type={dataModal.type}
        txHash={dataModal.txHash}
        seqPtxn={dataModal.seqNumb}
        message={dataModal.message}
        resTxns={dataModal.resTxns}
        errorDetails={dataModal.errorDetails}
        onHide={() => {
          setResponseModalShow(false);
          fetchData && fetchData();
          fetchMigration && fetchMigration();
        }}
      />

      <ModalLoadingTx title="Transaction is Processing" items={itemsModal} modalStatus={loadingModalShow} step={stepProgress} />
      <div className={`${styles["tbl-transfer-container"]}`}>
        <div className={`${styles["tbl-head"]}`}>
          <div className={`${styles["th-box"]} `}>
            AssetS <span className={`${styles["th-mobile-first"]} `}>/ Amount</span>
          </div>
          <div className={`${styles["th-box"]} text-right`}>OLD SAFE</div>
          <div className={`${styles["th-box"]} ${styles.icon}`}>
            <ArrowRightTbl />
          </div>
          <div className={`${styles["th-box"]}`}>NEW SAFE</div>
          <div className={`${styles["th-box"]}`}>STAGE</div>
          <div className={`${styles["th-box"]}`}>
            <span className={`${styles["th-mobile-last"]} `}>Stage / </span> STATUS
          </div>
          <div className={`${styles["th-box"]}`} />
        </div>
        {assets?.map((asset, i) => {
          const nameAsset = asset?.assetDetails?.params?.name;
          const truncateName = nameAsset?.length > 6 ? nameAsset.substring(0, 6) + "..." : nameAsset;
          const expiredAt = moment(asset?.ptxn?.expiry).endOf("minute").fromNow();

          let btnDisplay = "";
          let tooltipContent = "";
          let isExpiredTimeShow = false;

          switch (asset.btn) {
            case "optin":
              btnDisplay = "OPT-IN";
            case "":
              tooltipContent = "Safe Creator has not started the process.";
              break;
            case "transfer":
            case "transfer-algo":
              btnDisplay = "TRANSFER";
              tooltipContent = "Safe Creator has not started the process.";
              break;
            case "pending":
              btnDisplay = "EXECUTE";
              tooltipContent = "Waiting for other’s approval(s)";
              isExpiredTimeShow = true;
              break;
            case "execute":
              btnDisplay = "EXECUTE";
              tooltipContent = "Ready to Execute";
              isExpiredTimeShow = true;
              break;
            case "approve":
              btnDisplay = "APPROVE";
              tooltipContent = "Need your Confirmation";
              isExpiredTimeShow = true;
              break;
            case "delete":
              tooltipContent = "Transaction has expired. Please inform the Safe Creator to retry.";
              if (isOwner) {
                btnDisplay = "RETRY";
                break;
              }
            default:
              break;
          }

          return (
            <div key={i} className={`${styles["tbl-body"]}`}>
              <div className={`${styles["td-box"]} ${styles["td-asset-name"]}`}>
                <img
                  className={styles["asset-icon"]}
                  src={`/images/assets-icons/${nameAsset}.svg`}
                  alt={nameAsset + ` logo`}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = "/images/assets-icons/CUSTOM.svg";
                  }}
                />
                <span>{truncateName}</span>
                {nameAsset == "ALGO" && (
                  <div className={styles["info-algo"]}>
                    <InfoIcon />
                  </div>
                )}
              </div>
              <div className={`${styles["td-box"]} text-right ${styles["td-asset-value"]}`}>
                <span className=" d-lg-none">
                  <b>Old Safe</b>
                </span>{" "}
                {asset.old_safe_balance}
              </div>
              <div className={`${styles["td-box"]} ${styles.icon}`}>
                <ArrowRightTbl />
              </div>
              <div className={`${styles["td-box"]} ${styles["td-asset-value"]}`}>
                <span className=" d-lg-none">
                  <b>New Safe</b>
                </span>{" "}
                {asset.new_safe_balance}
              </div>
              <div className={`${styles["td-box"]} ${styles["td-asset-value"]} ${styles["black"]}`}>
                {asset.stage ? asset.stage : "-"}
              </div>
              <div
                className={`
										${styles["td-box"]} 
										${styles["td-asset-status"]}
										${asset.status == "Pending" ? styles.yellow : ""} 
										${asset.status == "Ready" ? styles.green : ""}
										${asset.status == "Transferred" ? styles.darkGreen : ""}
										${asset.status == "Need Confirmation" || asset.status == "Expired" ? styles.red : ""}
									`}
              >
                {asset.status == "Transferred" ? (
                  <img src="images/icon-checklist-green.svg" />
                ) : (
                  <div
                    className={`
											${styles.dot} 
											${asset.status == "Pending" ? styles.yellow : ""} 
											${asset.status == "Ready" ? styles.green : ""}
											${asset.status == "Need Confirmation" || asset.status == "Expired" ? styles.red : ""}
											`}
                  />
                )}
                <span className="d-flex align-items-center gap-1">
                  {asset.status}
                  {asset.status !== "Transferred" && (
                    <OverlayTrigger
                      placement="bottom"
                      delay={{ show: 250, hide: 800 }}
                      overlay={renderTooltip("", tooltipContent, isExpiredTimeShow ? expiredAt : "")}
                    >
                      <img src="images/icon-info-grey.svg" />
                    </OverlayTrigger>
                  )}
                </span>
              </div>
              {btnDisplay && (
                <div className={`${styles["td-box"]} ${styles["ml-auto"]}`}>
                  <Button
                    primary
                    className={`${styles["btn-mbl"]}`}
                    disabled={asset.btn === "pending"}
                    onClick={() => handeAction(asset, asset.btn)}
                  >
                    {btnDisplay}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableAssetTransfer;
