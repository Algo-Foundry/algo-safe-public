import styles from "./ReviewDetail.module.scss";
import Button from "frontend/components/Button";
import { MouseEventHandler, useState, useEffect } from "react";
import { strTruncateMiddle } from "shared/utils";
import { setInitBalanceTopUp, getInitBalanceTopUp, setSelectedSafe, setOptSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { getSelectedAccount, setSelectedAccount } from "frontend/redux/features/account/accountSlice";
import { getIsOwner } from "frontend/redux/features/migration/migrationSlice";
import AppConfig from "config/appConfig";
import IconCopy from "../../../Icon/IconCopy";
import IconLink from "../../../Icon/iconLink";
import Alert from "../../../Alert";
import ModalSafe from "frontend/components/UI/Safe/ModalSafe";
import ModalConfirm from "frontend/components/UI/Safe/ModalSafe/ModalConfirm";
import { getExplorerURL } from "shared/utils";
import { microalgosToAlgos, algosToMicroalgos, ALGORAND_MIN_TX_FEE } from "algosdk";
import BorderDivider from "frontend/components/UI/BorderDivider";
import AccountService from "frontend/services/account";
import { getNewSafeData } from "frontend/redux/features/safe/safeSlice";
import { useRouter } from "next/router";
import SafeService from "frontend/services/safe";
import { SELECTED_SAFE, errors, sidebar } from "shared/constants";
import { Safe } from "shared/interfaces";
import useSubmitCreateSafeTxns from "frontend/hooks/useSubmitCreateSafeTxns";
import useSubmitInitSafeTxns from "frontend/hooks/useSubmitInitSafeTxns";
import useSubmitOptInSafeTxns from "frontend/hooks/useSubmitOptInSafeTxns";
import { useWallet } from "@txnlab/use-wallet";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import useSidebar from "frontend/hooks/useSidebar";
import { ERR_INSUFFICIENT_WALLET_BALANCE } from "shared/constants/errors";
import * as Sentry from "@sentry/nextjs";

type types = "new" | "load" | "read";

interface Props {
  type?: types;
  loadedSafe?: Safe | null;
  isMigration?: boolean;
  onNext?: () => void;
  onBack?: MouseEventHandler;
  fetchMigration?: () => void;
  isResume?: boolean;
}

// Will use this as a report for the user
// All of these are transaction IDs
export type txIds = {
  // Safe Creation
  safeCreation: string;
  safeID: number;
  address?: string;
  optin: string;
  initAppCall: string;
};

const itemsModal = ["Creating ", "Initializing", "Success"];

const ReviewDetail: React.FC<Props> = ({
  type = "new",
  loadedSafe,
  isMigration,
  onNext,
  onBack,
  fetchMigration,
  isResume = false,
}: Props) => {
  const ss = new SafeService();
  const dispatch = useAppDispatch();
  const safeData = useAppSelector(getNewSafeData);
  const selectedSafe: any = ss.getSelectedSafeFromStorage();
  const router = useRouter();
  const [balanceInput, setBalanceInput] = useState(AppConfig.minBalance / 1e6);
  const selectedAccount = useAppSelector(getSelectedAccount);
  const [ownerSafe, setOwnerSafe] = useState([{}]);
  const [masterSafeConfig, setMasterSafeConfig] = useState<any>({});
  const [tx, setTx] = useState(1);
  const [balance, setBalance] = useState(AppConfig.minBalance);
  const [createdSafe, setCreatedSafe] = useState<Safe | null>(null);
  const [minBalance, setMinBalance] = useState(0);
  const [isSafeCreator, setIsSafeCreator] = useState(false);
  const [noCloseBtn, setNoCloseBtn] = useState(false);
  const { activeAccount, signTransactions, sendTransactions } = useWallet();
  const { saveList, getList, sidebarAccounts, setSidebarAccount } = useSidebar();
  const [totalFees, setTotalFees] = useState("0");

  const getCreationFees = async () => {
    const creation = await ss.getMasterSafeConfig();
    setMasterSafeConfig(creation);
  };

  useEffect(() => {
    // data from load safe
    if (loadedSafe !== undefined) {
      setCreatedSafe(loadedSafe);
    }
  }, [loadedSafe]);

  useEffect(() => {
    // safe creator check
    if (createdSafe) {
      const safeCreatorCheck = async () => {
        const mo = await ss.isSafeCreator(createdSafe, selectedAccount);
        setIsSafeCreator(mo);

        //get creation fees
        getCreationFees();
      };

      safeCreatorCheck();
    }
  }, [createdSafe, selectedAccount]);

  const syncAccount = async () => {
    if (!activeAccount) return;

    const accountsData = await AccountService.getAccountInfo(activeAccount.address);
    dispatch(setSelectedAccount(accountsData));

    if (accountsData === undefined) throw new Error(errors.ERR_FETCH_ACCOUNT);

    // accountsData.minBalance returns undefined so we will use accountsData["min-balance"] instead
    // @ts-ignore
    setMinBalance(accountsData["min-balance"]);

    return accountsData;
  };

  useEffect(() => {
    // update account balances on page load
    syncAccount();
  }, [activeAccount]);

  useEffect(() => {
    dispatch(setInitBalanceTopUp(Number(balance)));
  }, [balance]);

  const syncMinBalance = async (safe: Safe) => {
    // for safe migration, min balance increases with each new asset to be transferred
    try {
      const response = await AccountService.fetchAssetBalances(safe.address);
      if (response?.assets?.length) {
        const updatedMinBalance = (AppConfig.minBalance + 100000 * (response.assets.length - 1)) / 1e6;
        setBalanceInput(updatedMinBalance);
        setBalance(updatedMinBalance);
      }
    } catch (error) {
      // console.log("error: ", error);
    }
  };

  useEffect(() => {
    setOwnerSafe(safeData.owners);
    setTx(safeData.threshold);
    setBalance(balanceInput);
    if (isMigration) {
      syncMinBalance(selectedSafe);
    }
    getCreationFees();
  }, [safeData]);

  if (router.pathname === "/safe-migration") {
    isMigration = true;
  }

  const handleChange = (e: any) => {
    const decimal = e.target.value % 1 === 0;
    if (e.target.value.length >= 8 && !decimal) {
      e.target.value = e.target.value.slice(0, 8);
    } else if (e.target.value.length >= 9) {
      e.target.value = e.target.value.slice(0, 9);
    }
    setBalance(e.target.value);
  };

  const handleKeyPress = (e: any) => {
    if (!/[0-9]|\./.test(e.key)) {
      e.preventDefault();
    }
  };

  const creationFees = (): number => {
    let paymentToTreasury = algosToMicroalgos(masterSafeConfig.creationFees) || 0;
    if (createdSafe !== null && createdSafe.initialized) {
      paymentToTreasury = 0;
    }

    return paymentToTreasury;
  };

  const optInFees = (): number => {
    return ALGORAND_MIN_TX_FEE;
  };

  const deployFees = (): number => {
    return ALGORAND_MIN_TX_FEE * 2;
  };

  const initFees = (): number => {
    return ALGORAND_MIN_TX_FEE * 3;
  };

  const networkFees = (): number => {
    if (createdSafe === null) {
      return ALGORAND_MIN_TX_FEE * 6;
    } else if (!createdSafe.initialized) {
      return ALGORAND_MIN_TX_FEE * 4;
    } else {
      return optInFees();
    }
  };

  useEffect(() => {
    const calculateTotalFees = () => {
      let calculatedFees = 0;
      if (!isResume) calculatedFees += deployFees();
      if (!createdSafe?.initialized) calculatedFees += initFees();
      calculatedFees += optInFees();
      if (!createdSafe?.initialized) calculatedFees += creationFees();
      calculatedFees = microalgosToAlgos(calculatedFees);

      if (!createdSafe?.initialized) calculatedFees += parseFloat(String(balance));

      setTotalFees(calculatedFees.toFixed(3).toString());
    };

    calculateTotalFees();
  }, [balance]);

  const createSafeMBR = () => {
    // returns min balance requirement of the safe if
    // 1. safe is created and connected account is the safe creator
    // 2. safe is not created yet
    if (!createdSafe || isSafeCreator) {
      return AppConfig.createSafeMinBalanceRequirement;
    }

    return 0;
  };

  const balanceRequiredToMakeSafe = (): number => {
    // calculates balance required to create -> init -> optin safe
    const safeMBR = createSafeMBR();
    const initBalanceTopup = algosToMicroalgos(balance);
    const safeCreationFees = creationFees();
    const safeNetworkFees = networkFees();

    return (
      safeMBR + safeCreationFees + initBalanceTopup + AppConfig.optInSafeMinBalanceRequirement + safeNetworkFees + minBalance
    );
  };

  const balanceRequiredToOptInSafe = () => {
    return optInFees() + AppConfig.optInSafeMinBalanceRequirement + minBalance;
  };

  //create-safe
  const [progress, setProgress] = useState(false);
  const [stepProgress, setStepProgress] = useState(1);
  const newSafeData = useAppSelector(getNewSafeData);
  const isOwner = useAppSelector(getIsOwner);
  const initBalance = useAppSelector(getInitBalanceTopUp) * 1e6;
  const [typeModal, setTypeModal] = useState("create");
  const [modalShow, setModalShow] = useState(false);
  const [errMessage, setErrMessage] = useState("");
  const [titleModal, setTitleModal] = useState("Success Creating New Safe");
  const [userOptedIn, setUserOptedIn] = useState(false);
  const handleSubmitCreateSafeTxns = useSubmitCreateSafeTxns();
  const handleSubmitInitSafeTxns = useSubmitInitSafeTxns();
  const { handleOptInSafeTxns, handleOptInSafeTxnsViaLedger } = useSubmitOptInSafeTxns();

  // Used for modal report later
  const [creationTxIds, setCreationTxIds] = useState<txIds>({
    safeCreation: "",
    safeID: 0,
    address: "",
    optin: "",
    initAppCall: "",
  });

  // eslint-disable-next-line
  const txError = (err: any, type: string, title: string) => {
    const conditions = errors.ERR_REJECT_MSGS;
    const reject = conditions.some((el) => err.message.includes(el));
    if (reject) {
      if (type == "fail init" || type == "fail optin") {
        setTypeModal(type);
      } else {
        setTypeModal("fail reject");
      }
    } else {
      setTypeModal(type);
    }

    setTitleModal(title);
    setProgress(false);
    setModalShow(true);
    if (reject) {
      setStepProgress(1);
    }
    if (err.message.includes("blocked")) {
      setErrMessage(err);
    }
    if (err.message.includes("Insufficient balance on account")) {
      setErrMessage(err.message);
    }
  };

  const createSafe = async () => {
    setStepProgress(1);
    setProgress(true);
    1;
    try {
      if (selectedAccount.amount < balanceRequiredToMakeSafe()) {
        throw new Error("Insufficient balance on account");
      }
      if (!activeAccount) throw new Error("No active address detected");
      const { safe: newSafe, res } = await handleSubmitCreateSafeTxns(
        newSafeData.name,
        newSafeData.threshold,
        newSafeData.owners,
        activeAccount,
        signTransactions,
        sendTransactions
      );

      setStepProgress(2);
      setCreatedSafe(newSafe);

      // sync account to update UI on balance requirement
      await syncAccount();

      return {
        newSafe,
        res,
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          step: "create safe",
          name: newSafeData.name,
          threshold: newSafeData.threshold,
          owners: JSON.stringify(newSafeData.owners),
          activeAccount,
          balance: selectedAccount.amount,
          balanceRequiredToMakeSafe: balanceRequiredToMakeSafe(),
        },
      });
      txError(error, "fail create", "Failed to create Safe");
      await syncAccount();
      return;
    }
  };

  const initSafe = async (newSafe: Safe) => {
    setStepProgress(2);
    setProgress(true);
    try {
      if (selectedAccount.amount < balanceRequiredToMakeSafe()) {
        throw new Error("Insufficient balance on account");
      }
      if (!activeAccount) throw new Error("No active address detected");
      const { res, treasuryTxnID, topupTxnID, initAppCallTxnID } = await handleSubmitInitSafeTxns(
        newSafe,
        initBalance,
        activeAccount,
        signTransactions,
        sendTransactions
      );
      setStepProgress(3);

      // update initialized state

      const safeObj = { ...newSafe };
      safeObj.initialized = true;
      setCreatedSafe(safeObj);

      // sync account to update UI on balance requirement
      await syncAccount();
      localStorage.removeItem("resume-safe-list");
      return {
        res,
        treasuryTxnID,
        topupTxnID,
        initAppCallTxnID,
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          step: "init safe",
          appId: newSafe.appId,
          initialBalance: initBalance,
          activeAccount,
          balance: selectedAccount.amount,
          balanceRequiredToMakeSafe: balanceRequiredToMakeSafe(),
        },
      });
      txError(error, "fail init", "Fail to initialize Safe");
      await syncAccount();
      return;
    }
  };

  const optInSafe = async (newSafe: Safe) => {
    if (type == "new") {
      setStepProgress(3);
      setProgress(true);
    }

    if (isMigration && !isOwner) dispatch(setOptSafe(true));

    let res;
    try {
      if (selectedAccount.amount < balanceRequiredToOptInSafe()) {
        throw new Error("Insufficient balance on account");
      }

      if (selectedAccount.ledgerAddress !== undefined) {
        res = await handleOptInSafeTxnsViaLedger(newSafe, selectedAccount as LedgerAccount);
      } else {
        res = await handleOptInSafeTxns(newSafe, activeAccount, signTransactions, sendTransactions);
      }

      const accounts = [...sidebarAccounts, { name: newSafe?.name, address: newSafe?.address, appId: newSafe?.appId }];
      if (activeAccount) {
        await saveList(accounts, selectedAccount.address);
      } else {
        await saveList(accounts);
      }

      localStorage.removeItem("resume-safe-list");
      setUserOptedIn(true);
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          step: "opt in",
          appId: newSafe.appId,
          activeAccount,
          balance: selectedAccount.amount,
          balanceRequiredToOptInSafe: balanceRequiredToOptInSafe(),
        },
      });
      dispatch(setOptSafe(false));
      txError(err, "fail optin", "Fail to opt into Safe");
      await syncAccount();
      return;
    }

    if (isMigration && isOwner) {
      let authError = false;
      do {
        if (!activeAccount) throw new Error("No active address detected");
        try {
          await ss.createSafeMigration(Number(safeData.appId), newSafe.appId, activeAccount.address);
          authError = false;
          // eslint-disable-next-line
        } catch (error: any) {
          if (error.response?.status == 401) {
            authError = true;
          } else {
            throw error;
          }
        }
      } while (authError);
    }

    dispatch(setOptSafe(false));

    // save to localstorage when safe is created
    if (!isMigration) {
      dispatch(setSelectedSafe(newSafe));
      localStorage.setItem(SELECTED_SAFE, JSON.stringify(newSafe));
      localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(newSafe));
      setSidebarAccount(newSafe);
    }

    if (type == "new") {
      setTimeout(() => setProgress(false), 500);
    }

    try {
      const newestSafe = {
        name: newSafe.name,
        address: newSafe.address,
        appId: newSafe.appId,
      };
      let listAppState = [];
      if (activeAccount) {
        listAppState = await getList(activeAccount.address);
        listAppState.push(newestSafe);
        await saveList(listAppState, activeAccount.address);
      } else {
        listAppState = await getList();
        listAppState.push(newestSafe);
        await saveList(listAppState);
      }

      dispatch(setSelectedSafe(newSafe));
      localStorage.setItem(SELECTED_SAFE, JSON.stringify(newSafe));
      localStorage.setItem(sidebar.SELECTED_SIDEBAR_ACCOUNT, JSON.stringify(newSafe));
      setSidebarAccount(newSafe);
    } catch (e) {
      console.log("err:", e);
    }

    return {
      res,
    };
  };

  const retryTx = async () => {
    setModalShow(false);
    setProgress(true);

    if (createdSafe === null) throw new Error("No safe created");

    if (isMigration && stepProgress < 3) return;

    const txIds: txIds = creationTxIds;
    txIds.address = createdSafe.address;
    txIds.safeID = createdSafe.appId;

    if (!createdSafe.initialized) {
      const initSafeRes = await initSafe(createdSafe);

      if (initSafeRes === undefined) return;

      // store safe init txId
      txIds.initAppCall = initSafeRes.res.txId;
      setCreationTxIds(txIds);
    }

    // has user opted into safe?
    if (!userOptedIn) {
      const optInSafeRes = await optInSafe(createdSafe);

      if (optInSafeRes === undefined) return;

      // store opt in txId
      txIds.optin = optInSafeRes.res.response.txId;
      setCreationTxIds(txIds);
    }

    // show success modal
    setTypeModal("create");
    setTitleModal("Success Creating New Safe");
    setModalShow(true);
  };

  const btnContinue = async () => {
    if (type == "new") {
      // is safe already created?
      let thisSafe;
      const txIds: txIds = creationTxIds;

      if (!createdSafe) {
        const newSafeRes = await createSafe();

        if (newSafeRes === undefined) return;

        thisSafe = newSafeRes.newSafe;

        // store create safe txId
        txIds.safeCreation = newSafeRes.res.txId;
        setCreationTxIds(txIds);
      } else {
        thisSafe = createdSafe;
      }

      // store new safe details
      txIds.address = thisSafe.address;
      txIds.safeID = thisSafe.appId;

      // is safe already initialized?
      if (!thisSafe.initialized) {
        const initSafeRes = await initSafe(thisSafe);

        if (initSafeRes === undefined) return;

        // store safe init txId
        txIds.initAppCall = initSafeRes.res.txId;
        setCreationTxIds(txIds);
      }

      // has user opted into safe?
      if (!userOptedIn) {
        const optInSafeRes = await optInSafe(thisSafe);

        if (optInSafeRes === undefined) return;

        // store opt in txId
        txIds.optin = optInSafeRes.res.txId;
        setCreationTxIds(txIds);
      }

      // show success modal
      setTypeModal("create");
      setTitleModal("Success Creating New Safe");
      setNoCloseBtn(true);
      setModalShow(true);
    }

    if (type == "read" || type == "load") {
      if (onNext) {
        onNext();
      } else {
        if (safeData.appId === undefined) throw new Error("No Safe app ID found.");
        const newSafe = await ss.getSafe(safeData.appId);
        await optInSafe(newSafe);
      }
    }
  };

  const renderCreateSafeText = () => {
    if (createdSafe === null) {
      return (
        <>
          You are about to create a new Safe. You need at least <b>{microalgosToAlgos(balanceRequiredToMakeSafe())} ALGO</b>{" "}
          balance in your wallet. Please ensure that
        </>
      );
    } else if (!createdSafe.initialized) {
      return (
        <>
          You are about to resume your Safe creation process. You need at least{" "}
          <b>{microalgosToAlgos(balanceRequiredToMakeSafe())} ALGO</b> balance in your wallet. Please ensure that
        </>
      );
    } else {
      return (
        <>
          As a co-signer of the Safe, you are required to *opt-in* to the Safe. Opting into a Safe will prompt you to confirm a
          transaction with your currently connected wallet. Please ensure that
        </>
      );
    }
  };

  return (
    <>
      <ModalSafe
        isMigration={isMigration}
        modalStatus={modalShow}
        title={titleModal}
        type={typeModal}
        errMessage={errMessage}
        txInformation={creationTxIds}
        noCloseBtn={noCloseBtn}
        isResume={true}
        onHide={() => {
          setModalShow(false);
          if (typeModal == "create" && !isMigration) {
            if (router.route.includes("/dashboard")) {
              router.reload();
            } else {
              router.push({
                pathname: "/dashboard",
              });
            }
          }
          if (isMigration) {
            fetchMigration && fetchMigration();
          }
          setErrMessage("");
        }}
        onRetry={retryTx}
      />
      <ModalConfirm title="Creating New Safe" items={itemsModal} modalStatus={progress} step={stepProgress} />
      {(progress || modalShow) && router.route.includes("/dashboard") && (
        <div
          style={{
            position: "fixed",
            width: "100vw",
            height: "100vh",
            background: "white",
            top: "0",
            left: "0",
            zIndex: "1044",
            opacity: "0.7",
          }}
        ></div>
      )}
      <div className={`box-safe ${styles["review-detail"]} ${styles.mBottom}`}>
        <div className={`${styles.boxContent} pb-0`}>
          <div className={styles.boxOwner}>
            <div className={styles.wrapSide}>
              <div className={`${styles.boxTitle} ${styles.top}`}>
                <div className={styles.textContent}>Name of the Safe</div>
                <div className={`${styles.textContent} ${styles.bold} d-flex gap-1`}>
                  <span>{safeData.name}</span>
                  {type == "read" && <div className={styles.wrapReadOnly}>read only</div>}
                </div>
              </div>
              {safeData.appId != undefined && (
                <div className={`${styles.boxTitle}`}>
                  <div className={`${styles.textContent} ${styles.maxBox}`}>
                    {!isMigration ? "" : isOwner ? "Old" : "New"} Safe ID:
                  </div>
                  <div className={`${styles.textContent} ${styles.bold} d-flex align-items-center gap-2`}>
                    <span>{safeData.appId || ""}</span>
                    <IconCopy copy={`${safeData.appId}`} />
                    <IconLink link={`${getExplorerURL()}/application/${safeData.appId}`} />
                  </div>
                </div>
              )}
              {safeData.address != undefined && (
                <div className={`${styles.boxTitle} ${styles.topMob}`}>
                  <div className={`${styles.textContent} ${styles.maxBox}`}>
                    {!isMigration ? "" : isOwner ? "Old" : "New"} Safe Address:
                  </div>
                  <div className={`${styles.textContent} ${styles.bold} d-flex align-items-center gap-2`}>
                    <span>{strTruncateMiddle(safeData.address || "", 10, 10)}</span>
                    <IconCopy copy={`${safeData.address}`} />
                    <IconLink link={`${getExplorerURL()}/address/${safeData.address}`} />
                  </div>
                </div>
              )}

              {safeData.address != undefined && <BorderDivider className="mt-3 d-none d-lg-block" />}

              <div className={`${styles.boxTitle} ${styles.topMob}`}>
                <div className={`${styles.textContent}`}>Total Number of Co-signers</div>
                <div className={`${styles.textContent} ${styles.bold}`}>{ownerSafe?.length}</div>
              </div>
              <div className={`${styles.boxTitle} ${styles.topMob}`}>
                <div className={`${styles.textContent}`}>Required Number of Signatures Required</div>
                <div className={`${styles.textContent} ${styles.bold}`}>{tx}</div>
              </div>
            </div>
            <BorderDivider className="d-none d-lg-block" isVertical />
            <div className={styles.wrapSide}>
              <div className={`${styles.boxTitle} ${styles.top}  ${styles.paddingLess}`}>
                <div className={`${styles.textContent} ${styles.bold}`}>Signers</div>
              </div>
              {ownerSafe?.map((value: any, index: any) => (
                <div key={index} className={`${styles.boxTitle} align-items-center`}>
                  <div className={styles.textContent}>
                    {value.name} {index == 0 && ownerSafe?.length > 1 && `(Creator)`}
                  </div>
                  <div className={`${styles.textContent} ${styles.bold} d-flex align-items-center gap-2`}>
                    {value.nfDomain && value.nfDomain.length !== 0 ? (
                      <span>{value.nfDomain}</span>
                    ) : (
                      <span>{strTruncateMiddle(value.addr, 10, 10)}</span>
                    )}
                    <IconCopy copy={value.addr} />
                    <IconLink link={`${getExplorerURL()}/address/${value.addr}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={`box-safe  ${styles["review-detail"]}`}>
        <div className={styles.boxContent}>
          {type == "new" && (
            <div className={`box-safe default ${styles["review-detail"]}`}>
              <div className={styles.textContent}>
                {renderCreateSafeText()}
                <a
                  href="https://support.google.com/chrome/answer/95472?hl=en&co=GENIE.Platform%3DDesktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  pop-up is enabled
                </a>
                on your browser. Here is the transaction breakdown:
              </div>
              <div className={`d-flex w-100 ${styles.feesWrap}`}>
                <div className={`d-flex flex-column gap-2 w-50 ${styles.feesContainer}`}>
                  {!isResume && (
                    <div className={styles.txWrap}>
                      <div className={`${styles.textContent} ${styles.txWidth1}`}>Deployment TX Fees</div>
                      <div className={`${styles.textContent} ${styles.txWidth2} ${styles.mlTx2}`}>
                        {microalgosToAlgos(deployFees())} ALGO
                      </div>
                    </div>
                  )}
                  {!createdSafe?.initialized && (
                    <div className={styles.txWrap}>
                      <div className={`${styles.textContent} ${styles.txWidth1}`}>initialization TX Fees</div>
                      <div className={`${styles.textContent} ${styles.txWidth2} ${styles.mlTx2}`}>
                        {microalgosToAlgos(initFees())} ALGO
                      </div>
                    </div>
                  )}
                  {
                    <div className={styles.txWrap}>
                      <div className={`${styles.textContent} ${styles.txWidth1}`}>Opt-in TX Fee</div>
                      <div className={`${styles.textContent} ${styles.txWidth2} ${styles.mlTx2}`}>
                        {microalgosToAlgos(optInFees())} ALGO
                      </div>
                    </div>
                  }
                </div>
                {!createdSafe?.initialized && (
                  <div className={`d-flex flex-column gap-2 w-50 ${styles.feesContainer}`}>
                    <div className={styles.txWrap}>
                      <div className={`${styles.textContent} ${styles.txWidth1}`}>Platform Fee</div>
                      <div className={`${styles.textContent} ${styles.txWidth2} ${styles.mlTx2}`}>
                        {parseFloat(String(microalgosToAlgos(creationFees()))).toFixed(3)} ALGO
                      </div>
                    </div>
                    <div className={styles.txWrap}>
                      <div className={`${styles.textContent} ${styles.txWidth1}`}>
                        Initial Balance Topup <br />
                        <span className={styles.detail}>(min {balanceInput} ALGO)</span>
                      </div>
                      <div className={`${styles.txWidth2} ${styles.mlTx2}`}>
                        <input
                          type="number"
                          className={`${balance < balanceInput ? styles.borderRed : ""} form-controls text-black ${styles.input}`}
                          id="init-balance"
                          onChange={handleChange}
                          onKeyPress={handleKeyPress}
                          value={balance}
                          step="0.1"
                          disabled={createdSafe !== null && createdSafe.initialized}
                        />
                      </div>
                      <div className={`${styles.textContent} ${styles.mlTx2}`}>ALGO</div>
                    </div>
                  </div>
                )}
              </div>
              {!createdSafe?.initialized && (
                <>
                  <BorderDivider />
                  <div className={`d-flex flex-column gap-2 w-100`}>
                    <div className={`${styles.txWrap} w-50 ${styles.totalWrap}`}>
                      <div className={`${styles.textContent} ${styles.bold} ${styles.txWidth1}`}>TOTAL: </div>
                      <div className={`${styles.textContent} ${styles.bold} ${styles.txWidth2} ${styles.mlTx2}`}>
                        {totalFees} ALGO
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {type == "load" && (
            <div className={`box-safe default ${styles["review-detail"]}`}>
              <div className={styles.textContent}>
                {!isMigration ? "You are about to load a safe to your dashboard." : ""} You are one of the signers of the safe,
                you need to <span className={styles.bold}>opt into the safe</span>. Opting into a safe will prompt you to confirm
                a transaction with your currently connected wallet. Here is the breakdown of the transactions
              </div>
              <div className={styles.txWrap}>
                <div className={`${styles.textContent} ${styles.bold} ${styles.txWidth1}`}>Opt-in TX Fee</div>
                <div className={`${styles.textContent} ${styles.bold} ${styles.txWidth2} ${styles.mlTx2}`}>
                  {microalgosToAlgos(optInFees())} ALGO
                </div>
              </div>
            </div>
          )}
          {type == "read" && (
            <div className={`box-safe default ${styles["review-detail"]}`}>
              <div className={styles.textContent}>
                You are about to load a safe to your dashboard. You are not one of the signers. Therefore the safe will be viewed
                as <span className={styles.bold}>read only</span> on your dashboard
              </div>
            </div>
          )}
        </div>

        <BorderDivider className="mb-2" />

        {type == "new" && balance < balanceInput && (
          <Alert message={"You are required to at least top up " + balanceInput + " ALGO to your newly created safe"} />
        )}
        {type == "new" && selectedAccount.amount < balanceRequiredToMakeSafe() && (
          <Alert message={ERR_INSUFFICIENT_WALLET_BALANCE} />
        )}
        {type == "load" && selectedAccount.amount < balanceRequiredToOptInSafe() && (
          <Alert message={ERR_INSUFFICIENT_WALLET_BALANCE} />
        )}

        {!isMigration && (
          <div className="box-button mx-auto">
            {!createdSafe && (
              <button className={styles.cancelbtn} onClick={onBack}>
                <span>BACK</span>
              </button>
            )}
            {isResume && (
              <button className={styles.cancelbtn} onClick={onBack}>
                <span>BACK</span>
              </button>
            )}
            <Button
              primary
              disabled={balance < balanceInput || selectedAccount.amount < balanceRequiredToMakeSafe()}
              onClick={btnContinue}
            >
              CREATE
            </Button>
          </div>
        )}
        {isMigration && (
          <div className={styles.button}>
            <Button
              primary
              className="w-100"
              onClick={btnContinue}
              disabled={
                (type == "new" && selectedAccount.amount < balanceRequiredToMakeSafe()) ||
                balance < balanceInput ||
                (type == "load" && selectedAccount.amount < balanceRequiredToOptInSafe()) ||
                !activeAccount
              }
            >
              {type == "new" ? "CREATE NEW SAFE" : "OPT-IN"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewDetail;
