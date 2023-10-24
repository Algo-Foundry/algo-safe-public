import { useState, useEffect } from "react";
import styles from "./ModalRemoveAsset.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import BorderDivider from "frontend/components/UI/BorderDivider";
import React from "react";
import { Asset } from "shared/interfaces";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { PendingTxn } from "shared/interfaces";
import SafeService from "frontend/services/safe";
import NftService from "frontend/services/nft";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import {
  getRefreshAssetTableKey,
  setRefreshAssetTableKey,
  setIsModalProcessingClose,
  setIsModalFailClose,
} from "frontend/redux/features/asset/assetSlice";
import Router from "next/router";
import ModalCheckUrgent from "../ModalCheckUrgent";
import Image from "next/image";
import Search from "frontend/components/Icons/Search";
import NewTabs from "frontend/components/UI/NewTabs";
import NftCard from "frontend/components/UI/NftCard";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import useAssetCloseToPtxn from "frontend/hooks/useAssetCloseToPtxn";
import { Account, useWallet } from "@txnlab/use-wallet";
import usePtxnActions from "frontend/hooks/usePtxnActions";
import LedgerLoader from "frontend/components/UI/LedgerLoader";
import * as Sentry from "@sentry/nextjs";
import AssetModalCard from "frontend/components/UI/AssetModalCard";
import { errors } from "shared/constants";
import useLedger from "frontend/hooks/useLedger";

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  message?: string;
  errorDetails?: string;
}

interface Props {
  tokens?: Array<Asset>;
  nfts?: Array<any>;
  modalStatus: boolean;
  signer: LedgerAccount | Account | null;
  selectedSideBarAccount: SidebarAccount | null;
  onHide: () => void;
  onConfirm: () => void;
  onFail: () => void;
  selectedTabs?: (idx: number) => void;
  refreshAssets?: () => void;
}

