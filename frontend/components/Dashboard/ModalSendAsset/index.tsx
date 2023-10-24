import { useState, useEffect, useRef } from "react";
import styles from "./ModalSendAsset.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import { digitGroupingRoundUp } from "shared/utils";
import AddressGroup from "frontend/components/UI/AddressGroup";
import BorderDivider from "frontend/components/UI/BorderDivider";
import React from "react";
import Alert from "frontend/components/UI/Alert/index";
import { Asset, SidebarAccount } from "shared/interfaces";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { getExplorerURL } from "shared/utils";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import { getSelectedSafe, getSigner } from "frontend/redux/features/safe/safeSlice";
import { PendingTxn } from "shared/interfaces";
import { setDisconnectAccount } from "frontend/redux/features/account/accountSlice";
import SafeService from "frontend/services/safe";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import { verifyAlgorandAddress } from "shared/utils";
import {
  getRefreshAssetTableKey,
  setRefreshAssetTableKey,
  setIsModalProcessingClose,
  setIsModalFailClose,
} from "frontend/redux/features/asset/assetSlice";
import Router from "next/router";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import HelpOutline from "frontend/components/Icons/HelpOutline";
import ModalCheckUrgent from "../ModalCheckUrgent";
import Image from "next/image";
import NftCard from "frontend/components/UI/NftCard";
import { errors } from "shared/constants";
import algosdk from "algosdk";
import useLedger from "frontend/hooks/useLedger";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import useSendAlgosPtxn from "frontend/hooks/useSendAlgosPtxn";
import useSendAssetPtxn from "frontend/hooks/useSendAssetPtxn";
import { Account, useWallet } from "@txnlab/use-wallet";
import usePtxnActions from "frontend/hooks/usePtxnActions";
import LedgerLoader from "frontend/components/UI/LedgerLoader";
import * as Sentry from "@sentry/nextjs";
import NewTabs from "frontend/components/UI/NewTabs";
import Search from "frontend/components/Icons/Search";
import NftImage from "frontend/components/UI/NftImage";
import AssetModalCard from "frontend/components/UI/AssetModalCard";

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  message?: string;
  errorDetails?: string;
}

interface DataNft {
  id: number;
  name: string;
  total: number;
  unitName: string;
  balance: number;
  creator: string;
  standard: string;
  description: string;
  properties: object;
  contentUrl: string;
}

interface Props {
  modalStatus: boolean;
  selectAssetId?: number;
  onHide: () => void;
  onConfirm: () => void;
  onFail: () => void;
  assets?: Array<Asset>;
  nftData?: DataNft | null;
  isLedger?: boolean;
  selectedTabs?: (idx: number) => void;
  refreshAssets?: () => void;
  tokens?: Array<Asset>;
  nfts?: Array<any>;
}

