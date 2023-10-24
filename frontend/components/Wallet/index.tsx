import styles from "./Wallet.module.scss";
import WalletModal from "frontend/components/Wallet/WalletModal";
import ModalWalletStatus from "frontend/components/Wallet/WalletModal/ModalWalletStatus";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Button from "frontend/components/Button";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import Close from "frontend/components/Icons/Close";
import { selectShowWalletDialog, setShowWalletDialog } from "frontend/redux/features/wallet/walletSlice";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { strTruncateMiddle } from "shared/utils";
import { AccountWithNFD } from "shared/interfaces";
import Menu from "frontend/components/Icons/Menu";
import { Collapse } from "react-bootstrap";
import BookOpen from "frontend/components/Icons/BookOpen";
import Discord from "frontend/components/Icons/Discord";
import Linkedin from "frontend/components/Icons/Linkedin";
import Medium from "frontend/components/Icons/Medium";
import Reddit from "frontend/components/Icons/Reddit";
import Twitter from "frontend/components/Icons/Twitter";
import MailOpen from "frontend/components/Icons/MailOpen";
import { useOutsideClick } from "frontend/hooks/useOutsideClick";
import ContactUsModal from "./ContactUsModal";

const Wallet = () => {
  const router = useRouter();
  const [modalDisconnect, setModalDisconnect] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [contactShow, setContactShow] = useState(false);
  const [socialDropdown, setSocialDropdown] = useState(false);
  const showWallets = useAppSelector(selectShowWalletDialog);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithNFD | null>(null);
  const dispatch = useAppDispatch();
  const ref = useOutsideClick(() => setSocialDropdown(false));

  useEffect(() => {
    if (showWallets) {
      setModalShow(showWallets);
    }
  }, [showWallets]);

  useEffect(() => {
    if (!modalShow) {
      dispatch(setShowWalletDialog(modalShow));
    }
  }, [modalShow]);

  const exitWallet = () => {
    setModalDisconnect(false);
    router.push("/");
  };

  const handleSetActiveAccount = (acc: AccountWithNFD | null) => {
    setSelectedAccount(acc);
  };

  return (
    <>
      <WalletModal
        modalStatus={modalShow}
        onHide={() => {
          setModalShow(false);
        }}
        onSetActiveAccount={handleSetActiveAccount}
      />
      <ModalWalletStatus
        modalStatus={modalDisconnect}
        type="disconnected"
        message="You have been disconnected"
        onHide={() => exitWallet()}
      />
      <ContactUsModal
        modalStatus={contactShow}
        onHide={() => {
          setContactShow(false);
        }}
      />

      <div className={`d-flex gap-2 align-items-center`}>
        <Button
          primary
          className={`${styles.connectWallet} d-md-flex ${selectedAccount && styles.active}`}
          onClick={() => {
            setModalShow(!modalShow);
            setSocialDropdown(false);
          }}
        >
          <div className={`${styles.connectWalletBox} ${selectedAccount && styles.textBlack}`}>
            <div className={`d-flex gap-2 align-items-center`}>
              {!selectedAccount ? (
                <span>CONNECT WALLET</span>
              ) : (
                <>
                  <img
                    className={styles.imgAddress}
                    src={
                      selectedAccount.providerId == "defly"
                        ? "/img/icon/icon-algofy.png"
                        : selectedAccount.providerId == "walletconnect"
                        ? "/img/icon/walletconnect.svg"
                        : "/img/icon/icon-pera-wallet.svg"
                    }
                    alt=""
                  />
                  <div className={styles.textAddress}>
                    {selectedAccount.nfd && selectedAccount.nfd.length > 0
                      ? strTruncateMiddle(selectedAccount.nfd, 5, 5)
                      : strTruncateMiddle(selectedAccount.address, 5, 5)}
                  </div>
                </>
              )}
            </div>
            {!modalShow ? <ArrowDown /> : <Close />}
          </div>
        </Button>
        {/* <Button primary className={`${styles.connectWallet} d-flex d-md-none`} onClick={() => setModalShow(!modalShow)}>
          <div className={`${styles.connectWalletBox}`}>
            <div>
              <WalletIcon />
            </div>
            {!modalShow ? <ArrowDown /> : <Close />}
          </div>
        </Button> */}
        <div ref={ref} className={`${styles.boxDropdown}`}>
          <div className={`${styles.btnNotif}`} role="button" onClick={() => setSocialDropdown(!socialDropdown)}>
            {socialDropdown ? <Close /> : <Menu />}
          </div>
          <Collapse in={socialDropdown}>
            <div className={styles.dropdownMedia} onClick={() => setSocialDropdown(false)}>
              <a
                href="https://docs.algofoundry.studio/our-products/foundry-safe"
                target="_blank"
                className={`${styles.wrapTextBtn}`}
                rel="noreferrer"
              >
                <BookOpen />
                <span>DOCS</span>
              </a>
              <div
                role="button"
                className={`${styles.wrapTextBtn}`}
                onClick={() => {
                  setContactShow(!contactShow);
                }}
              >
                <MailOpen />
                <span>CONTACT US</span>
              </div>
              <div className={styles.lineMedia}></div>
              <a
                href="https://discord.com/invite/9EqPmrRA29"
                target="_blank"
                rel="noreferrer"
                className={`${styles.wrapTextBtn}`}
              >
                <Discord />
                <span>DISCORD</span>
              </a>
              <a
                href="https://www.linkedin.com/company/algo-foundry"
                target="_blank"
                rel="noreferrer"
                className={`${styles.wrapTextBtn}`}
              >
                <Linkedin />
                <span>LINKEDIN</span>
              </a>
              <a href="https://algofoundry.medium.com/" target="_blank" rel="noreferrer" className={`${styles.wrapTextBtn}`}>
                <Medium />
                <span>MEDIUM</span>
              </a>
              <a
                href="https://www.reddit.com/r/AlgoFoundry_/"
                target="_blank"
                rel="noreferrer"
                className={`${styles.wrapTextBtn}`}
              >
                <Reddit />
                <span>REDDIT</span>
              </a>
              <a href="https://twitter.com/algo_foundry" target="_blank" rel="noreferrer" className={`${styles.wrapTextBtn}`}>
                <Twitter />
                <span>TWITTER</span>
              </a>
            </div>
          </Collapse>
        </div>
      </div>
    </>
  );
};

export default Wallet;