const ModalRemoveAsset: React.FC<Props> = ({
  tokens = [],
  nfts = [],
  modalStatus,
  signer,
  selectedSideBarAccount,
  onHide,
  onConfirm,
  onFail,
  selectedTabs,
  refreshAssets,
}: Props) => {
  const ss = new SafeService();
  const ns = new NftService();
  const safe: any = useAppSelector(getSelectedSafe);
  const dispatch = useAppDispatch();
  const refreshAssetTableKey: any = useAppSelector(getRefreshAssetTableKey);
  const { connect } = useLedger();
  const [selectedAsset, setSelectedAsset] = useState<Asset | any>({});
  const [creatorAddr, setCreatorAddr] = useState("");
  const [assetNftUrl, setAssetNftUrl] = useState("");
  const [assetUnitName, setAssetUnitName] = useState("");
  const [isAssetNft, setIsAssetNft] = useState(false);
  const [isLedger, setIsLedger] = useState(false);
  const [signerUsesLedger, setSignerUsesLedger] = useState(false);
  const [isConnectingLedger, setIsConnectingLedger] = useState(false);

  const setNftData = () => {
    const nftData = {
      name: selectedAsset.name,
      asaID: selectedAsset.id,
      unitName: selectedAsset["unit-name"],
      balance: selectedAsset.balance,
      imgUrl: assetNftUrl,
    };
    return nftData;
  };

  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if (selectedAsset != null) {
        const nft = nfts.find((e) => e.id == selectedAsset.id);
        const asset = tokens.find((e) => e.id == selectedAsset.id);

        if (nft != undefined) {
          if (nft?.creator) setCreatorAddr(nft?.creator);
          const formattedNft = await ns.formatNft(nft.id);
          const url = formattedNft.contentUrl;
          setAssetNftUrl(url);
          setIsAssetNft(true);
        }

        if (asset != undefined) {
          if (asset?.creator) setCreatorAddr(asset?.creator);
          setAssetUnitName(asset["unit-name"]);
          setIsAssetNft(false);
        }
      }
    });
    return () => clearTimeout(timeOutId);
  }, [selectedAsset, nfts, tokens]);

  useEffect(() => {
    // determine if ledger is used to sign txns
    const usesLedger =
      signer?.hasOwnProperty("ledgerAddress") || selectedSideBarAccount?.hasOwnProperty("ledgerAddress") || false;
    setSignerUsesLedger(usesLedger);

    // determine if sidebar account is a ledger or a safe
    const sidebarAccIsLedger = selectedSideBarAccount?.hasOwnProperty("ledgerAddress") || false;
    setIsLedger(sidebarAccIsLedger);
  }, [signer, selectedSideBarAccount]);

  const [errorDetails, setErrorDetails] = useState("");
  const [subPage, setSubPage] = useState(1);

  const [responseModalShow, setResponseModalShow] = useState(false);
  const [typeModal, setTypeModal] = useState("success-ptxn");
  const [successTxId, setSuccessTxId] = useState("");
  const [lsig_address, setLsig_address] = useState("");

  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const itemsModal = ["Creating ", "Processing", "Success"];
  const [checkUrgentModal, setCheckUrgentModal] = useState(false);
  const [modalShow, setmodalShow] = useState(false);

  useEffect(() => {
    if (!checkUrgentModal) {
      setmodalShow(false);
    } else {
      setmodalShow(true);
    }
  }, [checkUrgentModal, modalShow]);

  const clearPage = () => {
    setSubPage(1);
  };

  const onHideModal = () => {
    setErrorDetails("");
    onHide();
    clearPage();
  };

  const { handleCloseToPtxn, handleCloseFromLedgerToPtxn } = useAssetCloseToPtxn();
  const { signTransactions, sendTransactions } = useWallet();

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
    onHideModal();
  }

  const submit = async () => {
    if (!selectedAsset.id) {
      throw new Error(errors.ERR_EMPTY_ASSET_ID);
    }

    if (!signer) {
      throw new Error(errors.ERR_NO_AVAILABLE_SIGNERS);
    }

    // check ledger connection
    if ("ledgerAddress" in signer) {
      setIsConnectingLedger(true);
      try {
        await connect();
      } catch (err) {
        catchError(err);
        return;
      } finally {
        setIsConnectingLedger(false);
      }
    }

    // check urgent ptxn
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

    try {
      const { res, ptxnData, confirmation } = await handleCloseToPtxn(
        safe,
        selectedAsset.id,
        signer,
        creatorAddr,
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
          step: "Remove Asset",
          safe: safe,
          assetId: selectedAsset.id,
          signer: signer?.address,
          recipient: creatorAddr,
        },
      });
      catchError(err);
    } finally {
      setLoadingModalShow(false);
    }
  };

  const submitLedger = async () => {
    if (!selectedAsset.id) {
      throw new Error(errors.ERR_EMPTY_ASSET_ID);
    }

    if (!signer || !("ledgerAddress" in signer)) {
      throw new Error(errors.ERR_NO_AVAILABLE_SIGNERS);
    }

    setStepProgress(1);
    dispatch(setIsModalProcessingClose(false));
    dispatch(setIsModalFailClose(true));
    try {
      setIsConnectingLedger(true);
      const { response, confirmation } = await handleCloseFromLedgerToPtxn(signer, selectedAsset.id, setStepProgress);
      if (confirmation !== undefined) {
        finishTransaction(response, true);
      }
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          step: "Remove Asset - Ledger",
          selectedAccountAddress: signer?.address,
          selectedAccountName: signer?.name,
          selectedAssetId: selectedAsset.id,
        },
      });
      catchError(err);
    } finally {
      setLoadingModalShow(false);
      setIsConnectingLedger(false);
    }
  };

  //execute modal
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
          step: "Remove Asset - Execute Ptxn",
          safe: safe,
          signer: signer?.address,
          item: JSON.stringify(item),
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

  function ModalTitle() {
    return (
      <div className={styles["modal-title"]}>
        <div>Remove Asset</div>
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

  return (
    <div>
      <ModalCheckUrgent
        modalStatus={checkUrgentModal}
        onHide={() => {
          setCheckUrgentModal(false);
          setmodalShow(true);
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
            }
          }
        }}
      />

      <ModalLoadingTx title="Transaction is Processing" items={itemsModal} modalStatus={loadingModalShow} step={stepProgress} />

      <ModalGeneral
        onHide={onHideModal}
        modalStatus={modalStatus && !modalShow}
        fullscreenSm
        titleChild={<ModalTitle />}
        backdrop="static"
        isPaddingTitleFixed
        classNameBody={styles["modal-custom-body"]}
      >
        <div className={styles.modal}>
          {subPage == 1 && (
            <>
              <div className={styles["modal-body"]}>
                <span>
                  {"Removing an asset will lower your account's minimum balance. Only assets with zero balances can be removed."}
                </span>
              </div>
              <div className={styles["modal-body"]}>
                <BorderDivider />
                <div className={styles.boxSearch}>
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
                    tokens
                      ?.filter((token) => token["unit-name"]?.toLowerCase().includes(searchAsset) && token?.balance == 0)
                      .map((token) => {
                        return (
                          <AssetModalCard
                            key={token.id}
                            isNft={false}
                            asset={token}
                            isRemove={true}
                            onClick={() => {
                              setSelectedAsset(token);
                              setSubPage(2);
                            }}
                          />
                        );
                      })}

                  {tabsData[1].isActive &&
                    nfts
                      ?.filter((nft) => nft["name"]?.toLowerCase().includes(searchAsset) && nft.balance == 0)
                      .map((nft) => {
                        return (
                          <AssetModalCard
                            key={nft.id}
                            isNft={true}
                            isRemove={true}
                            asset={nft}
                            onClick={() => {
                              setSelectedAsset(nft);
                              setSubPage(2);
                            }}
                          />
                        );
                      })}
                </div>
              </div>
            </>
          )}
          {Object.keys(selectedAsset).length !== 0 && subPage == 2 && (
            <>
              <div className={styles["modal-header"]}>
                <div className={styles["container"]}>
                  <div className={`${styles["assets"]} w-100`}>
                    {isAssetNft ? (
                      <NftCard data={setNftData()} />
                    ) : (
                      <div className={styles["asset-token"]}>
                        <img
                          className={styles["asset-icon"]}
                          src={selectedAsset.imgUrl}
                          alt={assetUnitName + ` logo`}
                          onError={({ currentTarget }) => {
                            currentTarget.onerror = null; // prevents looping
                            currentTarget.src = "/images/assets-icons/CUSTOM.svg";
                          }}
                        />
                        <div className={`${styles["asset-unit"]} gap-1 align-items-center`}>
                          {assetUnitName && <span>{assetUnitName}</span>}
                          <div className={styles["asset-id"]}>
                            <span>({selectedAsset.id})</span>
                          </div>
                          {selectedAsset.isVerified && (
                            <div className={styles["linkIcon"]}>
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles["modal-body"]}>
                <BorderDivider />
                <span>
                  You are about to create a transaction to remove and opt-out of this asset. To receive this asset in future, you
                  will need to add this asset again.
                </span>
              </div>
              <div className={styles["modal-footer"]}>
                {signerUsesLedger && (
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
                {!isConnectingLedger ? (
                  <div className={styles["btns-container"]}>
                    <div className={styles["btn-wrapper"]}>
                      <Button
                        style={{ color: `black` }}
                        className="flex"
                        onClick={() => {
                          setSubPage(1);
                          setSelectedAsset({});
                        }}
                      >
                        BACK
                      </Button>
                    </div>
                    <div className="btn-wrapper">
                      <Button primary className="flex-grow-1 w-100" onClick={isLedger ? submitLedger : submit}>
                        CONFIRM
                      </Button>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </>
          )}
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalRemoveAsset;
