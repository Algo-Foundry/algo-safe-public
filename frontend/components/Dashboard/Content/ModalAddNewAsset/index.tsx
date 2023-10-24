import styles from "./ModalAddNewAsset.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import BorderDivider from "frontend/components/UI/BorderDivider";
import Button from "frontend/components/Button";
import { useState, useEffect } from "react";
import Alert from "frontend/components/UI/Alert/index";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import SafeService from "frontend/services/safe";
import NftService from "frontend/services/nft";
import { PendingTxn } from "shared/interfaces";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import {
  getAssets,
  getRefreshAssetTableKey,
  setRefreshAssetTableKey,
  setIsModalProcessingClose,
  setIsModalFailClose,
} from "frontend/redux/features/asset/assetSlice";
import { errors } from "shared/constants";
import Router from "next/router";
import ModalCheckUrgent from "../../ModalCheckUrgent";
import NftCard from "frontend/components/UI/NftCard";
import useLedger from "frontend/hooks/useLedger";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { getSelectedSafe, getSigner } from "frontend/redux/features/safe/safeSlice";
import useAddAssetPtxn from "frontend/hooks/useAddAssetPtxn";
import { Account, useWallet } from "@txnlab/use-wallet";
import LedgerLoader from "frontend/components/UI/LedgerLoader";
import usePtxnActions from "frontend/hooks/usePtxnActions";
import * as Sentry from "@sentry/nextjs";
import AutoSuggestAsset from "frontend/components/UI/AutoSuggestAsset";

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  message?: string;
  errorDetails?: string;
}

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onConfirm: () => void;
  onFail: () => void;
  isLedger?: boolean;
  selectedTabs?: (idx: number) => void;
  refreshAssets?: () => void;
}

