/* eslint-disable @typescript-eslint/no-unused-vars */
import styles from "./SelectImportAccount.module.scss";
import Button from "frontend/components/Button";
import BorderDivider from "frontend/components/UI/BorderDivider";
import AddressGroup from "frontend/components/UI/AddressGroup";
import { useEffect, useState } from "react";
import { getExplorerURL } from "shared/utils";
import ArrowLeftBlue from "frontend/components/Icons/ArrowLeftBlue";
import ArrowRightBlue from "frontend/components/Icons/ArrowRightBlue";
import Loader from "frontend/components/UI/Loader";
import { microalgosToAlgos } from "algosdk";
import useLedger from "frontend/hooks/useLedger";
import { strTruncateMiddle } from "shared/utils";
import usePagination from "frontend/hooks/usePagination";
import useSidebar from "frontend/hooks/useSidebar";
import { useAppDispatch } from "frontend/redux/hooks";
import Router from "next/router";
import { useWallet } from "@txnlab/use-wallet";
import { setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import Algorand from "@ledgerhq/hw-app-algorand";
import { SidebarAccount } from "shared/interfaces";

type Data = {
  name: string;
  providerId?: string;
  address: string;
  ledgerAddress?: string;
  minBalance?: number;
  balance?: number;
  isChecked?: boolean;
  isExist?: boolean;
};

interface Props {
  stepProgress: number;
  onImport?: () => void;
  handleBack: () => void;
  transport: Algorand | null;
}

const SelectImportAccount: React.FC<Props> = ({ stepProgress, onImport, handleBack, transport }: Props) => {
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [loaderLedger, setLoaderLedger] = useState(1);
  const [loaderBtn, setLoaderBtn] = useState(false);
  const [ledgers, setLedgers] = useState<Data[]>([]);
  const [selectedLedgers, setSelectedLedgers] = useState<Data[]>([]);
  const { fetchAccounts, setTransport } = useLedger();
  const { saveList, getList, sidebarLedgers, setSidebarAccount } = useSidebar();
  const {
    currentItems: currentItemsSelected,
    goToNextPage: goToNextPageSelected,
    goToPreviousPage: goToPreviousPageSelected,
    currentTotalItem: currentTotalItemSelected,
  } = usePagination(selectedLedgers, 5);
  const { isReady, activeAddress } = useWallet();
  const { activeAccount } = useWallet();
  const isReview = stepProgress == 5;

  const checkExistingLedgerAccounts = async (pendingLedgerAccounts: Data[]) => {
    // check pending ledger accounts that have already been imported
    const ledgersToAdd: Data[] = [];
    const sidebarLedgers_set = new Set(sidebarLedgers.map((item: SidebarAccount) => item.address));
    const selectedLedgers_set = new Set(selectedLedgers.map((item) => item.address));

    const ledgersImported = pendingLedgerAccounts.map((item) => {
      if (sidebarLedgers_set.has(item.address)) {
        const matchingSidebarAccount = sidebarLedgers.find((sidebarAccount) => sidebarAccount.address === item.address);
        if (matchingSidebarAccount) {
          item.name = matchingSidebarAccount.name; // Assign the name from the matching sidebar account
        }
        item.isChecked = true;
        item.isExist = true;
        ledgersToAdd.push(item);
      } else if (selectedLedgers_set.has(item.address)) {
        item.isChecked = true;
        item.isExist = false;
      } else {
        item.isChecked = false;
        item.isExist = false;
      }

      return item;
    });

    // remove duplicates
    const newLedgers = ledgersToAdd.filter((l) => !selectedLedgers_set.has(l.address));

    setSelectedLedgers((prevLedgers) => [...prevLedgers, ...newLedgers]);
    setLedgers(ledgersImported);
  };

  const handleGetAccounts = async (page: number) => {
    setLoaderLedger(2);

    let accounts: Data[] = [];

    try {
      if (transport) setTransport(transport);
      accounts = await fetchAccounts(page);
      await checkExistingLedgerAccounts(accounts);
    } catch (e) {
      accounts = [];
      console.log(e);
    } finally {
      setLoaderLedger(1);
    }

    setLedgers(accounts);
  };

  useEffect(() => {
    let isFetching = false;

    if (stepProgress == 4 && !isFetching) {
      handleGetAccounts(currentPage);
    }

    return () => {
      isFetching = true;
    };
  }, [stepProgress]);

  const handleChange = (e: any, idx?: any) => {
    const { name, checked } = e.target;

    if (name === "allSelect") {
      const tempUser = ledgers.map((item: any) => {
        return { ...item, isChecked: item.isExist ? true : checked };
      });

      setLedgers(tempUser);

      // assign/reassign all Selected ledger list to SelectedLedger
      if (checked) {
        const newAddLedger = selectedLedgers.concat(
          tempUser.filter((ledger1) => !selectedLedgers.some((ledger2) => ledger2.address === ledger1.address))
        );
        setSelectedLedgers(newAddLedger);
      } else {
        const removeUncheck = selectedLedgers.filter(
          (obj2) => !tempUser.some((obj1) => obj1.address === obj2.address && !obj2.isExist)
        );
        setSelectedLedgers(removeUncheck);
      }
    } else {
      const tempUser = ledgers.map((item: any, index: any) => (index === idx ? { ...item, isChecked: checked } : item));
      setLedgers(tempUser);

      // assign/reassign Selected ledger list to SelectedLedger

      const ledgerChange = tempUser.find((asset, index) => index === idx);

      if (checked) {
        setSelectedLedgers((prevLedgers) => [...prevLedgers, ledgerChange]);
      } else {
        setSelectedLedgers((prevLedgers) => prevLedgers.filter((ledger) => ledger.address !== ledgerChange.address));
      }
    }
  };

  const handleChangeName = async (e: any, adr: string) => {
    const newLedgers = selectedLedgers.map((item) => (adr === item.address ? { ...item, name: e.target.value } : item));

    setSelectedLedgers(newLedgers);
  };

  const handleOnClick = async () => {
    setLoaderBtn(true);
    if (onImport && !isReview) {
      onImport();
    } else {
      // selected sidebar ledgers (SidebarAccount)
      const selectedSidebarLedgerAccounts = selectedLedgers.map(
        ({ providerId, minBalance, balance, isChecked, isExist, ...rest }) => rest
      );
      try {
        let listAppState = [];
        if (isReady && activeAddress) {
          listAppState = await getList(activeAddress);
          listAppState = listAppState.concat(selectedSidebarLedgerAccounts);
          if (activeAccount) {
            await saveList(listAppState, activeAddress);
          } else {
            await saveList(listAppState);
          }
        } else {
          listAppState = await getList();
          listAppState = listAppState.concat(selectedSidebarLedgerAccounts);
          await saveList(listAppState);
        }

        // 1st item from imported ledgers gets selected
        setSidebarAccount(selectedSidebarLedgerAccounts[0]);

        dispatch(setSelectedAccount(listAppState[0]));
        Router.push("/dashboard");
      } catch (e) {
        console.log("err:", e);
      }
    }

    setLoaderBtn(false);
  };

  const goToNextPage = async () => {
    setCurrentPage(currentPage + 1);
    await handleGetAccounts(currentPage + 1);
  };

  const goToPreviousPage = async () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
    await handleGetAccounts(Math.max(currentPage - 1, 1));
  };

  const handleOnRetry = async () => {
    handleGetAccounts(currentPage);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>{isReview ? "Review Account(s)" : "Select Account to Import"}</div>
      <div className={styles["sub-title"]}>
        {isReview
          ? "Please review the following ledger accounts to be imported."
          : `${selectedLedgers.length} account(s) selected`}
      </div>
      <div className={`${styles["select-content"]} ${isReview && styles["review"]}`}>
        <BorderDivider />

        <div className={styles.headerWrapper}>
          <div className={`checkbox ${styles["flex-width"]} ${isReview && styles["fit-width"]}`}>
            {!isReview && (
              <input
                className="me-2"
                type="checkbox"
                role="button"
                name="allSelect"
                checked={!ledgers.some((user) => user.isChecked !== true)}
                onChange={handleChange}
              />
            )}
            <label>
              <b>Account Addresses</b>
            </label>
          </div>
          <label className={`${styles["balance-label"]} ${isReview && styles["fit-label"]}`}>
            <b>{isReview ? "Account Name" : "Balance (ALGO)"}</b>
          </label>
        </div>

        <BorderDivider />
        {loaderLedger === 1 && !isReview && (
          <>
            {ledgers.map((item: any, index: any) => (
              <div className={`${styles["checkbox-group"]}`} key={index}>
                <div className={`checkbox ${styles["flex-width"]} ${isReview && styles["fit-width"]}`}>
                  <input
                    className="me-2"
                    type="checkbox"
                    role="button"
                    name={item.name}
                    checked={item.isChecked}
                    onChange={(e) => handleChange(e, index)}
                    disabled={item.isExist}
                  />
                  <label className="form-check-label">
                    <AddressGroup
                      address={item.address}
                      isRow
                      noQRCode
                      noLink={isReview}
                      isTruncate
                      isNoMb
                      noCopyButton={isReview}
                      className={`${item.isExist && styles.disableClick}`}
                      linkAddress={`${getExplorerURL()}/address/${item.address || ""}`}
                    ></AddressGroup>
                  </label>
                </div>
                <span className={`${styles["balance-value"]} ${item.isExist && styles.disableClick}`}>
                  {microalgosToAlgos(item.balance)}
                </span>
              </div>
            ))}
          </>
        )}
        {loaderLedger === 2 && (
          <div className="mt-4 mb-4">
            <Loader isLedger loadingMessage="Loading accounts...." />
          </div>
        )}

        {isReview && (
          <>
            {currentItemsSelected.map((item: Data) => (
              <div className={`${styles["checkbox-group"]}`} key={item.address}>
                <div className={`checkbox ${styles["flex-width"]} ${styles["fit-width"]}`}>
                  {strTruncateMiddle(item.address, 10, 10)}
                </div>
                <div className={styles.inputName}>
                  <input
                    type="text"
                    className={`form-controls`}
                    id="ledgerName"
                    placeholder="Enter Name"
                    maxLength={32}
                    onChange={(evt) => handleChangeName(evt, item.address)}
                    value={item.name}
                    style={{ textOverflow: "ellipsis" }}
                  />
                  <div className={styles.textCount}>{`${item.name?.length}/32`}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {isReview ? (
          <>
            <BorderDivider />
            <div className="d-flex justify-content-center my-2_5 gap-4 align-items-center">
              <div role="button" onClick={goToPreviousPageSelected}>
                <ArrowLeftBlue />
              </div>
              <span>{currentTotalItemSelected}</span>
              <div role="button" onClick={goToNextPageSelected}>
                <ArrowRightBlue />
              </div>
            </div>
          </>
        ) : (
          <>
            <BorderDivider />
            <div className="d-flex justify-content-center my-2_5 gap-4 align-items-center">
              <div
                role="button"
                className={`${currentPage == 1 || loaderLedger === 2 ? styles.disableClick : ""}`}
                onClick={async () => await goToPreviousPage()}
              >
                <ArrowLeftBlue />
              </div>
              <span>{currentPage}</span>
              <div
                role="button"
                className={`${loaderLedger === 2 ? styles.disableClick : ""}`}
                onClick={async () => await goToNextPage()}
              >
                <ArrowRightBlue />
              </div>
            </div>
          </>
        )}

        <BorderDivider />
      </div>
      <div className={styles["button-group"]}>
        <Button cancel className={styles.btn} onClick={handleBack} disabled={loaderBtn}>
          BACK
        </Button>
        {loaderLedger === 1 && ledgers.length === 0 && (
          <Button primary className={styles.btn} onClick={handleOnRetry} disabled={loaderBtn}>
            RETRY
          </Button>
        )}
        {ledgers.length > 0 && (
          <Button primary className={styles.btn} onClick={handleOnClick} disabled={loaderBtn}>
            {isReview ? "SAVE" : "IMPORT"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SelectImportAccount;
