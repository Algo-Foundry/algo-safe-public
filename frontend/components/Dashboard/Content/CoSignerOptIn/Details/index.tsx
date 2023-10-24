import React, { useEffect, useState } from "react";
import styles from "./CoSignerOptIn.module.scss";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import Button from "frontend/components/Button";
import ModalSuccess from "../ModalSuccess";
import Alert from "frontend/components/UI/Alert";
import AppConfig from "config/appConfig";
import { Safe, SidebarAccount } from "shared/interfaces";
import { getExplorerURL, strTruncateMiddle } from "shared/utils";
import useSubmitOptInSafeTxns from "frontend/hooks/useSubmitOptInSafeTxns";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { useWallet } from "@txnlab/use-wallet";
import useSidebar from "frontend/hooks/useSidebar";
import ModalTx from "../../Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import { ALGORAND_MIN_TX_FEE, microalgosToAlgos } from "algosdk";
import AccountService from "frontend/services/account";
import { ERR_INSUFFICIENT_WALLET_BALANCE } from "shared/constants/errors";
import { errors } from "shared/constants";
import SafeService from "frontend/services/safe";

interface PageProps {
  onChangeComponent: (component: string) => void;
  safe: Safe | null;
  selectedAccount: any;
}

const dataModal = {
  title: "Success Opt-in",
  type: "success",
};

const itemsModal = ["Creating ", "Processing", "Success"];