const ModalSendAsset: React.FC<Props> = ({
  modalStatus,
  selectAssetId,
  onHide,
  onConfirm,
  onFail,
  assets = [],
  nftData,
  isLedger = false,
  selectedTabs,
  refreshAssets,
  tokens,
  nfts,
}: Props) => {
  const ss = new SafeService();

  const safe: any = useAppSelector(getSelectedSafe);
  const selectedAccount = useAppSelector<SidebarAccount | null>(getSelectedAccount);
  const dispatch = useAppDispatch();
  const refreshAssetTableKey: any = useAppSelector(getRefreshAssetTableKey);

  const [selectedAsset, setSelectedAsset] = useState<Asset | any>({});
  const [nfdRecepientName, setNfdRecepientName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [assetId, setAssetId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | string>(0);
  const [maxAmtBalance, setMaxAmtBalance] = useState<number | string>(0);
  const [recipientData, setRecipientData] = useState<any>({
    address: "",
  });
  const { getAccount } = useLedger();
  const [ledgerAccount, setLedgerAccount] = useState<LedgerAccount | null>(null);

  const { signTransactions, sendTransactions } = useWallet();
  const signer: LedgerAccount | Account | null = useAppSelector(getSigner);

  useEffect(() => {
    if (!selectedAccount?.address) return;

    let fetchingFor = null;

    const initLedger = async () => {
      if (isLedger && selectedAccount.ledgerAddress) {
        const acc = await getAccount(selectedAccount.ledgerAddress, selectedAccount.address, selectedAccount.name);
        setLedgerAccount(acc);
        const maxBalance = acc.balance - acc.minBalance <= 0 ? 0 : (acc.balance - acc.minBalance) / Math.pow(10, 6);
        setMaxAmtBalance(maxBalance);
      }
    };

    const initSafe = async () => {
      if (selectedAccount.appId !== undefined) {
        const getMaxAmount = (await ss.getSafeMaxWithdrawable(selectedAccount?.address)) / Math.pow(10, 6);
        setMaxAmtBalance(getMaxAmount);
      }
    };

    if (fetchingFor !== selectedAccount.address) {
      initSafe();
      initLedger();
    }

    return () => {
      fetchingFor = selectedAccount.address;
    };
  }, [selectedAccount?.address]);

  useEffect(() => {
    if (selectAssetId != null) {
      const asset = assets.find((e) => e.id == selectAssetId);

      if (asset) {
        setSelectedAsset(asset);
        setAssetId(asset.id);
      }

      if (nftData) {
        setSelectedAsset(nftData);
        setAssetId(nftData.id);
      }
    }
  }, [selectAssetId, assets]);

  const [errorMsg, setErrorMsg] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [reviewKey, setReviewKey] = useState(0);

  const getDecimal = (a: any) => {
    if (!isFinite(a)) return 0;
    let e = 1,
      p = 0;
    while (Math.round(a * e) / e !== a) {
      e *= 10;
      p++;
    }
    return p;
  };

  const reviewLedger = async () => {
    if (!ledgerAccount) {
      throw new Error("No ledger account detected");
    }

    let maxWithdraw = Number(selectedAsset.balance) / Math.pow(10, selectedAsset.decimals);
    if (selectedAsset.id === 0) {
      maxWithdraw = Number(selectedAsset.balance) - ledgerAccount.minBalance - algosdk.ALGORAND_MIN_TX_FEE;
      maxWithdraw = maxWithdraw / Math.pow(10, 6);
    }

    if (!recipient) {
      setErrorMsg(errors.ERR_INVALID_RECEPIENT);
    } else if (assetId == null) {
      setErrorMsg(errors.ERR_INVALID_ASSET);
    } else if (!amount || Number(amount) < 0) {
      setErrorMsg(errors.ERR_AMOUNT_NOT_ZERO);
    } else if (selectedAsset.decimals < getDecimal(amount)) {
      setErrorMsg(errors.ERR_INVALID_AMOUNT_VALUE);
    } else if (Number(amount) > maxWithdraw) {
      setErrorMsg(errors.ERR_AMOUNT_NOT_MORE_THAN_BALANCE);
    } else {
      try {
        if (recipient.slice(-5) == ".algo") {
          const res: any = await ss.nfdToAddress(recipient);
          if (res?.owner) {
            setRecipientData({
              name: res.name,
              address: res.owner,
            });
          } else {
            setRecipientData({ address: recipient });
          }
        } else {
          setRecipientData({ address: recipient });
        }
      } catch (error) {
        setRecipientData({ address: recipient });
      }

      if (!reviewKey) {
        setReviewKey(1);
      }
    }
  };

  const review = async () => {
    if (!recipient) {
      setErrorMsg(errors.ERR_INVALID_RECEPIENT);
    } else if (recipient === safe.address) {
      setErrorMsg(errors.ERR_ADDRESS_NOT_ALLOWED);
    } else if (assetId == null) {
      setErrorMsg(errors.ERR_INVALID_ASSET);
    } else if (!amount || Number(amount) < 0) {
      setErrorMsg(errors.ERR_AMOUNT_NOT_ZERO);
    } else if (selectedAsset.decimals < getDecimal(amount)) {
      setErrorMsg(errors.ERR_INVALID_AMOUNT_VALUE);
    } else if (
      typeof selectedAsset.balance == "number" &&
      Number(amount) >
        (selectedAsset.id !== 0
          ? selectedAsset.balance / Math.pow(10, selectedAsset.decimals)
          : (await ss.getSafeMaxWithdrawable(selectedAccount?.address || safe.address)) / Math.pow(10, 6))
    ) {
      setErrorMsg(errors.ERR_AMOUNT_NOT_MORE_THAN_BALANCE);
    } else {
      try {
        if (recipient.slice(-5) == ".algo") {
          const res: any = await ss.nfdToAddress(recipient);
          if (res?.owner) {
            setRecipientData({
              name: res.name,
              address: res.owner,
            });
          } else {
            setRecipientData({ address: recipient });
          }
        } else {
          setRecipientData({ address: recipient });
        }
      } catch (error) {
        console.log("error: ", error);
        setRecipientData({ address: recipient });
      }

      if (!reviewKey) {
        setReviewKey(1);
      }
    }
  };

  const handleGetNfd = async () => {
    if (recipientData.name) {
      setNfdRecepientName(recipientData.name);
      return;
    }
    try {
      const getNfd = await ss.getNfdDomainName(recipient);
      const nfd = getNfd === null ? "" : getNfd.name;
      setNfdRecepientName(nfd);
    } catch (error) {
      setNfdRecepientName("");
    }
  };

  const checkAddress = async () => {
    if (reviewKey) {
      const isAddressVerified = verifyAlgorandAddress(recipientData.address);
      if (!isAddressVerified) {
        setErrorMsg(errors.ERR_ADDRESS_MALFORMED);
        return;
      }

      try {
        const checkAsset = await ss.checkAssetOptin(recipientData.address, selectedAsset.id);
        if (checkAsset) {
          handleGetNfd();
          setErrorMsg("");
          setSubPage(2);
        } else {
          setErrorMsg(errors.ERR_RECIPIENT_NOT_OPTIN);
        }
      } catch (error: any) {
        setErrorMsg(error?.response?.data?.message ? error?.response?.data?.message : error?.message);
      }
    }
  };

  useEffect(() => {
    checkAddress();
  }, [recipientData, nfdRecepientName]);

  const [responseModalShow, setResponseModalShow] = useState(false);
  const [typeModal, setTypeModal] = useState("");
  const [successTxId, setSuccessTxId] = useState("");
  const [lsig_address, setLsig_address] = useState("");

  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const itemsModal = ["Creating ", "Processing", "Success"];
  const [checkUrgentModal, setCheckUrgentModal] = useState(false);
  const [modalShow, setmodalShow] = useState(false);

  const [isConnectingLedger, setIsConnectingLedger] = useState(false);

  const { handleSendAlgosFromSafePtxn, handleSendAlgosFromLedgerPtxn } = useSendAlgosPtxn();
  const { handleSendAssetFromSafePtxn, handleSendAssetFromLedgerPtxn } = useSendAssetPtxn();
  useEffect(() => {
    if (typeModal === "fail") {
      setSubPage(1);
    } else if (typeModal !== "") {
      setAmount(0);
      setSubPage(1);
    }
  }, [modalStatus, typeModal]);

  useEffect(() => {
    if (!checkUrgentModal) {
      setmodalShow(false);
    } else {
      setmodalShow(true);
    }
  }, [checkUrgentModal, modalShow]);

  const clearPage = () => {
    setReviewKey(0);
    setSubPage(1);
    setRecipient("");
    setAmount(0);
    setRecipientData({
      address: "",
    });
  };

  const onHideModal = () => {
    setErrorDetails("");
    setErrorMsg("");
    setIsCheckboxChecked(false);
    onHide();
    setSubPage(1);
    setAmount("");
    setRecipient("");
  };

  function catchError(err: any) {
    dispatch(setIsModalProcessingClose(true));
    dispatch(setIsModalFailClose(false));

    setTypeModal("fail");
    setErrorDetails(err?.message);
    setResponseModalShow(true);

    if (err.response?.status == 401) {
      setTypeModal("unathorized");
      setErrorDetails(err?.response?.data?.message);
      dispatch(setDisconnectAccount(1));
    }
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
    onHideModal();
  }

  const submit = async () => {
    const getUrgentRequestPtxn = await ss.getUrgentPtxn(safe);
    if (getUrgentRequestPtxn) {
      setCheckUrgentModal(true);
      return;
    }

    setStepProgress(1);
    onHideModal();
    dispatch(setIsModalProcessingClose(false));
    dispatch(setIsModalFailClose(true));

    setLoadingModalShow(true);
    const currSafe = {
      ...safe,
      assets,
    };
    if (assetId == 0) {
      try {
        const { res, ptxnData, confirmation } = await handleSendAlgosFromSafePtxn(
          currSafe,
          algosdk.algosToMicroalgos(Number(amount)),
          signer,
          recipientData.address,
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
            step: "Send Algos - Safe",
            appId: currSafe,
            assetId: selectedAsset.id,
            amount:
              assetId === 0
                ? algosdk.algosToMicroalgos(Number(amount))
                : Number(amount) * Math.pow(10, selectedAsset.decimals ?? 0),
            sender: signer?.address,
            receiver: recipientData.address,
          },
        });
        catchError(err);
      } finally {
        setLoadingModalShow(false);
      }
    } else {
      try {
        const { ptxnData, res, confirmation } = await handleSendAssetFromSafePtxn(
          currSafe,
          Number(assetId),
          Number(amount) * Math.pow(10, selectedAsset.decimals ?? 0),
          signer,
          recipientData.address,
          setStepProgress,
          signTransactions,
          sendTransactions,
          isCheckboxChecked
        );

        if (confirmation !== undefined || res["confirmed-round"] !== undefined) {
          finishTransaction(res, false, ptxnData);
        }
      } catch (err: any) {
        Sentry.captureException(err, {
          extra: {
            step: "Send Assets - Safe",
            appId: currSafe,
            assetId: selectedAsset.id,
            amount:
              assetId === 0
                ? algosdk.algosToMicroalgos(Number(amount))
                : Number(amount) * Math.pow(10, selectedAsset.decimals ?? 0),
            senderAddress: signer?.address,
            receiverAddress: recipientData.address,
          },
        });
        catchError(err);
      } finally {
        setLoadingModalShow(false);
      }
    }
  };

  const submitLedger = async () => {
    setStepProgress(1);
    // onHideModal();
    dispatch(setIsModalProcessingClose(false));
    dispatch(setIsModalFailClose(true));
    try {
      setIsConnectingLedger(true);
      let response;
      let confirmation;
      if (assetId === 0) {
        const { response: algoRes, confirmation: algoConfirmation } = await handleSendAlgosFromLedgerPtxn(
          ledgerAccount,
          recipientData,
          isCheckboxChecked,
          selectedAsset,
          amount,
          Number(assetId),
          setStepProgress
        );
        response = algoRes;
        confirmation = algoConfirmation;
      } else {
        const { response: assetRes, confirmation: assetConfirmation } = await handleSendAssetFromLedgerPtxn(
          ledgerAccount,
          recipientData,
          isCheckboxChecked,
          selectedAsset,
          amount,
          Number(assetId),
          setStepProgress
        );
        response = assetRes;
        confirmation = assetConfirmation;
      }

      if (confirmation !== undefined) {
        finishTransaction(response, true);
      }
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Send Assets - Ledger",
          ledgerAccountAddress: ledgerAccount?.address,
          assetId: selectedAsset.id,
          amount:
            assetId === 0
              ? algosdk.algosToMicroalgos(Number(amount))
              : Number(amount) * Math.pow(10, selectedAsset.decimals ?? 0),
          receiver: recipientData.address,
        },
      });
      catchError(err);
    } finally {
      setIsConnectingLedger(false);
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

  const { handlePtxnAction } = usePtxnActions();

  // txn Action
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
          step: "Send Asset - Execute Ptxn",
          appId: safe.appId,
          payload: JSON.stringify(item),
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

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTarget = useRef(null);

  function ModalTitle() {
    return (
      <div className="d-flex align-items-center gap-2">
        <div>Send Assets</div>
      </div>
    );
  }

  const [tabsData, setTabsData] = useState([
    { name: "Tokens", shortName: "Tokens", isActive: true },
    { name: "NFTs", shortName: "NFTs", isActive: false },
  ]);

  const [searchAsset, setSearchAsset] = useState("");

  const selectedAssetTabs = (index: number) => {
    setTabsData((prevItems) => prevItems.map((e, i) => ({ ...e, isActive: i === index })));
  };

  const parseBalance = () => {
    if (selectedAsset.id === 0) {
      return maxAmtBalance;
    } else {
      return parseFloat(
        digitGroupingRoundUp(
          selectedAsset.balance ? selectedAsset.balance / Math.pow(10, selectedAsset.decimals ?? 0) : 0,
          selectedAsset.decimals ?? 0
        )
      );
    }
  };

  const filterToken = () => {
    const filter =
      tokens?.filter((token) =>
        searchAsset
          ? token["unit-name"]?.toLowerCase().includes(searchAsset) && (token?.balance || 0) > 0
          : (token?.balance || 0) > 0
      ) || [];
    const filterRes = filter?.map((e) => {
      return {
        ...e,
        maxBalance: e.name == "ALGO" ? maxAmtBalance : null,
      };
    });
    return filterRes;
  };

  return (
    <div>
      <ModalCheckUrgent
        modalStatus={checkUrgentModal}
        onHide={() => {
          setCheckUrgentModal(false);
          setmodalShow(true);
          onHideModal();
        }}
      />
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
            } else if (typeModal === "unathorized") {
              Router.push("/");
              dispatch(setIsModalProcessingClose(true));
            } else {
              setResponseModalShow(false);
              dispatch(setIsModalFailClose(true));
              onFail();
              setRecipient("");
            }
          }
        }}
      />

      <ModalLoadingTx
        title="Transaction is Processing"
        items={itemsModal}
        modalStatus={loadingModalShow}
        step={stepProgress}
        disabledFooter={isLedger}
      />

      <ModalGeneral
        onHide={onHideModal}
        modalStatus={modalStatus && !modalShow}
        fullscreenSm
        titleChild={<ModalTitle />}
        backdrop="static"
        isPaddingTitleFixed
        classNameBody={styles["modal-custom-body"]}
      >
        {subPage == 1 && (
          <div className={styles.modal}>
            <div className={styles["modal-body"]}>
              <div className={`box-input ${styles.boxInputAsset}`}>
                <label>Asset</label>
                {selectedAsset.hasOwnProperty("contentUrl") && selectedAsset && selectedAsset !== null ? (
                  <div className={styles.info}>
                    <div
                      className={styles.infoToken}
                      onClick={() => {
                        setSubPage(3);
                        selectedAssetTabs(1);
                      }}
                    >
                      <div className={styles["nft-image"]}>
                        <div className={styles["nft-image-wrap"]}>
                          <NftImage url={selectedAsset?.contentUrl} isSizeFit isLinkEnable={false} />
                        </div>
                      </div>
                      <div className={styles["container"]}>
                        <div className={styles["left-section"]}>
                          <div className={styles["title"]}>{selectedAsset["name"]}</div>
                          <div className={styles["subtitle"]}>
                            {selectedAsset.id} | {selectedAsset["unit-name"]}
                          </div>
                        </div>
                        <div className={styles["right-section"]}>
                          <div>
                            {digitGroupingRoundUp(
                              selectedAsset.balance ? selectedAsset.balance / Math.pow(10, selectedAsset.decimals ?? 0) : 0,
                              selectedAsset.decimals ?? 0
                            )}
                          </div>
                          <div className={styles["arrow-right"]}>
                            <Image
                              src="/images/dashboard/arrow-left-black.svg"
                              alt="arrow-left"
                              quality={100}
                              width={15}
                              height={20}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.info}>
                    <div
                      className={styles.infoToken}
                      onClick={() => {
                        setSubPage(3);
                        selectedAssetTabs(0);
                      }}
                    >
                      <img className={styles.imgToken} src={`${selectedAsset.imgUrl}`} alt="asset-logo" />
                      <div className={styles["container"]}>
                        <div className={styles["left-section"]}>
                          <div className="d-flex flex-row gap-1 align-items-center">
                            {selectedAsset["unit-name"] && <div className={styles["title"]}>{selectedAsset["unit-name"]}</div>}
                            {selectedAsset.id !== 0 && (
                              <div className={`${styles["subtitle"]} ${styles.fontSmall}`}>{`(${selectedAsset.id})`}</div>
                            )}
                            {selectedAsset.isVerified && (
                              <div className={`${styles.verifIcon}`}>
                                <Image
                                  alt="Icon Verification"
                                  src="/images/icon-verified.svg"
                                  layout="fill"
                                  objectFit="cover"
                                  quality={100}
                                />
                              </div>
                            )}
                          </div>
                          <div className={`${styles.fontSmall}`} style={{ opacity: "0.5" }}>
                            Balance = {parseBalance()}
                          </div>
                        </div>
                        <div className={styles["right-section"]}>
                          <div className={styles["arrow-right"]}>
                            <img src="/images/dashboard/arrow-left-black.svg" alt="" className={styles["iconWrapper"]} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={`box-input ${styles.boxInputAsset}`}>
                <div className="d-flex justify-content-between">
                  <label htmlFor="amount">Amount</label>
                  <div className="d-flex align-items-center gap-2">
                    <div className={styles["tooltip-container"]}>
                      <span
                        ref={tooltipTarget}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        role="button"
                        className={styles["help-icon"]}
                      >
                        <HelpOutline></HelpOutline>
                      </span>

                      <Overlay target={tooltipTarget.current} show={showTooltip} placement="bottom">
                        {(props) => (
                          <Tooltip id="overlay-example" {...props} className="custom-tooltip">
                            {selectedAsset.id === 0
                              ? `Withdraw-able amount will be lesser than the safe
                              balance due to minimum balance requirement for the
                              safe.`
                              : `Amount should be equal to or lesser than your current balance.`}
                          </Tooltip>
                        )}
                      </Overlay>
                    </div>

                    <b>
                      <u
                        role="button"
                        onClick={async () => {
                          let maxAmount = 0;
                          if (selectedAsset !== undefined) {
                            // for algo assets
                            if (selectedAsset.id === 0) {
                              maxAmount = maxAmtBalance as number;
                              if (maxAmount < 0) maxAmount = 0;
                            } else if (selectedAsset.balance) {
                              // for other assets
                              maxAmount = selectedAsset.balance / Math.pow(10, selectedAsset.decimals ?? 0);
                            }
                          }
                          setAmount(maxAmount);
                          setErrorMsg("");
                        }}
                      >
                        Send Max
                      </u>
                    </b>
                  </div>
                </div>
                {!selectedAsset.hasOwnProperty("contentUrl") ? (
                  <input
                    id="amount"
                    type="number"
                    className="form-controls hide-arrows"
                    placeholder="Enter Amount"
                    onChange={async (e) => {
                      setAmount(
                        !!e.currentTarget.value
                          ? selectedAsset.decimals === 0
                            ? parseInt(e.currentTarget.value)
                            : parseFloat(e.currentTarget.value)
                          : ""
                      );
                      setErrorMsg("");
                    }}
                    onKeyPress={(e) => {
                      if (!/[0-9]|\./.test(e.key) || (selectedAsset.decimals === 0 && e.key === ".")) {
                        e.preventDefault();
                      }
                    }}
                    value={amount}
                  />
                ) : (
                  <div className={`d-flex align-item-center`}>
                    <input
                      id="amount"
                      type="number"
                      className={`form-controls hide-arrows`}
                      placeholder="Enter Amount"
                      onChange={async (e) => {
                        setAmount(
                          !!e.currentTarget.value
                            ? selectedAsset.decimals === 0
                              ? parseInt(e.currentTarget.value)
                              : parseFloat(e.currentTarget.value)
                            : ""
                        );
                        setErrorMsg("");
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]|\./.test(e.key) || (selectedAsset.decimals === 0 && e.key === ".")) {
                          e.preventDefault();
                        }
                      }}
                      value={amount}
                    />
                  </div>
                )}
              </div>
              <div className={`box-input ${styles.boxInputAsset}`}>
                <label htmlFor="recipient">Recipient</label>
                <div className="position-relative">
                  <input
                    id="recipient"
                    type="text"
                    className={`form-controls`}
                    placeholder="Enter Address/NF Domain"
                    onChange={(e) => {
                      setRecipient(e.currentTarget.value);
                      setErrorMsg("");
                    }}
                    value={recipient}
                  />
                </div>
              </div>

              {!!errorMsg && <Alert message={errorMsg} />}

              <div className="flex-grow-1 d-md-none"></div>
            </div>

            <div className={styles["modal-footer"]}>
              <div className="btn-input-box">
                <Button
                  primary
                  onClick={isLedger ? reviewLedger : review}
                  disabled={!!errorMsg || !recipient || !amount}
                  className="flex-grow-1 w-100"
                >
                  REVIEW
                </Button>
              </div>
            </div>
          </div>
        )}

        {subPage == 3 && (
          <div className={styles.modal}>
            <div className={styles["modal-body"]}>
              <div className={styles.boxSearch}>
                <div className={styles["arrow-left"]} onClick={() => setSubPage(1)}>
                  {/* <Image src="/images/dashboard/arrow-left-black.svg" alt="arrow-left" quality={100} width={15} height={20} /> */}
                  <img src="/images/dashboard/arrow-left-black.svg" alt="" className={styles["iconWrapper"]} />
                </div>
                <input
                  id="id"
                  type="text"
                  className={`form-controls ${styles.inputSearch}`}
                  placeholder="Search Asset"
                  onChange={(e) => {
                    setSearchAsset(e.currentTarget.value);
                  }}
                  value={searchAsset}
                />
                <Search />
              </div>
              <NewTabs tabsData={tabsData} selectedTab={selectedAssetTabs} isFullWidth />
              <div className={styles["token-container"]}>
                {tabsData[0].isActive &&
                  filterToken().map((token) => {
                    return (
                      <AssetModalCard
                        key={token.id}
                        isNft={false}
                        isRemove={false}
                        asset={token}
                        onClick={() => {
                          setSelectedAsset(token);
                          setSubPage(1);
                        }}
                      />
                    );
                  })}

                {tabsData[1].isActive &&
                  nfts
                    ?.filter((nft) => nft["name"]?.toLowerCase().includes(searchAsset) && nft.balance > 0)
                    .map((nft) => {
                      return (
                        <AssetModalCard
                          key={nft.id}
                          isNft={true}
                          isRemove={false}
                          asset={nft}
                          onClick={() => {
                            setSelectedAsset(nft);
                            setSubPage(1);
                          }}
                        />
                      );
                    })}
              </div>
            </div>
          </div>
        )}

        {subPage == 2 && (
          <div className={styles.modal}>
            <div className={styles["modal-body"]}>
              {selectedAsset.hasOwnProperty("contentUrl") && selectedAsset && selectedAsset !== null ? (
                <NftCard
                  data={{
                    name: selectedAsset.name,
                    asaID: selectedAsset.id,
                    unitName: selectedAsset.unitName,
                    imgUrl: selectedAsset.contentUrl,
                    optIn: selectedAsset.balance,
                  }}
                />
              ) : (
                <div className={`${styles.info} flex-row justify-content-between align-items-center`}>
                  <b> Asset </b>
                  <div className={`${styles["option-asset"]} align-items-center`}>
                    <div>
                      <img
                        className={styles["asset-icon"]}
                        src={`${selectedAsset.id === 0 ? "/images/assets-icons/ALGO.svg" : "/images/assets-icons/CUSTOM.svg"}`}
                        alt="asset-logo"
                      />
                    </div>
                    <div>
                      <b>
                        {selectedAsset.name} {selectedAsset["id"] != 0 ? `(${selectedAsset["id"]})` : ""}
                      </b>
                    </div>
                    <a href={`${getExplorerURL()}/asset/${selectedAsset.id}`} rel="noreferrer" target="_blank">
                      <Image
                        alt="Icon External Link"
                        src="/images/safe/icon-external-link.svg"
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                      />
                    </a>
                  </div>
                </div>
              )}
              <div className={styles.borderLine}>
                <div className="flex-grow-1">
                  <BorderDivider></BorderDivider>
                </div>
              </div>
              <div className={`${styles.info} flex-row justify-content-between align-items-center`}>
                <b> Recipient </b>
                <div className="d-flex align-items-end flex-column justify-content-end gap-1">
                  {nfdRecepientName !== "" && <b> {nfdRecepientName} </b>}
                  <AddressGroup
                    isTruncate
                    noQRCode
                    address={recipientData.address}
                    linkAddress={`${getExplorerURL()}/address/${recipientData.address}`}
                  />
                </div>
              </div>
              {!selectedAsset.hasOwnProperty("contentUrl") && (
                <div className={`${styles.info} flex-row justify-content-between align-items-center`}>
                  <b> Amount </b>
                  <div className={`${styles["option-asset"]} align-items-center`}>
                    <div>
                      {digitGroupingRoundUp(typeof amount == "string" ? parseFloat(amount) : amount, selectedAsset.decimals ?? 0)}
                    </div>
                  </div>
                </div>
              )}

              {!!errorMsg && <Alert message={errorMsg} />}

              <BorderDivider></BorderDivider>

              <div>You are about to send the following asset stated above.</div>

              {/* <div className="flex-grow-1 d-md-none"></div> */}

              {selectedAsset.id != 0 && amount == selectedAsset.balance / Math.pow(10, selectedAsset.decimals) && (
                <>
                  <BorderDivider></BorderDivider>
                  <div className={styles.checkbox}>
                    <input
                      className={styles["checkbox-input"]}
                      type="checkbox"
                      role="button"
                      onClick={() => setIsCheckboxChecked(!isCheckboxChecked)}
                    />
                    <label className="form-check-label">I would also like to remove this asset from the account.</label>
                  </div>

                  {isCheckboxChecked && (
                    <div className={styles["warning-message"]}>
                      Opting out lowers the required minimum balance for your Safe. However;
                      <ul>
                        <li>
                          By opting out, you <b>will no longer hold/receive this asset</b> unless you add it again.
                        </li>
                        <li>
                          This can be done when the <b>asset&#39;s balance is zero.</b>
                        </li>
                        {!isLedger && (
                          <li>
                            The pending transaction will be labelled as <b>&#39;Remove Asset&#39;</b> and more information can be
                            found within.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles["modal-footer"]}>
              <div className={`btn-input-box`}>
                {isLedger && (
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
                {isConnectingLedger ? (
                  <div className={`${styles["btn-wrapper"]} flex-column-reverse flex-md-row`}>
                    <Button primary className="flex-grow-1 w-100" disabled={true}>
                      CONNECTING TO LEDGER...
                    </Button>
                  </div>
                ) : (
                  <div className={`${styles["btn-wrapper"]} flex-column-reverse flex-md-row`}>
                    <Button
                      className={styles.btn}
                      cancel
                      onClick={() => {
                        setSubPage(1);
                        setIsCheckboxChecked(false);
                      }}
                    >
                      BACK
                    </Button>
                    <Button className={styles.btn} primary onClick={isLedger ? submitLedger : submit}>
                      CONTINUE
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalGeneral>
    </div>
  );
};

export default ModalSendAsset;
