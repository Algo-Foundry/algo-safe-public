/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import styles from "./LedgerDetails.module.scss";
import Button from "frontend/components/Button";
import Search from "frontend/components/Icons/Search";
import Sort from "frontend/components/Icons/Sort";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import { Collapse } from "react-bootstrap";
import Done from "frontend/components/Icons/Done";
import Image from "next/image";
import { digitGroupingRoundUp, getExplorerURL, priceDecimalDigit } from "shared/utils";
import Setting from "frontend/components/Icons/Setting";
import MoneyCircle from "frontend/components/Icons/MoneyCircle";
import Receipt from "frontend/components/Icons/Receipt";
import Apps from "frontend/components/Icons/Apps";
import BalanceOverview from "frontend/components/UI/BalanceOverview";
import NewTabs from "frontend/components/UI/NewTabs";
import ModalMinimumBalance from "../AssetsTable/ModalMinimumBalance";
import ArrowLeftSmall from "frontend/components/Icons/ArrowLeftSmall";
import DeleteSweepWhite from "frontend/components/Icons/DeleteSweepWhite";
import MoneySendIcon from "frontend/components/Icons/MoneySend";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import {
  getNumOfPtxn,
  getSigner,
  getSelectedSafe,
  setIsHaveUrgentPtxn,
  getIsHaveUrgentPtxn,
} from "frontend/redux/features/safe/safeSlice";
import { setAssets as setAllAssets } from "frontend/redux/features/asset/assetSlice";
import AppConfig from "config/appConfig";
import ModalRemoveAsset from "../../ModalRemoveAsset";
import ModalSendAsset from "../../ModalSendAsset";
import ModalExceedPtxn from "frontend/components/Modal/ModalExceedPtxn";
import AssetHeader from "./AssetHeader";
import useLedger from "frontend/hooks/useLedger";
import usePagination from "frontend/hooks/usePagination";
import ModalAddNewAsset from "../ModalAddNewAsset";
import ModalReceiveAsset from "../../ModalReceiveAsset";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import DappsConnectedSection from "frontend/components/Dashboard/Content/Dapps/DappsConnectedSection";
import NftImage from "frontend/components/UI/NftImage";
import ModalNft from "../AssetsTable/ModalNft";
import useNft from "frontend/hooks/useNft";
import useFilter from "frontend/hooks/useFilter";
import WarningIcon from "frontend/components/Icons/Warning";
import MobileTabs from "frontend/components/UI/NewTabs/MobileTabs";
import SelectWalletDropdown from "frontend/components/UI/Safe/SelectWalletDropdown";
import SafeSettings from "../Settings/SafeSettings";
import LedgerTransactions from "./LedgerTransactions";
import TransactionsSafe from "frontend/components/Dashboard/Content/Transactions";
import { useRouter } from "next/router";
import NewAsset from "frontend/components/Icons/NewAsset";
import ArrowRightDouble from "frontend/components/Icons/ArrowRightDouble";
import ImageSearch from "frontend/components/Icons/ImageSearch";
import { Account } from "@txnlab/use-wallet";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import Asset from "shared/interfaces/Asset";
import Safe from "shared/interfaces/Safe";
import SafeService from "frontend/services/safe";
import { isEmpty } from "lodash";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";

const sortTokenValues = [
  {
    id: 4,
    value: "Default",
  },
  {
    id: 0,
    value: "Asset Name (A to Z)",
  },
  {
    id: 1,
    value: "Asset Name (Z to A)",
  },
  {
    id: 2,
    value: "Balance  (High to Low)",
  },
  {
    id: 3,
    value: "Balance  (Low to High)",
  },
];

const sortNftValues = [
  {
    id: 0,
    value: "Asset Name (A to Z)",
  },
  {
    id: 1,
    value: "Asset Name (Z to A)",
  },
  {
    id: 2,
    value: "Balance  (High to Low)",
  },
  {
    id: 3,
    value: "Balance  (Low to High)",
  },
];