const CoSignerOptInDetail = (props: PageProps) => {
  const { onChangeComponent, safe, selectedAccount } = props;
  const [disableOptIn, setDisableOptIn] = useState(false);
  const [showModalSuccess, setShowModalSuccess] = useState(false);
  const { handleOptInSafeTxns, handleOptInSafeTxnsViaLedger } = useSubmitOptInSafeTxns();
  const { signTransactions, sendTransactions } = useWallet();
  const [stepProgress, setStepProgress] = useState(1);
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [modalError, setModalError] = useState("");
  const { sidebarAccounts, saveList, setSidebarAccount } = useSidebar();
  const [txId, setTxId] = useState("");
  const [minBalance, setMinBalance] = useState(AppConfig.optInSafeMinBalanceRequirement);
  const { activeAccount } = useWallet();
  const isLedger = selectedAccount.ledgerAddress !== undefined;
  const ss = new SafeService();

  async function checkBalance() {
    if (selectedAccount.address !== undefined) {
      const accountsData = await AccountService.getAccountInfo(selectedAccount.address);
      if (accountsData === undefined) throw new Error(errors.ERR_FETCH_ACCOUNT);
      // @ts-ignore
      const minBalanceRequired = accountsData["min-balance"] + AppConfig.optInSafeMinBalanceRequirement;
      setMinBalance(minBalanceRequired);
      if (accountsData.amount < minBalanceRequired) {
        setDisableOptIn(true);
      }
      return;
    }
  }

  async function optIn() {
    setLoadingModalShow(true);
    try {
      let res;
      if (selectedAccount.ledgerAddress !== undefined) {
        if (safe) res = await handleOptInSafeTxnsViaLedger(safe, selectedAccount as LedgerAccount);
      } else {
        if (safe) res = await handleOptInSafeTxns(safe, selectedAccount, signTransactions, sendTransactions);
      }
      setStepProgress(2);

      setTxId(res?.txId || "");
      const accounts = [...sidebarAccounts, { name: safe?.name, address: safe?.address, appId: safe?.appId }];
      if (activeAccount) {
        await saveList(accounts as SidebarAccount[], selectedAccount.address);
      } else {
        await saveList(accounts as SidebarAccount[]);
      }
      setLoadingModalShow(false);
      setStepProgress(3);

      if (res) {
        const selectedSafe = await ss.getSafe(Number(safe?.appId));
        setSidebarAccount(selectedSafe);
        setShowModalSuccess(true);
      }
    } catch (e: any) {
      setLoadingModalShow(false);
      setModalError(e.message);
    }
  }

  const optInFees = (): number => {
    return ALGORAND_MIN_TX_FEE;
  };

  useEffect(() => {
    if (!activeAccount?.address) return;
    if (selectedAccount.address !== activeAccount.address && selectedAccount.ledgerAddress === undefined) {
      onChangeComponent("selectAccount");
    }
    checkBalance();
  }, [activeAccount?.address, selectedAccount.address, selectedAccount.ledgerAddress]);

  return (
    <>
      <ModalTx
        modalStatus={modalError != ""}
        title="Error"
        type="custom-error"
        message={modalError}
        onHide={() => {
          setModalError("");
        }}
      ></ModalTx>
      <ModalSuccess
        modalStatus={showModalSuccess}
        title={dataModal.title}
        type={dataModal.type}
        safe={safe}
        txId={txId}
        onHide={() => {
          setShowModalSuccess(false);
          onChangeComponent("selectAccount");
        }}
      />
      <ModalLoadingTx title="Transaction is Processing" items={itemsModal} modalStatus={loadingModalShow} step={stepProgress} />
      <div className={styles["container"]}>
        <div className={`box-safe ${styles["cosigner-optin"]}`}>
          <div className={styles["wrapper"]}>
            <div className={styles["foundrySafeContainer"]}>
              <div className={styles["header"]}>
                <p>Name of the Safe</p>
                <p className={styles["textBold"]}>{safe?.name}</p>
              </div>
              <div className={styles["content"]}>
                <div className={styles["item"]}>
                  <p>Number of Signature Required</p>
                  <p className={styles["textBold"]}>{safe?.threshold}</p>
                </div>
              </div>
            </div>
            <div className={styles["signerContainer"]}>
              <div className={styles["header"]}>
                <p className={styles["textBold"]}>Signers</p>
              </div>
              <div>
                {safe?.owners.map((owner, index) => {
                  return (
                    <div key={owner.addr} className={styles["item"]}>
                      <p>
                        Signer {index + 1} ({owner.name})
                      </p>
                      <div className={styles["itemRight"]}>
                        <p className={styles["textBold"]}>{strTruncateMiddle(owner.addr, 10, 10)}</p>
                        <div>
                          <IconCopy copy={owner.addr} />
                        </div>
                        <div>
                          <IconLink link={`${getExplorerURL()}/address/${owner.addr}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className={`box-safe ${styles["cosigner-optin-desc"]}`}>
          <div>
            <div>
              <p className={styles["textDescription"]}>
                You are about to load a Safe to your dashboard. You need at least <b>{microalgosToAlgos(minBalance)} ALGO</b>{" "}
                balance in your wallet. You are one of the signers of the Safe, you need to{" "}
                <span className={styles["optIn"]}>opt into</span> the Safe. Opting into a Safe will prompt you to confirm a
                transaction with your currently connected wallet. Please make sure your browser{" "}
                <a
                  target="_blank"
                  href="https://support.google.com/chrome/answer/95472?hl=en&co=GENIE.Platform%3DDesktop"
                  rel="noreferrer"
                >
                  <span className={styles["popUp"]}>doesn’t block pop-up</span>
                </a>{" "}
                from your wallet.
              </p>
              <p>Here is the breakdown of the transactions</p>
            </div>
            <div className={styles["textBottomDesc"]}>
              <p className={styles["textBold"]}>Opt-in TX Fee</p>
              <p className={styles["textBold"]}>{microalgosToAlgos(optInFees())} ALGO</p>
            </div>

            <div className="divider mb-4"></div>
            {disableOptIn && <Alert message={ERR_INSUFFICIENT_WALLET_BALANCE} />}

            {isLedger ? (
              <div className={styles.ledgerContent}>
                <div className={styles.imgWrapper}>
                  <img src="images/icon-ledger.svg" style={{ width: "100%", height: "100%" }} alt="icon" />
                </div>
                <p>Connect your Ledger to your computer, unlock, and choose the &apos;Algorand&apos; app before connecting.</p>
              </div>
            ) : null}
            <div className={styles["footerContentDesktop"]}>
              <button className={`btn btn-white ${styles["btnBackPos"]}`} onClick={() => onChangeComponent("selectAccount")}>
                <p>BACK</p>
              </button>
              <Button className={styles["btnOptInPos"]} primary onClick={() => optIn()} disabled={disableOptIn}>
                <p>OPT-IN</p>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoSignerOptInDetail;