const ModalAddNewAsset: React.FC<Props> = ({
  modalStatus,
  onHide,
  onConfirm,
  onFail,
  isLedger = false,
  selectedTabs,
  refreshAssets,
}: Props) => {
  const assets = useAppSelector(getAssets);
  const ss = new SafeService();
  const ns = new NftService();
  const selectedAccount: any = useAppSelector(getSelectedAccount);
  const safe: any = useAppSelector(getSelectedSafe);
  const signer: LedgerAccount | Account | null = useAppSelector(getSigner);
  const dispatch = useAppDispatch();
  const refreshAssetTableKey: any = useAppSelector(getRefreshAssetTableKey);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("");
  const [nftImage, setNftImage] = useState("");
  const [assetType, setAssetType] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [isGetAssetLoading, setIsGetAssetLoading] = useState(false);

  const [responseModalShow, setResponseModalShow] = useState(false);
  const [typeModal, setTypeModal] = useState("success-ptxn");
  const [successTxId, setSuccessTxId] = useState("");
  const [lsig_address, setLsig_address] = useState("");

  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const itemsModal = ["Creating ", "Processing", "Success"];
  const [isInit, setIsInit] = useState(0);

  const [checkUrgentModal, setCheckUrgentModal] = useState(false);
  const [modalShow, setmodalShow] = useState(false);

  const { getAccount } = useLedger();

  const [isConnectingLedger, setIsConnectingLedger] = useState(false);

  const isSafeSignerLedger = () => {
    if (!signer) {
      return false;
    }

    return signer && "ledgerAddress" in signer;
  };

  const nftData = {
    name: name,
    asaID: Number(id),
    unitName: symbol,
    imgUrl: nftImage,
  };

  useEffect(() => {
    if (!checkUrgentModal) {
      setmodalShow(false);
    } else {
      setmodalShow(true);
    }
  }, [checkUrgentModal, modalShow]);

  const onChange = (id: string): void => {
    setId(id);

    //check for the assetID
    const asset = assets?.find((asset) => asset.id === Number(id));
    if (asset !== undefined && id) {
      setErrorMsg(errors.ERR_ASSET_EXISTS);
    } else {
      setErrorMsg("");
    }
  };

  const clearAssetInput = () => {
    setName("");
    setSymbol("");
    setDecimals("");
    setAssetType("");
  };

  const clearPage = () => {
    setId("");
    clearAssetInput();
  };

  useEffect(() => {
    if (!isInit) {
      // skip the first initial load
      setIsInit(1);
    } else {
      const timeOutId = setTimeout(async () => {
        setIsGetAssetLoading(true);
        try {
          const asaID = Number(id);
          const res = await ns.formatNft(asaID);
          const isNft = res?.url?.includes("ipfs:");
          if (res?.creator) {
            setName(res.name ? res.name : "");
            setSymbol(res["unit-name"]);

            //determine condition for nft or token
            if (isNft) {
              setNftImage(res.contentUrl);
              setAssetType("nft");
            } else {
              setAssetType("token");
              setDecimals(res?.decimals);
            }
          } else {
            clearAssetInput();
          }
        } catch (error: any) {
          clearAssetInput();
          const isAsaIdInvalid =
            error.message.includes("asset does not exist") || error.message.includes("Invalid format for parameter asset-id");
          if (isAsaIdInvalid && id) {
            setErrorMsg(errors.ERR_INVALID_ASA_ID);
          }
        } finally {
          setIsGetAssetLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timeOutId);
    }
  }, [id]);

  const onHideModal = () => {
    setErrorDetails("");
    setErrorMsg("");
    setId("");
    onHide();
  };

  function catchError(err: any) {
    dispatch(setIsModalProcessingClose(true));
    dispatch(setIsModalFailClose(false));

    setTypeModal("fail");
    setErrorDetails(err?.message);
    if (err.response?.status == 401) {
      setErrorDetails(err?.response?.data?.message);
    }
    setResponseModalShow(true);
  }

  function finishTransaction(res: any, isLedger: boolean, ptxnData?: any) {
    setStepProgress(3);
    clearPage();
    dispatch(setRefreshAssetTableKey(refreshAssetTableKey + 1));
    setTypeModal("success-ptxn");
    setSuccessTxId(res.response?.txId || "");
    // this one only for safe
    if (isLedger === false) {
      setLsig_address(ptxnData.lsa.lsa.address());
    }
    dispatch(setIsModalProcessingClose(false));
    onConfirm();
    setResponseModalShow(true);
    setLoadingModalShow(false);
  }

  const { handleAddAssetToSafePtxn, handleAddAssetFromLedgerPtxn } = useAddAssetPtxn();

  const { signTransactions, sendTransactions } = useWallet();

  const submit = async () => {
    const asaID = Number(id);
    const getUrgentRequestPtxn = await ss.getUrgentPtxn(safe);
    if (getUrgentRequestPtxn) {
      setCheckUrgentModal(true);
      return;
    }
    setStepProgress(1);
    onHideModal();
    onHide();
    dispatch(setIsModalProcessingClose(false));
    dispatch(setIsModalFailClose(true));
    setLoadingModalShow(true);
    try {
      const { ptxnData, res, confirmation } = await handleAddAssetToSafePtxn(
        safe,
        asaID,
        signer,
        setStepProgress,
        signTransactions,
        sendTransactions
      );
      if (confirmation !== undefined || res["confirmed-round"] !== undefined) {
        finishTransaction(res, false, ptxnData);
      }
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Add Asset - Safe",
          appId: safe.appId,
          asaID,
          signer: signer?.address,
        },
      });
      catchError(err);
    } finally {
      setLoadingModalShow(false);
    }
  };

  const submitLedger = async () => {
    setStepProgress(1);
    dispatch(setIsModalProcessingClose(false));
    dispatch(setIsModalFailClose(true));
    try {
      setIsConnectingLedger(true);

      const ledgerAccount = await getAccount(selectedAccount.ledgerAddress, selectedAccount.address, selectedAccount.name);
      const { response, confirmation } = await handleAddAssetFromLedgerPtxn(ledgerAccount, Number(id), setStepProgress);

      if (confirmation !== undefined) {
        onHideModal();
        finishTransaction(response, true);
      }
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Add Asset - Ledger",
          ledgerAddress: selectedAccount.ledgerAddress,
          selectedAccountAddress: selectedAccount.address,
          selectedAccountName: selectedAccount.name,
          asaID: Number(id),
        },
      });
      dispatch(setIsModalProcessingClose(true));
      dispatch(setIsModalFailClose(false));

      setTypeModal("fail");
      setErrorDetails(err?.message);
      setResponseModalShow(true);
    } finally {
      setIsConnectingLedger(false);
      setLoadingModalShow(false);
    }
  };

  //modal
  const ptxnDataSelected = useAppSelector(getPtxnData);
  const [isAction, setIsAction] = useState(false);
  const [reloader, setReloader] = useState(0);
  const [dataModal, setDataModal] = useState<DataModal>({
    title: "Success",
    type: "success",
    txHash: "",
  });

  // txn Action

  const { handlePtxnAction } = usePtxnActions();
  const txAction = async (item: PendingTxn, action: string) => {
    setIsAction(true);
    setLoadingModalShow(true);
    setStepProgress(1);

    try {
      const res = await handlePtxnAction(
        safe,
        signer,
        signTransactions,
        sendTransactions,
        item,
        action,
        setPtxnData,
        setStepProgress,
        setDataModal,
        setLoadingModalShow,
        setTypeModal,
        setErrorDetails,
        setResponseModalShow
      );

      setStepProgress(3);
      setLoadingModalShow(false);

      setDataModal({
        type: "success",
        txHash: res?.res?.txId || res?.response?.txId || "",
      });
      setResponseModalShow(true);
      setReloader(1);
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Safe Txn Action",
          appId: safe.appId,
          signer: signer?.address,
          payload: JSON.stringify(item),
          action: action,
        },
      });
      setLoadingModalShow(false);
      setTypeModal("fail");
      setErrorDetails(err?.message);
      setDataModal({
        type: "fail",
        errorDetails: err?.message,
      });
      setResponseModalShow(true);
    }
  };

  // handle Action
  const handleExecute = async (item: PendingTxn) => txAction(item, "execute");

  return (
    <div>
      <ModalTx
        modalStatus={responseModalShow}
        type={typeModal}
        txHash={successTxId ? successTxId : dataModal?.txHash}
        lsig_address={lsig_address}
        errorDetails={errorDetails}
        onExecute={() => {
          setResponseModalShow(false);
          handleExecute(ptxnDataSelected);
        }}
        onHide={() => {
          // redirect to txn page when cannot execute
          if (selectedTabs && !ptxnDataSelected?.canExecute && (typeModal === "success-ptxn" || typeModal === "success")) {
            selectedTabs(0);
          }

          if (isAction) {
            setResponseModalShow(false);
            if (reloader == 1) {
              // Router.reload();
              refreshAssets && refreshAssets();
            } else if (reloader == 2) {
              Router.push({
                pathname: "/",
              });
            }
            setReloader(0);
          } else {
            if (typeModal === "success-ptxn" || typeModal === "success") {
              dispatch(setIsModalProcessingClose(true));
              dispatch(setIsModalFailClose(true));
              setResponseModalShow(false);
              refreshAssets && refreshAssets();
            } else {
              setResponseModalShow(false);
              dispatch(setIsModalFailClose(true));
              onFail();
            }
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
      <ModalCheckUrgent
        modalStatus={checkUrgentModal}
        onHide={() => {
          setCheckUrgentModal(false);
          setmodalShow(true);
          onHideModal();
        }}
      />

      <ModalGeneral
        title="Add New Asset"
        onHide={onHideModal}
        modalStatus={modalStatus && !modalShow}
        fullscreenSm
        backdrop="static"
        isPaddingTitleFixed
      >
        <div className={styles.modal}>
          <div className={styles["modal-body"]}>
            <p>To receive/add an asset to your Safe, you are required to opt-in first. Ensure the Asset ID is accurate.</p>
            <BorderDivider />
            <div className="box-input position-relative">
              <label htmlFor="id">Asset Name or ID</label>
              <AutoSuggestAsset onChange={onChange} value={String(id)} />
              {errorMsg == errors.ERR_INVALID_ASA_ID && (
                <div className={styles["icon-warning"]}>
                  <img id="img" src="/images/safe/icon-error.svg" alt="icon-error" />
                </div>
              )}
            </div>

            <div className="box-input">
              <label htmlFor="asset">Asset</label>
              <div className={styles["asset-box"]}>
                {!isGetAssetLoading && (
                  <>
                    {assetType == "token" && (
                      <div className={styles["asset-token"]}>
                        <img
                          className={styles["asset-icon"]}
                          src={`/images/assets-icons/${name}.svg`}
                          alt={name + ` logo`}
                          onError={({ currentTarget }) => {
                            currentTarget.onerror = null;
                            currentTarget.src = "/images/assets-icons/CUSTOM.svg";
                          }}
                        />

                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-center gap-2">
                            <label htmlFor="asset">Asset</label>:<p>{name}</p>
                            <img className={styles["verified-icon"]} src={`/assets/icons/verified.svg`} />
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <label htmlFor="symbol">Symbol</label>:<p>{symbol}</p>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <label htmlFor="decimals">Decimals</label>:<p>{decimals}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {assetType == "nft" && <NftCard data={nftData} />}
                  </>
                )}
              </div>
              {!(isLedger || isSafeSignerLedger()) && (
                <div className={styles.btmMessage}>
                  <BorderDivider />
                  <p>You are about to create a transaction that will require confirmation from your active signer.</p>
                </div>
              )}
            </div>

            {!!errorMsg && <Alert message={errorMsg} />}
          </div>
          <div className={styles["modal-footer"]}>
            <div className="btn-input-box">
              {(isLedger || isSafeSignerLedger()) && (
                <div className={styles.ledgerContent}>
                  <div className={styles.imgWrapper}>
                    {!isConnectingLedger ? (
                      <img src="images/icon-ledger.svg" style={{ width: "100%", height: "100%" }} alt="icon" />
                    ) : (
                      <LedgerLoader />
                    )}
                  </div>
                  <div className={styles.textDesc}>
                    {isConnectingLedger ? (
                      <>
                        <p>
                          <span className={styles.textBold}>Connecting to Ledger</span>
                        </p>
                        <p>Connect and sign transaction through your ledger device.</p>
                      </>
                    ) : (
                      <p>
                        <span className={styles.textBold}>Connect</span> your Ledger to your computer, unlock and choose{" "}
                        <span className={styles.textBold}>Algorand app</span> before continue.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <Button
                primary
                className="flex-grow-1 w-100"
                onClick={isLedger ? submitLedger : submit}
                disabled={errorMsg !== "" || isGetAssetLoading || isConnectingLedger || id === "" || name === ""}
              >
                {isConnectingLedger ? "CONNECTING TO LEDGER..." : "CONFIRM"}
              </Button>
            </div>
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalAddNewAsset;
