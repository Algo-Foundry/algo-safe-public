import styles from "./LedgerTransactions.module.scss";
import LedgerAccordion from "../LedgerAccordion";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import AccountService from "frontend/services/account";
import LedgerDetailTransaction from "../LedgerDetailTransaction";
import { useState, useEffect } from "react";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import Search from "frontend/components/Icons/Search";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import { Collapse } from "react-bootstrap";
import Done from "frontend/components/Icons/Done";
import Filter from "frontend/components/Icons/Filter";
import moment from "moment";
import useDebounce from "frontend/hooks/useDebounce";
import { uitypes } from "shared/constants";
import ModalRemoveTx from "frontend/components/Dashboard/ModalRemoveTx";
import ModalApproval from "frontend/components/Dashboard/ModalApproval";
import History from "frontend/components/Icons/History";
import { Asset } from "shared/interfaces";

interface Props {
  children?: React.ReactElement;
}

type AccordionState = { [key: number]: boolean };

const txnTypes = [
  {
    id: 0,
    value: "All Txn Types",
  },
  {
    id: 1,
    value: "Send Asset",
  },
  {
    id: 2,
    value: "Receive Asset",
  },
  {
    id: 3,
    value: "App Call",
  },
  {
    id: 4,
    value: "New Asset",
  },
  {
    id: 5,
    value: "Remove Asset",
  },
  {
    id: 6,
    value: "Others",
  },
];

