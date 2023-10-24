import React, { useEffect, useState } from "react";
import styles from "./ResumeSafeCreation.module.scss";
import SelectWalletDropdown from "frontend/components/UI/Safe/SelectWalletDropdown";
import Loader from "frontend/components/Icons/Loader";
import List from "frontend/components/Icons/List";
import ButtonNew from "frontend/components/Button";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import DetailTrx from "./DetailTrx";
import { useAppDispatch } from "frontend/redux/hooks";
import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { getExplorerURL, strTruncateMiddle } from "shared/utils";
import { setNewSafeData } from "frontend/redux/features/safe/safeSlice";
import { useWallet } from "@txnlab/use-wallet";

enum Status {
  SAFE_PANEL_LOADING = 0,
  SAFE_PANEL_NO_DATA = 1,
  SAFE_PANEL_LOADED = 2,
  SAFE_PANEL_NO_WALLET = 3,
}
const ResumeSafeCreation = () => {
  const ss = new SafeService();
  const [sectionRender, setSectionRender] = useState(1);
  const dispatch = useAppDispatch();
  const [safePanelStatus, setSafePanelStatus] = useState(Status.SAFE_PANEL_LOADED);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [safes, setSafes] = useState<Safe[]>([]);
  const [selectedSafe, setSelectedSafe] = useState<Safe>();
  const { activeAccount } = useWallet();

  const getSafes = async () => {
    setSafePanelStatus(Status.SAFE_PANEL_LOADING);

    if (!selectedAccount) {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
      return;
    }

    //checking for safe in localstorage
    const now = new Date().getTime();
    let userSafesFromLocalStrorage;

    try {
      userSafesFromLocalStrorage = JSON.parse(localStorage.getItem("resume-safe-list") || "");
    } catch (err) {
      localStorage.removeItem("resume-safe-list");
    }

    let safeList = userSafesFromLocalStrorage?.safes || [];

    const expirySafe = userSafesFromLocalStrorage?.expiry ? now - userSafesFromLocalStrorage?.expiry > 1000 * 60 * 15 : true;
    if (!userSafesFromLocalStrorage?.address || expirySafe || userSafesFromLocalStrorage?.address !== selectedAccount.address) {
      safeList = await ss.getSafesToResumeCreation(selectedAccount.address);
      localStorage.setItem(
        "resume-safe-list",
        JSON.stringify({
          safes: safeList,
          address: selectedAccount.address,
          expiry: now + 1000 * 60 * 15,
        })
      );
    }

    if (safeList.length != 0) {
      setSafePanelStatus(Status.SAFE_PANEL_LOADED);
      setSafes(safeList);
    } else {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
      setSafes([]);
    }
  };

  async function resume(safe: Safe) {
    try {
      setSelectedSafe(safe);
      dispatch(setNewSafeData(safe));

      setSectionRender(2);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getSafes();
  }, [selectedAccount]);

  useEffect(() => {
    activeAccount && setSectionRender(1);
  }, [activeAccount]);

  const AddrText = ({ safe }: any) => {
    return (
      <>
        <p className={styles.addrDesktop}>{strTruncateMiddle(safe.address || "", 15, 15)}</p>
        <p className={styles.addrMobile}>{strTruncateMiddle(safe.address || "", 5, 5)}</p>
      </>
    );
  };

  return (
    <>
      {sectionRender == 1 && (
        <div className={styles["container"]}>
          <div className={`box-safe ${styles["content"]}`}>
            <div className={styles.boxContent}>
              <div className={`${styles.textHeader} d-flex flex-column gap-2`}>
                <label className={`${styles["textHeader"]}`}>Select Account</label>
                <SelectWalletDropdown isResume={true} onChangeAccount={setSelectedAccount} />
              </div>
              {activeAccount && (
                <>
                  {safePanelStatus == 0 && (
                    <div className={`${styles.boxSafeList}`}>
                      <div className={`${styles.boxLoader} my-auto`}>
                        <div className={`${styles.wrapLoader}`}>
                          <Loader />
                        </div>
                        <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>Fetching Data ....</div>
                      </div>
                    </div>
                  )}
                  {safePanelStatus == 1 && (
                    <div className={`${styles.boxSafeList}`}>
                      <div className={`${styles.boxLoader} my-auto`}>
                        <div className={`${styles.wrapLoader}`}>
                          <List />
                        </div>
                        <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>No Pending Safe Creation found.</div>
                        <div className={`${styles.textContent} ${styles.textLoader}`}>
                          You might want to Create a new Safe again.
                        </div>
                      </div>
                    </div>
                  )}
                  {safePanelStatus == 2 && (
                    <div className={styles.boxSafeListWrapper}>
                      <div className={`${styles.boxSafeList}`}>
                        <div className={`${styles.radioWrap} ${styles.header}`}>
                          <div className={styles["headerTitle"]}>
                            <div className={styles.parentLeftItem}>
                              {/* <div style={{ width: "40%" }}>
                                <p>Safe Name</p>
                              </div> */}
                              <div style={{ width: "60%" }}>
                                <p>Safe ID/Address</p>
                              </div>
                            </div>
                            <div className={styles.parentRightItem}>
                              <div style={{ width: "60%" }}>
                                <p>Status</p>
                              </div>
                              <div style={{ width: "40%" }}></div>
                            </div>
                          </div>
                        </div>
                        {safes.map((safe: Safe, index: number) => (
                          <div key={index} className={styles.childContent}>
                            <div className={styles.childLeftItem}>
                              {/* <div className={styles.textWrapperLeft}>
                                <p className={styles.textBold}>{safe.name}</p>
                              </div> */}
                              <div className={styles.textWrapperRight}>
                                <div className={styles.flexWrapperText}>
                                  <p>#{safe.appId}</p>
                                  <IconCopy copy={String(safe.appId)} />
                                  <IconLink link={`${getExplorerURL()}/application/${safe.appId}`} />
                                </div>
                                <div className={styles.flexWrapperText}>
                                  <AddrText safe={safe} />
                                  <IconCopy copy={safe.address} />
                                  <IconLink link={`${getExplorerURL()}/address/${safe.address}`} />
                                </div>
                              </div>
                            </div>
                            <div className={styles.childRightItem}>
                              <div className={styles.widthLeft}>
                                <p className={styles.textStatusItem}>
                                  {safe.initialized ? "Opt-in Required" : "Re-initialization Required"}
                                </p>
                              </div>
                              <div className={styles.widthRight}>
                                <ButtonNew primary className={styles.btnStyle} onClick={() => resume(safe)}>
                                  <p className={styles.btnResumeStyle}>RESUME</p>
                                </ButtonNew>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {sectionRender == 2 && <DetailTrx selectedSafe={selectedSafe} backSection={() => setSectionRender(1)} />}
    </>
  );
};

export default ResumeSafeCreation;