export default function Dashboard() {
  const ss = new SafeService();
  const dispatch = useAppDispatch();
  const [numReviewPtxns, setNumReviewPtxns] = useState(0);
  const [tabsData, setTabsData] = useState([
    { name: "Assets", shortName: "Assets", isActive: true, icon: <MoneyCircle />, iconMob: "dollars" },
    { name: "Transactions", shortName: "Txn", isActive: false, icon: <Receipt />, iconMob: "transactions", numReviewPtxns: 0 },
    { name: "Connect Dapps", shortName: "Dapps", isActive: false, icon: <Apps />, iconMob: "apps" },
    { name: "Account Settings", shortName: "Settings", isActive: false, icon: <Setting />, iconMob: "settings" },
  ]);
  const [tabsTokenData, setTabsTokenData] = useState([
    { name: "Tokens", isActive: true },
    { name: "NFTs", isActive: false },
  ]);

  const [assets, setAssets] = useState<Asset[]>();
  const [searchToken, setSearchToken] = useState("");
  const [sortTokenDropdown, setSortTokenDropdown] = useState(false);
  const [selectedTokenSort, setSelectedTokenSort] = useState(sortTokenValues[0]);

  const [nfts, setNfts] = useState<Asset[]>();
  const [searchNft, setSearchNft] = useState("");
  const [sortNftDropdown, setSortNftDropdown] = useState(false);
  const [selectedNftSort, setSelectedNftSort] = useState(sortNftValues[0]);

  const [modalMinimumBalance, setModalMinimumBalance] = useState(false);
  const numOfPtxn = useAppSelector(getNumOfPtxn);
  const [modalExceedPtxn, setModalExceedPtxn] = useState(false);
  const [selectAssetId, setSelectAssetId] = useState<number | undefined>(undefined);
  const [modalSendAssetShow, setModalSendAssetShow] = useState(false);
  const [modalRemoveAssetShow, setModalRemoveAssetShow] = useState(false);
  const { fetchAssetBalances, getAccount } = useLedger();
  const [isLoading, setIsLoading] = useState(false);
  const [totalAssetCountMessage, setTotalAssetCountMessage] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalReceiveAssetShow, setModalReceiveAssetShow] = useState(false);
  // update the address later after navbar integrated
  const selectedAccount = useAppSelector(getSelectedAccount);
  const selectedSafe: object | Safe = useAppSelector(getSelectedSafe);
  const isHaveUrgentPtxn: boolean = useAppSelector(getIsHaveUrgentPtxn);
  const [ledgerBalance, setLedgerBalance] = useState(0);

  const [windowWidth, setWindowWidth] = useState(0);

  const [detailNftData, setDetailNftData] = useState(null);
  const [modalDetailNft, setModalDetailNft] = useState(false);
  const [signer, setSigner] = useState<LedgerAccount | Account | null>(null);

  const router = useRouter();
  const { query } = router;

  const selectedTabs = (index: number) => {
    setTabsData((prevItems) => prevItems.map((e, i) => ({ ...e, isActive: i === index })));
  };

  const selectedTokenTabs = (index: number) => {
    setTabsTokenData((prevItems) => prevItems.map((e, i) => ({ ...e, isActive: i === index })));
  };

  const handleSendAsset = (assetId: number | Asset) => {
    if (numOfPtxn >= AppConfig.maxPtxn) {
      setModalExceedPtxn(true);
      return;
    }
    const selectedId = typeof assetId === "number" ? assetId : assetId?.id;
    setSelectAssetId(selectedId);
    setModalSendAssetShow(true);
  };

  const handleRemoveAsset = () => {
    if (numOfPtxn >= AppConfig.maxPtxn) {
      setModalExceedPtxn(true);
      return;
    }
    setModalRemoveAssetShow(true);
  };

  const { format } = useNft();

  const safeSigner = useAppSelector(getSigner);
  const fetchSigner = async () => {
    // if sidebar account is a ledger, pass the ledger as the signer
    if (selectedAccount?.hasOwnProperty("ledgerAddress")) {
      const ledgerAccount = await getAccount(
        selectedAccount?.ledgerAddress as string,
        selectedAccount?.address,
        selectedAccount?.name
      );
      setSigner(ledgerAccount);
    } else {
      // if sidebar account is a safe, get the signer from redux
      setSigner(safeSigner);
    }
    return signer;
  };

  const getAssets = async () => {
    if (!selectedAccount) return;
    const { name, address } = selectedAccount;
    if (name === undefined || address === undefined) return;
    setTotalAssetCountMessage("");
    setIsLoading(true);
    const { nfts, tokens, accountValue, assets } = await fetchAssetBalances(address, setTotalAssetCountMessage);
    setAssets(tokens);
    dispatch(setAllAssets(assets));
    setNfts(nfts);
    setIsLoading(false);
    setLedgerBalance(Math.round(accountValue * 100) / 100);
  };

  useEffect(() => {
    const numReviewPtxnTabSetter = async () => {
      if (!isEmpty(selectedSafe)) {
        const ptxns = await ss.getSafePendingTransactions(selectedSafe as Safe, signer?.address as string);
        const reviewPtxns = ptxns.filter((ptxn) => ptxn.status == "Need Confirmation" || ptxn.status == "Ready");
        if (reviewPtxns.length != tabsData[1].numReviewPtxns) {
          setTabsData((prevTabsData) =>
            prevTabsData.map((tab) => {
              if (tab.name === "Transactions") {
                return { ...tab, numReviewPtxns: reviewPtxns.length };
              }
              return tab;
            })
          );
        }
        setNumReviewPtxns(reviewPtxns.length);
      }
    };
    numReviewPtxnTabSetter();
    const interval = setInterval(numReviewPtxnTabSetter, 180000);
    return () => clearInterval(interval);
  }, [safeSigner?.address, selectedSafe]);

  useEffect(() => {
    if (router.isReady && selectedAccount?.address && tabsData[0].isActive) getAssets();
  }, [tabsData[0].isActive, selectedAccount?.address, router.isReady]);

  useEffect(() => {
    fetchSigner();
  }, [selectedAccount, safeSigner]);

  // to check if sidebar account is ledger
  const checkIsLedger = selectedAccount?.hasOwnProperty("ledgerAddress");

  useEffect(() => {
    const checkUrgentPtxn = async () => {
      if (Object.keys(selectedSafe).length !== 0 && !checkIsLedger) {
        const selectedSafeIsSafe = selectedSafe as Safe;
        const appGS = await ss.getSafeGlobalState(selectedSafeIsSafe.appId);
        const getUrgentRequestPtxn = await ss.getUrgentPtxn(selectedSafe as Safe, appGS);
        if (getUrgentRequestPtxn) {
          dispatch(setIsHaveUrgentPtxn(true));
        } else {
          dispatch(setIsHaveUrgentPtxn(false));
        }
      } else {
        dispatch(setIsHaveUrgentPtxn(false));
      }
    };
    checkUrgentPtxn();
  }, [selectedSafe]);

  useEffect(() => {
    if (router.isReady && selectedAccount && !isLoading) {
      getAssets();

      let tabIndex;
      if (query.tab !== undefined && !((query.tab as any) < 0)) {
        tabIndex = Number(query.tab);
      } else {
        tabIndex = 0;
      }
      let tabs;
      if (checkIsLedger) {
        if (tabIndex > 2) tabIndex = 0;
        tabs = [
          { name: "Assets", shortName: "Assets", isActive: false, icon: <MoneyCircle />, iconMob: "dollars" },
          {
            name: "Transactions",
            shortName: "Txn",
            isActive: false,
            icon: <Receipt />,
            iconMob: "transactions",
            numReviewPtxns: numReviewPtxns,
          },
          { name: "Connect Dapps", shortName: "Dapps", isActive: false, icon: <Apps />, iconMob: "apps" },
        ];
        tabs[tabIndex].isActive = true;
        setTabsData(tabs);
      } else {
        if (tabIndex > 3) tabIndex = 0;
        tabs = [
          { name: "Assets", shortName: "Assets", isActive: false, icon: <MoneyCircle />, iconMob: "dollars" },
          {
            name: "Transactions",
            shortName: "Txn",
            isActive: false,
            icon: <Receipt />,
            iconMob: "transactions",
            numReviewPtxns: numReviewPtxns,
          },
          { name: "Connect Dapps", shortName: "Dapps", isActive: false, icon: <Apps />, iconMob: "apps" },
          { name: "Account Settings", shortName: "Settings", isActive: false, icon: <Setting />, iconMob: "settings" },
        ];
        tabs[tabIndex].isActive = true;
        setTabsData(tabs);
      }
    }
  }, [selectedAccount, router]);

  const { filteredSortedAssets } = useFilter(assets, searchToken, selectedTokenSort, false);

  const { filteredSortedAssets: filteredSortedNft } = useFilter(nfts, searchNft, selectedNftSort, true);

  const {
    currentItems: nftCurrentItems,
    goToNextPage: nftGoToNextPage,
    goToPreviousPage: nftGoToPreviousPage,
    currentTotalItem: nftCurrentTotalItem,
    goToPage: nftGoToPage,
    totalPages: nftTotalPages,
    currentPage: nftCurrentPage,
  } = usePagination(filteredSortedNft, 20);

  const createNewAsset = () => {
    if (numOfPtxn >= AppConfig.maxPtxn) {
      setModalExceedPtxn(true);
      return;
    }
    setModalShow(true);
  };

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowResize);

    handleWindowResize();

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [windowWidth]);

  const maxNftText = (str: string, isSmall: boolean) => {
    let max;
    if (isSmall) {
      max = windowWidth >= 768 ? 22 : 20;
    } else {
      max = windowWidth >= 768 ? 23 : 21;
    }

    if (str.length > max) {
      return str.substring(0, max - 3) + "...";
    } else {
      return str;
    }
  };

  const formatPriceNum = (asset: Asset) => {
    const price = digitGroupingRoundUp(asset.price || 0, priceDecimalDigit(asset.price || 0));
    const number = Number(price.replace(/,/g, ""));
    if (number !== Math.floor(number) && number > 1) {
      return price;
    } else {
      return number > 1 ? `${price}.00` : price;
    }
  };

  return (
    <>
      <ModalLoadingTx title={`Fetching Data .... ${totalAssetCountMessage}`} modalStatus={isLoading} />
      {detailNftData !== null && (
        <ModalNft
          modalStatus={modalDetailNft}
          dataNft={detailNftData}
          onReceive={() => {
            setModalReceiveAssetShow(true);
          }}
          onHide={() => {
            setModalDetailNft(false);
          }}
          onSend={() => {
            handleSendAsset(detailNftData);
            setModalDetailNft(false);
          }}
          onRemove={() => {
            handleRemoveAsset();
            setModalDetailNft(false);
          }}
        />
      )}
      {selectedAccount && (
        <>
          <ModalReceiveAsset
            modalStatus={modalReceiveAssetShow}
            assets={tabsTokenData[0].isActive ? assets : nfts}
            onHide={() => {
              setModalReceiveAssetShow(false);
            }}
            onConfirm={() => {
              setModalReceiveAssetShow(false);
            }}
          />
          <ModalAddNewAsset
            modalStatus={modalShow}
            isLedger={checkIsLedger}
            onHide={() => {
              setModalShow(false);
            }}
            onConfirm={() => {
              setModalShow(false);
            }}
            onFail={() => {
              setModalShow(true);
            }}
            selectedTabs={(idx) => selectedTabs(idx)}
            refreshAssets={() => getAssets()}
          />
          <ModalMinimumBalance
            modalStatus={modalMinimumBalance}
            isLedger={checkIsLedger}
            onHide={() => {
              setModalMinimumBalance(false);
            }}
          />
          <ModalExceedPtxn
            modalStatus={modalExceedPtxn}
            onHide={() => {
              setModalExceedPtxn(false);
            }}
          />

          <ModalRemoveAsset
            tokens={assets}
            nfts={nfts}
            modalStatus={modalRemoveAssetShow}
            signer={signer}
            selectedSideBarAccount={selectedAccount}
            onHide={() => {
              setModalRemoveAssetShow(false);
            }}
            onConfirm={() => {
              setModalRemoveAssetShow(false);
            }}
            onFail={() => {
              setModalRemoveAssetShow(true);
            }}
            selectedTabs={(idx) => selectedTabs(idx)}
            refreshAssets={() => getAssets()}
          />

          <ModalSendAsset
            tokens={assets}
            nfts={nfts}
            modalStatus={modalSendAssetShow}
            selectAssetId={selectAssetId}
            assets={tabsTokenData[0].isActive ? assets : nfts}
            isLedger={checkIsLedger}
            nftData={detailNftData}
            onHide={() => {
              setModalSendAssetShow(false);
            }}
            onConfirm={() => {
              setModalSendAssetShow(false);
            }}
            onFail={() => {
              setModalSendAssetShow(true);
            }}
            selectedTabs={(idx) => selectedTabs(idx)}
            refreshAssets={() => getAssets()}
          />

          <div className={styles["ledger-details"]}>
            {isHaveUrgentPtxn && (
              <div className={`${styles["attention-box"]}`}>
                <img src="/images/icon-exclamation.svg" alt="" />
                <p>
                  You have{" "}
                  <span onClick={() => selectedTabs(1)} className={styles.urgentTxText}>
                    urgent transactions
                  </span>{" "}
                  that need to be resolved before performing other actions.
                </p>
              </div>
            )}
            <BalanceOverview
              name={selectedAccount.name}
              balance={ledgerBalance}
              addr={selectedAccount.address}
              appId={selectedAccount?.appId}
              onReceive={() => setModalReceiveAssetShow(true)}
              onSend={() => {
                setSelectAssetId(0);
                setModalSendAssetShow(true);
              }}
            />
            <div className={styles["tab-menu"]}>
              <NewTabs tabsData={tabsData} selectedTab={selectedTabs} />
            </div>
            {!checkIsLedger && (
              <div className={`${styles["switcher-mobile"]} w-100`}>
                <div className={styles.selectWallet}>
                  <p className={styles.title}>Active Signer:</p>
                  <div className={styles.selectWalletDropdown}>
                    <SelectWalletDropdown isComponentSm />
                  </div>
                </div>
              </div>
            )}
            {tabsData[0].isActive && (
              <>
                <div className={`${styles["switcher-mobile"]} w-100 ${checkIsLedger && "mt-3"}`}>
                  <NewTabs tabsData={tabsTokenData} selectedTab={selectedTokenTabs} />
                </div>
                <div className={styles["tabs-details"]}>
                  <div className={styles["actions-container"]}>
                    <div className={styles["switcher"]}>
                      <div
                        onClick={() => selectedTokenTabs(0)}
                        className={`${tabsTokenData[0].isActive && styles["active"]} ${styles["pills"]}`}
                      >
                        Tokens
                      </div>
                      <div
                        onClick={() => selectedTokenTabs(1)}
                        className={`${tabsTokenData[1].isActive && styles["active"]} ${styles["pills"]}`}
                      >
                        NFTs
                      </div>
                    </div>
                    <div className={styles["buttons-container"]}>
                      <div className={`${styles["filter-container"]} ${styles["mobile-grow"]} flex-row-reverse flex-lg-row`}>
                        {tabsTokenData[0].isActive ? (
                          <>
                            <div className={styles.boxSearch}>
                              <input
                                id="id"
                                type="text"
                                className={`form-controls ${styles.inputSearch}`}
                                placeholder="Search Asset"
                                onChange={(e) => {
                                  setSearchToken(e.currentTarget.value);
                                }}
                                value={searchToken}
                              />
                              <Search />
                            </div>
                            <div className={styles.boxSorting}>
                              <button
                                className={`${styles.btnSort}`}
                                onClick={() => {
                                  if (filteredSortedAssets && filteredSortedAssets.length > 0) {
                                    setSortTokenDropdown(!sortTokenDropdown);
                                  }
                                }}
                              >
                                <Sort />
                                <div className={`${styles.wrapTextBtnSelected}`}>
                                  <div>{selectedTokenSort.value}</div>
                                  <ArrowDown />
                                </div>
                              </button>
                              {
                                <Collapse in={sortTokenDropdown}>
                                  <div className={styles.dropdownSort}>
                                    {sortTokenValues.map((sort, i) => {
                                      return (
                                        <div
                                          className={`${styles.wrapTextBtn} ${selectedTokenSort.id === sort.id && styles.active}`}
                                          key={"token-" + i}
                                          onClick={() => {
                                            setSortTokenDropdown(false);
                                            setSelectedTokenSort(sort);
                                          }}
                                        >
                                          <div>{sort.value}</div>
                                          {selectedTokenSort.id === sort.id && <Done />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Collapse>
                              }
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={styles.boxSearch}>
                              <input
                                id="id"
                                type="text"
                                className={`form-controls ${styles.inputSearch}`}
                                placeholder="Search Asset"
                                onChange={(e) => {
                                  setSearchNft(e.currentTarget.value);
                                  nftGoToPage(1);
                                }}
                                value={searchNft}
                              />
                              <Search />
                            </div>
                            <div className={styles.boxSorting}>
                              <button className={`${styles.btnSort}`} onClick={() => setSortNftDropdown(!sortNftDropdown)}>
                                <Sort />
                                <div className={`${styles.wrapTextBtn} d-none d-lg-flex`}>
                                  <div>{selectedNftSort.value}</div>
                                  <ArrowDown />
                                </div>
                              </button>
                              {
                                <Collapse in={sortNftDropdown}>
                                  <div className={styles.dropdownSort}>
                                    {sortNftValues.map((sort, i) => {
                                      return (
                                        <div
                                          className={styles.wrapTextBtn}
                                          key={"nft-" + i}
                                          onClick={() => {
                                            setSortNftDropdown(false);
                                            setSelectedNftSort(sort);
                                          }}
                                        >
                                          <div>{sort.value}</div>
                                          {selectedNftSort.id === sort.id && <Done />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Collapse>
                              }
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`${styles["filter-container"]}`}>
                        <Button
                          primary
                          className={`${styles["action-btn-top"]}`}
                          onClick={() => createNewAsset()}
                          disabled={isHaveUrgentPtxn}
                        >
                          <div className={styles["new-asset-icon"]}>
                            <NewAsset />
                          </div>
                        </Button>
                        <Button
                          danger
                          className={`${styles["action-btn-top"]}`}
                          onClick={() => {
                            handleRemoveAsset();
                          }}
                          disabled={isHaveUrgentPtxn}
                        >
                          <div className={styles["new-asset-icon"]}>
                            <DeleteSweepWhite />
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles["table-container"]} ${tabsTokenData[0].isActive && styles["token-border"]}`}>
                    {tabsTokenData[0].isActive ? (
                      <>
                        <table className={`table mb-0 ${styles.tableDesktop}`}>
                          <thead>
                            <tr>
                              <th scope="col" style={{ width: "20%" }}>
                                Assets
                              </th>
                              <th scope="col" className="text-end" style={{ width: "15%" }}>
                                Balance
                              </th>
                              <th scope="col" className="text-end" style={{ width: "17%" }}>
                                Value
                              </th>
                              <th scope="col" className="text-end" style={{ width: "16%" }}>
                                Price
                              </th>
                              <th scope="col" className={styles.spacer}></th>
                            </tr>
                          </thead>
                          <tbody className={styles.tbody}>
                            <>
                              {filteredSortedAssets && filteredSortedAssets.length == 0 && (
                                <tr>
                                  <td colSpan={99}>
                                    <div className={styles.emptyToken}>
                                      <div>
                                        <img src="/images/token-no-found.svg" alt="" />
                                      </div>
                                      <p>No Token found</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              {filteredSortedAssets &&
                                filteredSortedAssets.length > 0 &&
                                filteredSortedAssets.map((asset: Asset, i: number) => (
                                  <tr className={styles["tr-item"]} key={"asset-" + i}>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <div className={styles["asset-icon"]}>
                                          <img src={asset.imgUrl} style={{ width: "100%", height: "100%" }} />
                                        </div>

                                        <div className="d-flex gap-1 align-items-center">
                                          <span>
                                            {asset["unit-name"]}{" "}
                                            {asset["id"] !== 0 && (
                                              <span className={styles.assetIdBox}> {`(${asset["id"]})`}</span>
                                            )}
                                          </span>
                                          <span className="d-flex gap-1 align-items-center">
                                            {asset.name == "ALGO" && (
                                              <div
                                                role="button"
                                                className={`d-flex gap-1 align-items-center ${styles.linkIcon}`}
                                                onClick={() => {
                                                  setModalMinimumBalance(true);
                                                }}
                                              >
                                                <Image
                                                  alt="Icon Info"
                                                  src="/images/icon-info-black.svg"
                                                  className="d-flex gap-1 align-items-center"
                                                  layout="fill"
                                                  objectFit="cover"
                                                  quality={100}
                                                />
                                              </div>
                                            )}
                                            {asset.isVerified && (
                                              <div className={`d-flex gap-1 align-items-center ${styles.linkIcon}`}>
                                                <Image
                                                  alt="Icon Info"
                                                  src="/images/icon-verified.svg"
                                                  className="d-flex gap-1 align-items-center"
                                                  layout="fill"
                                                  objectFit="cover"
                                                  quality={100}
                                                />
                                              </div>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-end">
                                      {asset.balance ? asset.balance / Math.pow(10, asset.decimals ?? 6) : 0}
                                    </td>
                                    <td className="text-end">
                                      ${digitGroupingRoundUp(asset.value || 0, priceDecimalDigit(asset.value || 0))}
                                    </td>
                                    <td className="text-end">${formatPriceNum(asset)}</td>
                                    <td className={styles.spacer}>
                                      <div className="d-flex gap-5 justify-content-end">
                                        <div className={`${isHaveUrgentPtxn && styles["disabledBtn"]}`}>
                                          <Button
                                            className={`${styles["action-btn"]} m-0`}
                                            style={{ display: "flex" }}
                                            onClick={() => {
                                              setDetailNftData(null);
                                              handleSendAsset(asset.id);
                                            }}
                                          >
                                            <div
                                              className={`d-flex align-items-center gap-2 ${
                                                isHaveUrgentPtxn && styles.disabledColor
                                              }`}
                                            >
                                              <div className={styles["new-asset-icon"]}>
                                                <MoneySendIcon />
                                              </div>
                                              <div> Send </div>
                                            </div>
                                          </Button>
                                        </div>
                                        <Button
                                          className={`${styles["action-btn"]} m-0`}
                                          style={{ display: "flex" }}
                                          onClick={() => {
                                            setModalReceiveAssetShow(true);
                                          }}
                                        >
                                          <div className="d-flex align-items-center gap-2">
                                            <div className={styles["new-asset-icon"]} style={{ transform: "rotate(180deg)" }}>
                                              <MoneySendIcon />
                                            </div>
                                            <div className={styles["action-button"]}> Receive </div>
                                          </div>
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </>
                          </tbody>
                        </table>
                        <div className={styles["table-mobile"]}>
                          <>
                            {filteredSortedAssets &&
                              filteredSortedAssets.length > 0 &&
                              filteredSortedAssets.map((asset: Asset, i: number) => (
                                <AssetHeader
                                  key={"asset-mobile-" + i}
                                  asset={asset}
                                  index={i}
                                  setModalMinimumBalance={setModalMinimumBalance}
                                  onSend={() => {
                                    setDetailNftData(null);
                                    handleSendAsset(asset.id);
                                  }}
                                  onReceive={() => setModalReceiveAssetShow(true)}
                                />
                              ))}
                          </>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          {nftCurrentItems.length !== 0 ? (
                            <div className={`${styles.boxNfts}`}>
                              {nftCurrentItems.map((nft: any, i: number) => {
                                return (
                                  <div className={styles.nftWrapBox} key={"nft-" + i}>
                                    <div className={styles.imgWrapNft}>
                                      <NftImage
                                        url={nft?.contentUrl ? nft.contentUrl : ""}
                                        isSizeFit
                                        isIconTop
                                        isBlur={nft.balance === 0}
                                        onModal={() => {
                                          setModalDetailNft(true);
                                          setDetailNftData(nft);
                                        }}
                                      />
                                      <div
                                        className={`
                                                    ${nft.balance === 0 ? "d-none" : styles.nftTotalSuply}
                                                  `}
                                      >
                                        x{nft.balance}
                                      </div>
                                    </div>
                                    <div className={`${styles.boxTextNft} ${nft.balance === 0 && styles.bottomNormal}`}>
                                      <div
                                        className={`
                                                    ${nft.balance !== 0 ? "d-none" : styles["warning-box"]}
                                                  `}
                                      >
                                        <div className={styles["warning-icon"]}>
                                          <WarningIcon></WarningIcon>
                                        </div>

                                        <div className="flex-grow-1 d-flex flex-column">
                                          You opted-in to this NFT but you are not the owner of it yet.
                                        </div>
                                      </div>
                                      <div className={styles.wrapTextNft}>
                                        <div className={styles.textTitle}>{maxNftText(nft.name ? nft.name : "-", true)}</div>
                                        <div className={styles.textSubtitle}>
                                          {maxNftText(
                                            nft.id.toString() + " | " + (nft["unit-name"] ? nft["unit-name"] : "-"),
                                            false
                                          )}
                                        </div>
                                      </div>
                                      {
                                        nft.balance !== 0 && (
                                          <Button
                                            primary
                                            className={`small-btn ${styles.nftBtn} `}
                                            onClick={() => {
                                              setDetailNftData(nft);
                                              handleSendAsset(nft.id);
                                            }}
                                            style={{ display: "flex", visibility: "visible" }}
                                          >
                                            <div className="d-flex align-items-center gap-1_5">
                                              <div className={styles["new-asset-icon"]}>
                                                <MoneySendIcon />
                                              </div>
                                              <div className={styles["action-button"]}> SEND </div>
                                            </div>
                                          </Button>
                                        )
                                        // : (
                                        //   <Button
                                        //     danger
                                        //     className={`small-btn ${styles.nftBtn}`}
                                        //     onClick={() => {
                                        //       handleRemoveAsset(nft.id);
                                        //     }}
                                        //     style={{ display: "flex", visibility: "visible" }}
                                        //   >
                                        //     <div className="d-flex align-items-center gap-1_5">
                                        //       <div className={styles["new-asset-icon"]}>
                                        //         <DeleteSweepWhite />
                                        //       </div>
                                        //       <div className={styles["action-button"]}> REMOVE </div>
                                        //     </div>
                                        //   </Button>)
                                      }
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className={styles.noNftBox}>
                              <ImageSearch />
                              <div className={styles.textNoFound}>
                                No NFT found in your Safe.{" "}
                                <span role="button" onClick={() => createNewAsset()}>
                                  Add a new NFT
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!tabsTokenData[0].isActive && (
                    <div className={styles.assetsPagination}>
                      <div className={styles.boxPagination}>
                        <div className={`d-flex align-items-center`}>
                          <div
                            className={`
                            ${styles.wrapPgnArrow} 
                            ${styles.right}
                            ${nftCurrentPage === 1 ? styles.disabled : ""}
                            `}
                            onClick={() => nftGoToPage(1)}
                          >
                            <ArrowRightDouble />
                          </div>
                          <div
                            className={`${styles.wrapPgnArrow} ${nftCurrentPage === 1 ? styles.disabled : ""}`}
                            onClick={() => nftGoToPreviousPage()}
                          >
                            <ArrowLeftSmall />
                          </div>
                          <div className={`${styles.textPagination} d-flex`}>
                            Page {nftCurrentPage} of {nftTotalPages !== 0 ? nftTotalPages : "1"}
                          </div>
                          <div
                            className={`${styles.wrapPgnArrow} ${styles.right} ${
                              nftCurrentPage === nftTotalPages || nftTotalPages === 0 ? styles.disabled : ""
                            }`}
                            onClick={() => nftGoToNextPage()}
                          >
                            <ArrowLeftSmall />
                          </div>
                          <div
                            className={`${styles.wrapPgnArrow} ${
                              nftCurrentPage === nftTotalPages || nftTotalPages === 0 ? styles.disabled : ""
                            }`}
                            onClick={() => nftGoToPage(nftTotalPages)}
                          >
                            <ArrowRightDouble />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {tabsData[1].isActive && <>{checkIsLedger ? <LedgerTransactions /> : <TransactionsSafe />}</>}
            {tabsData[2].isActive && <DappsConnectedSection isLedger={checkIsLedger} />}
            {!checkIsLedger && tabsData[3]?.isActive && <SafeSettings />}
          </div>

          <MobileTabs tabsData={tabsData} selectedTab={selectedTabs} isLedger={checkIsLedger} />
        </>
      )}
    </>
  );
}