const LedgerTransactions: React.FC<Props> = ({ children }: Props) => {
  const [txnHistory, setTxnHistory] = useState<any[]>([]);
  const [loader, setLoader] = useState(false);
  const [assetsTypes, setAssetsTypes] = useState<any>([]);
  const [searchHistory, setSearchHistory] = useState("");
  const [txnTypesDropdown, setTxnTypesDropdown] = useState(false);
  const [selectedTxnTypes, setSelectedTxnTypes] = useState(txnTypes[0]);
  const [assetTypesDropdown, setAssetTypesDropdown] = useState(false);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<any>({});
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isSearchHidden, setIsSearchHidden] = useState(false);
  const [isFilterHidden, setIsFilterHidden] = useState(false);
  const selectedAccount = useAppSelector(getSelectedAccount);
  const debouncedSearch = useDebounce(searchHistory, 1000);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [modalRemoveTx, setModalRemoveTxShow] = useState(false);
  const [modalApproval, setModalApprovalShow] = useState(false);
  const [accordionState, setAccordionState] = useState<AccordionState>({});

  const handleAccordionOpen = (index: number) => {
    const newAccordionState: AccordionState = {};
    Object.keys(accordionState).forEach((key) => {
      newAccordionState[parseInt(key)] = false;
    });

    // Open clicked accordion
    if (accordionState[index]) {
      newAccordionState[index] = false;
      if (screenWidth < 992) {
        document.body.style.overflowY = "auto";
      }
    } else {
      newAccordionState[index] = true;
      if (screenWidth < 992) {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        document.body.style.overflowY = "hidden";
      }
    }
    setAccordionState(newAccordionState);
  };

  useEffect(() => {
    const updateDimension = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", updateDimension);
    if (window.innerWidth < 768) {
      setIsFilterHidden(true);
      setIsSearchHidden(false);
    } else {
      setIsFilterHidden(false);
      setIsSearchHidden(false);
    }
    return () => {
      window.removeEventListener("resize", updateDimension);
    };
  }, [screenWidth]);

  const getTxnHistory = async () => {
    setLoader(true);

    if (!selectedAccount) return;

    const history = await AccountService.getTransactionHistory(selectedAccount.address);

    setTxnHistory(history.Transactions);

    const newAssets: any = [];
    history.Assets.forEach((value, key) => {
      const newAsset = { ...value, id: key };
      newAssets.push(newAsset);
    });

    const algoAsset: Asset = {
      id: 0,
      decimals: 6,
      "default-frozen": false,
      name: "ALGO",
      "name-b64": "QUxHTw==",
      total: 0,
      "unit-name": "ALGO",
      "unit-name-b64": "QUxHTw==",
      url: "",
    };

    newAssets.push(algoAsset);

    if (newAssets.length !== 0) {
      newAssets.unshift({
        id: 1,
        "unit-name": "All Assets",
      });

      setAssetsTypes(newAssets);
      setSelectedAssetTypes(newAssets[0]);
    }

    setLoader(false);
  };

  useEffect(() => {
    if (!selectedAccount) return;
    // fetchingFor is used to prevent multiple calls to get txn history when the previous call hasn't completed fetching data
    let fetchingFor = null;

    if (fetchingFor !== selectedAccount.address) {
      getTxnHistory();
    }

    return () => {
      fetchingFor = selectedAccount.address;
    };
  }, [selectedAccount]);

  useEffect(() => {
    // handle filtering here
    const filteredTxns = txnHistory.filter((tx: any) => {
      const uiType = tx["ui-type"];
      const txn = tx.txn;

      // filter by assets
      const passesAssetSearch = () => {
        if (assetsTypes.length === 0 || selectedAssetTypes.id === 1) return true;

        return (
          ("asset-transfer-transaction" in txn &&
            "asset-id" in txn["asset-transfer-transaction"] &&
            txn["asset-transfer-transaction"]["asset-id"] === selectedAssetTypes.id) ||
          ("payment-transaction" in txn && selectedAssetTypes.id === 0)
        );
      };

      // filter by ui type
      const passesUITypeSearch = () => {
        if (selectedTxnTypes.id === 0) return true;

        return uiType.toLowerCase().includes(selectedTxnTypes.value.toLowerCase());
      };

      // filter by search input
      const passesSearchInput = () => {
        // ignore empty searches
        if (searchHistory === "" || searchHistory === undefined) return true;

        if (uiType === uitypes.UI_APP_CALL) {
          return (
            txn.id.toLowerCase().includes(searchHistory.toLowerCase()) ||
            txn["application-transaction"]["application-id"].toString().toLowerCase().includes(searchHistory.toLowerCase())
          );
        } else {
          return txn.id.toLowerCase().includes(searchHistory.toLowerCase());
        }
      };

      return passesAssetSearch() && passesUITypeSearch() && passesSearchInput();
    });

    setFiltered(filteredTxns);
  }, [debouncedSearch, selectedTxnTypes.id, selectedAssetTypes.id, txnHistory]);

  return (
    <>
      <ModalApproval
        modalStatus={modalApproval}
        onHide={() => {
          setModalApprovalShow(false);
        }}
      />
      <ModalRemoveTx
        modalStatus={modalRemoveTx}
        onHide={() => {
          setModalRemoveTxShow(false);
        }}
      />
      <ModalLoadingTx title="Fetching Transactions History..." modalStatus={loader} />
      <div className={`${styles["tabs-details"]} ${children ? "py-0" : ""}`}>
        <div className={`${styles["filter-container"]} d-flex justify-content-between align-items-center w-100`}>
          {children}
          <div className={`${styles["filter-container"]} p-0`}>
            {!isSearchHidden && (
              <div className={`d-flex align-items-center gap-2 ${styles.wrapSearchMobile}`}>
                <div className={styles.boxSearch}>
                  <input
                    id="id"
                    type="text"
                    className={`form-controls ${styles.inputSearch}`}
                    placeholder="Search TX Hash or App ID"
                    onChange={(e) => {
                      setSearchHistory(e.currentTarget.value);
                    }}
                    value={searchHistory}
                  />
                  <Search />
                </div>
                <div
                  role="button"
                  className={`${styles["filterWrap"]}`}
                  onClick={() => {
                    setIsFilterHidden(false);
                    setIsSearchHidden(true);
                  }}
                >
                  <Filter />
                  {(selectedTxnTypes.id !== 0 || selectedAssetTypes.id !== 0) && <span className={`${styles.dot}`}></span>}
                </div>
              </div>
            )}
            {!isFilterHidden && (
              <div className={`d-flex align-items-center gap-2 ${styles.wrapSearchMobile}`}>
                <div
                  role="button"
                  className={`${styles["filterWrap"]}`}
                  onClick={() => {
                    setIsFilterHidden(true);
                    setIsSearchHidden(false);
                  }}
                >
                  <Search />
                </div>
                <div className={styles.boxSorting}>
                  <button className={`${styles.btnSort}`} onClick={() => setTxnTypesDropdown(!txnTypesDropdown)}>
                    <div className={`${styles.wrappedFilter}`}>
                      <div>{selectedTxnTypes.value}</div>
                      <div className={styles.walletIcon}>
                        <ArrowDown />
                      </div>
                    </div>
                  </button>
                  {
                    <Collapse in={txnTypesDropdown}>
                      <div className={styles.dropdownSort}>
                        {txnTypes.map((item, i) => {
                          return (
                            <div
                              className={`${styles.wrapTextBtn} ${selectedTxnTypes.id === item.id && styles.active} ${
                                i == 0 && styles.wrapTextBtnFirst
                              }`}
                              key={"types-" + i}
                              onClick={() => {
                                setTxnTypesDropdown(false);
                                setSelectedTxnTypes(item);
                              }}
                            >
                              <div>{item.value}</div>
                              {selectedTxnTypes.id === item.id && <Done />}
                            </div>
                          );
                        })}
                      </div>
                    </Collapse>
                  }
                </div>
                {assetsTypes.length !== 0 && (
                  <div className={styles.boxSorting}>
                    <button className={`${styles.btnSort}`} onClick={() => setAssetTypesDropdown(!assetTypesDropdown)}>
                      <div className={`${styles.wrappedFilter}`}>
                        <div>{selectedAssetTypes["unit-name"]}</div>
                        <div className={styles.walletIcon}>
                          <ArrowDown />
                        </div>
                      </div>
                    </button>
                    {
                      <Collapse in={assetTypesDropdown}>
                        <div className={styles.dropdownSort}>
                          {assetsTypes.map((item: any, i: any) => {
                            return (
                              <div
                                className={`${styles.wrapTextBtn} ${selectedAssetTypes.id === item.id && styles.active} ${
                                  i == 0 && styles.wrapTextBtnFirst
                                }`}
                                key={"types-" + i}
                                onClick={() => {
                                  setAssetTypesDropdown(false);
                                  setSelectedAssetTypes(item);
                                }}
                              >
                                <div className="d-flex flex-column">
                                  <span>{item["unit-name"]}</span>
                                  {item.id !== 1 && <span className={`${styles.subtitle}`}>#{item.id}</span>}
                                </div>
                                {selectedAssetTypes.id === item.id && <Done />}
                              </div>
                            );
                          })}
                        </div>
                      </Collapse>
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={styles["divider"]} />
        <div className={`${styles["table-container"]}`}>
          <div className={`mb-0 ${styles.boxHeader}`}>
            <div className={`${styles.itemHeader}`}>TxID</div>
            <div className={`${styles.itemHeader}`}>Date</div>
            <div className={`${styles.itemHeader}`}>Type</div>
            <div className={`${styles.itemHeader}`}>Amount</div>
            <div className={`${styles.itemHeader}`}>Fee (ALGO)</div>
          </div>
          <div className={styles["history-menu"]}>
            {filtered &&
              filtered?.map((item: any, index: number) => {
                let types = "other";

                switch (item["ui-type"]) {
                  case "Pay":
                  case uitypes.UI_SEND:
                    types = "asset-send";
                    break;
                  case uitypes.UI_RECEIVE_ASSET:
                    types = "asset-receive";
                    break;
                  case uitypes.UI_NEW_ASSET:
                    types = "asset-new";
                    break;
                  case uitypes.UI_REMOVE_ASSET:
                    types = "asset-remove";
                    break;
                  case uitypes.UI_APP_CALL:
                    types = "dapp";
                    break;
                  case uitypes.UI_OTHERS:
                    types = "other";
                    break;
                  default:
                    types = "other";
                    break;
                }

                let receiverAdrress;
                let newAmount;
                let assetDetail;
                let closeRemainderTo;
                let closeTo;
                if (item["ui-type"] === uitypes.UI_SEND || item["ui-type"] === uitypes.UI_RECEIVE_ASSET) {
                  if (item.txn["payment-transaction"] !== undefined) {
                    receiverAdrress = item.txn["payment-transaction"]["receiver"];
                    newAmount = item.txn["payment-transaction"]["amount"];
                    if (item.txn["payment-transaction"]["close-remainder-to"])
                      closeRemainderTo = item.txn["payment-transaction"]["close-remainder-to"];
                    if (item.txn["payment-transaction"]["close-amount"] > 0)
                      newAmount = item.txn["payment-transaction"]["close-amount"];
                  } else if (item.txn["asset-transfer-transaction"] !== undefined) {
                    receiverAdrress = item.txn["asset-transfer-transaction"]["receiver"];
                    newAmount = item.txn["asset-transfer-transaction"]["amount"];

                    if (item.txn["asset-transfer-transaction"]["close-amount"] > 0)
                      newAmount = item.txn["asset-transfer-transaction"]["close-amount"];
                  }
                }

                if (item.txn["asset-transfer-transaction"] !== undefined) {
                  assetDetail = assetsTypes.find((asset: any) => asset.id === item.txn["asset-transfer-transaction"]["asset-id"]);

                  if (item.txn["asset-transfer-transaction"]["close-to"])
                    closeTo = item.txn["asset-transfer-transaction"]["close-to"];
                }

                const newAsaID =
                  item.txn["asset-transfer-transaction"] !== undefined
                    ? item.txn["asset-transfer-transaction"]["asset-id"]
                    : undefined;

                const newDate = moment(new Date(item.txn["round-time"] * 1000)).format("DD/MM/YY HH:mm");
                return (
                  <LedgerAccordion
                    key={"txn-" + item.txn.id}
                    type={types}
                    dappName={item["ui-type"] === uitypes.UI_APP_CALL ? "App Call" : undefined}
                    addressTx={item.txn.id}
                    asaId={newAsaID}
                    receiveAdr={receiverAdrress}
                    appId={types === "dapp" ? item.txn["application-transaction"]["application-id"] : undefined}
                    fee={item.txn.fee}
                    date={newDate}
                    amount={newAmount}
                    assetDetail={assetDetail}
                    className={`${styles.boxBorder}`}
                    handleAccordionOpen={() => handleAccordionOpen(index)}
                    open={accordionState[index] || false}
                  >
                    <LedgerDetailTransaction
                      key={"detail-" + item.txn.id}
                      addressTx={item.txn.id}
                      dataDetail={item}
                      txnType={types}
                      asaID={newAsaID}
                      receiveAdr={receiverAdrress}
                      closeRemainderTo={closeRemainderTo}
                      closeTo={closeTo}
                      assetDetail={assetDetail}
                      allAsset={assetsTypes}
                    />
                  </LedgerAccordion>
                );
              })}
            {!loader && filtered.length === 0 && (
              <div className={styles.boxEmptyHistory}>
                <History />
                <div className={styles.textEmptyHistory}>No transaction records found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LedgerTransactions;
