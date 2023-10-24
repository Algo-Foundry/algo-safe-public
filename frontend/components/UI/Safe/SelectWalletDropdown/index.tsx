/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import styles from "./SelectWalletDropdown.module.scss";
import WalletIcon from "frontend/components/Icons/WalletIcon";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import { useOutsideClick } from "frontend/hooks/useOutsideClick";
import { useWallet } from "@txnlab/use-wallet";
import useSidebar from "frontend/hooks/useSidebar";
import SafeService from "frontend/services/safe";
import { setShowWalletDialog } from "frontend/redux/features/wallet/walletSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import { strTruncateMiddle } from "shared/utils";
import { setSigner, getAvailableSigners } from "frontend/redux/features/safe/safeSlice";
import LedgerIcon from "frontend/components/Icons/LedgerIcon";

type Data = {
  name: string;
  providerId?: string;
  address: string;
  ledgerAddress?: string;
  nfd?: string;
};

const ss = new SafeService();

interface Props {
  onChangeAccount?: any;
  isResume?: boolean;
  isComponentSm?: boolean;
  isSafe?: boolean;
}

const SelectWalletDropdown: React.FC<Props> = ({
  onChangeAccount,
  isResume = false,
  isComponentSm = false,
  isSafe = false,
}: Props) => {
  const dispatch = useAppDispatch();
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useOutsideClick(() => setOpenSelect(false));
  const [listDropdown, setListDropdown] = useState<Data[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Data | null>(null);
  const { activeAccount, activeAddress, isReady } = useWallet();
  const { sidebarLedgers, selected } = useSidebar();
  const availableSigners: Data[] = useAppSelector(getAvailableSigners);

  const openWalletNavbar = () => {
    dispatch(setShowWalletDialog(true));
  };

  const getDropdownData = async () => {
    let AllList: Data[] = [];

    if (isSafe) {
      // fetch from safeSlice if its a safe
      AllList = availableSigners;
    } else {
      if (activeAccount) {
        AllList = [activeAccount, ...sidebarLedgers];
      } else {
        AllList = sidebarLedgers;
      }
    }

    if (AllList.length !== 0) {
      if (isResume) AllList = AllList.filter((item: Data) => item.providerId);

      //convert adresses to array
      const accountsAddress = AllList.map((object: Data) => object.address);
      const getNfd = await ss.getNfdDomainName(accountsAddress);
      if (getNfd !== null) {
        AllList = AllList.map((adrObject: Data) => {
          const adrName = adrObject.address;
          if (getNfd.hasOwnProperty(adrName)) {
            return { ...adrObject, nfd: getNfd[adrName].name };
          }
          return adrObject;
        });
      }
      setSelectedAccount(AllList[0]);
    } else {
      setSelectedAccount(null);
    }
    setListDropdown(AllList);
  };

  const dispatchSigner = (item: Data) => {
    if (item.address === activeAccount?.address) {
      dispatch(setSigner(activeAccount));
    } else {
      dispatch(
        setSigner({
          name: item.name,
          address: item.address,
          providerId: item?.providerId as any,
          ledgerAddress: item?.ledgerAddress,
        })
      );
    }
  };

  const onSelectAccount = (item: Data) => {
    setSelectedAccount(item);
    setOpenSelect(!openSelect);
    dispatchSigner(item);
  };

  useEffect(() => {
    if (!activeAccount) return;
    if (activeAccount !== selectedAccount) {
      setSelectedAccount(activeAccount);
    }
  }, [activeAccount]);

  useEffect(() => {
    let fetchingFor = null;

    if (fetchingFor !== activeAddress) {
      if (isReady) {
        getDropdownData();
      }
    }

    return () => {
      fetchingFor = activeAddress;
    };
  }, [JSON.stringify(availableSigners), isReady, selected]);

  useEffect(() => {
    onChangeAccount && onChangeAccount(selectedAccount);
  }, [selectedAccount]);

  return (
    <div ref={ref} className={styles["parent"]}>
      {selectedAccount ? (
        <div className={styles["container"]}>
          <div onClick={() => setOpenSelect(!openSelect)} className={styles["content"]}>
            <div className={`${styles["leftContent"]}`}>
              {selectedAccount.ledgerAddress ? (
                <div className={styles.walletIcon}>
                  <LedgerIcon />
                </div>
              ) : (
                <div className={styles.walletIcon}>
                  <WalletIcon />
                </div>
              )}
              <div className={`${styles["walletValue"]}`}>
                {selectedAccount.nfd ? (
                  <p className={`${styles["walletTextBold"]}`}>{strTruncateMiddle(selectedAccount.nfd, 5, 5)}</p>
                ) : (
                  <div className={styles.textWallet}>
                    <p className={`${styles["walletTextBold"]}`}>{selectedAccount.name}</p>
                  </div>
                )}
                <div className={styles["textAddr"]}>
                  {!isComponentSm ? (
                    <p className={`${styles["walletTextAddr"]}`}> - {strTruncateMiddle(selectedAccount.address, 10, 10)}</p>
                  ) : (
                    <p className={`${styles["walletTextAddr"]}`} style={{ fontWeight: "normal" }}>
                      {" "}
                      - {strTruncateMiddle(selectedAccount.address, 5, 5)}
                    </p>
                  )}
                </div>
                {/* <div>
                  <p>
                    qwew
                    <span className={`${styles["walletTextBold"]}`}>
                      {selectedAccount.nfd ? strTruncateMiddle(selectedAccount.nfd, 5, 5) : selectedAccount.name}
                    </span>{" "}
                    {!isComponentSm ? (
                      <span className={`${styles["walletTextAddr"]}`}>
                        - {strTruncateMiddle(selectedAccount.address, 10, 10)}
                      </span>
                    ) : (
                      <span className={`${styles["walletTextAddr"]}`} style={{ fontWeight: "normal" }}>
                        - {strTruncateMiddle(selectedAccount.address, 5, 5)}
                      </span>
                    )}
                  </p>
                </div> */}
              </div>
            </div>
            <div className={styles.walletIcon}>
              <ArrowDown />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`btn default ${styles.btnConnect}`}
          onClick={() => {
            openWalletNavbar();
          }}
        >
          CONNECT WALLET
        </div>
      )}
      {openSelect && (
        <div className={styles["itemContainer"]}>
          <div className={styles["itemContent"]}>
            {listDropdown.length == 0 && (
              <div
                onClick={() => {
                  openWalletNavbar();
                }}
              >
                <div className={`${styles["leftContent"]}`}>
                  <div className={styles.walletIcon}>
                    <WalletIcon />
                  </div>
                  <div className={`${styles["walletValue"]}`}>
                    <p className={`${styles["walletTextBold"]}`}>Connect Wallet</p>
                  </div>
                </div>
              </div>
            )}
            {listDropdown.map((item: Data, index: number) => (
              <div key={index} onClick={() => onSelectAccount(item)} className={styles["item"]}>
                <div className={`${styles["leftContent"]}`}>
                  {item.ledgerAddress ? (
                    <div className={styles.walletIcon}>
                      <LedgerIcon />
                    </div>
                  ) : (
                    <div className={styles.walletIcon}>
                      <WalletIcon />
                    </div>
                  )}
                  <div className={`${styles["walletValue"]}`}>
                    {item.nfd ? (
                      <p className={`${styles["walletTextBold"]}`}>{strTruncateMiddle(item.nfd, 5, 5)}</p>
                    ) : (
                      <div className={styles.textWallet}>
                        <p className={`${styles["walletTextBold"]}`}>{item.name}</p>
                      </div>
                    )}
                    <div className={styles["textAddr"]}>
                      {!isComponentSm ? (
                        <p className={`${styles["walletTextAddr"]}`}> - {strTruncateMiddle(item.address, 10, 10)}</p>
                      ) : (
                        <p className={`${styles["walletTextAddr"]}`} style={{ fontWeight: "normal" }}>
                          {" "}
                          - {strTruncateMiddle(item.address, 5, 5)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* {activeAccount &&
              <div               
                onClick={() => {
                  openWalletNavbar();
                }}
                className={`d-flex w-100 justify-content-end ${styles.boxLink}`}
              >
                <div className={`${styles["walletValue"]}`}>                  
                  <p className={`${styles["walletTextBold"]} ${styles.textlink}`}>Switch Active Wallet</p>
                </div>
              </div>
            } */}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectWalletDropdown;
