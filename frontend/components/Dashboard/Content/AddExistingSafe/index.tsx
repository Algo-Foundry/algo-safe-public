import { useState, useEffect } from "react";
import styles from "./AddExistingSafe.module.scss";
import { strTruncateMiddle } from "shared/utils";
import IconLink from "frontend/components/UI/Icon/iconLink";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import Loader from "frontend/components/Icons/Loader";
import SafeEmpty from "frontend/components/Icons/SafeEmpty";
import { algoexplorerTransactionUrl } from "frontend/utils/string";
import SelectWalletDropdown from "frontend/components/UI/Safe/SelectWalletDropdown";
import ButtonNew from "frontend/components/Button";
import SafeService from "frontend/services/safe";
import { Safe } from "shared/interfaces";
import { setUserSafes } from "frontend/redux/features/safe/safeSlice";
import { useAppDispatch } from "frontend/redux/hooks";
import { useWallet } from "@txnlab/use-wallet";
import useSidebar from "frontend/hooks/useSidebar";
import Router from "next/router";
import { USER_SAFES } from "shared/constants";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import CoSignerOptInSelectAccount from "../CoSignerOptIn/SelectAccount";
import CoSignerOptInDetail from "../CoSignerOptIn/Details";
import TooltipExistingSafe from "./TooltipExistingSafe";
import { errors } from "shared/constants";

enum Status {
  SAFE_PANEL_LOADING = 0,
  SAFE_PANEL_NO_DATA = 1,
  SAFE_PANEL_LOADED = 2,
  SAFE_PANEL_NO_WALLET = 3,
}

// let intervalId: any;

const AddExistingSafe = () => {
  const ss = new SafeService();
  const dispatch = useAppDispatch();
  const { activeAccount } = useWallet();
  const { sidebarAccounts, saveList, setSidebarAccount } = useSidebar();
  const [safePanelStatus, setSafePanelStatus] = useState(Status.SAFE_PANEL_LOADED);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [loadedSafes, setLoadedSafes] = useState<Safe[]>([]);
  const [selectedSafes, setSelectedSafes] = useState<Safe[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [renameSafes, setRenameSafes] = useState(false);
  const [selectedNewSafes, setSelectedNewSafes] = useState<any[]>([]);
  const [isAnySelect, setIsAnySelect] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false);

  const [loadComponent, setLoadComponent] = useState("selectAccount");
  const [safe, setSafe] = useState<Safe | null>(null);
  const handleLoadComponent = (component: string) => {
    setLoadComponent(component);
  };

  const getSafes = async () => {
    setSafePanelStatus(Status.SAFE_PANEL_LOADING);

    if (!selectedAccount) {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
      return;
    }

    //checking for safe in localstorage
    const now = new Date().getTime();
    // const getUserSafesFromLocalStrorage = localStorage.getItem(USER_SAFES) ?? "";
    let userSafesFromLocalStrorage;

    try {
      userSafesFromLocalStrorage = JSON.parse(localStorage.getItem(USER_SAFES) || "");
    } catch (err) {
      localStorage.removeItem(USER_SAFES);
    }

    let safes = userSafesFromLocalStrorage?.safes || [];

    const expirySafe = userSafesFromLocalStrorage?.expiry ? now - userSafesFromLocalStrorage?.expiry > 1000 * 60 * 15 : true;

    if (!userSafesFromLocalStrorage?.address || expirySafe || userSafesFromLocalStrorage?.address !== selectedAccount.address) {
      safes = await ss.getUserSafes(selectedAccount.address);
      localStorage.setItem(
        USER_SAFES,
        JSON.stringify({
          safes,
          address: selectedAccount.address,
          expiry: now + 1000 * 60 * 15,
        })
      );
    }

    // get safe accounts from sidebar
    const sidebarSafe = new Set();
    sidebarAccounts.forEach((item: any) => {
      if (item.appId !== undefined) {
        sidebarSafe.add(item.address);
      }
    });

    const safesToAdd: Safe[] = [];
    const safesImported = safes.map((item: any) => {
      if (sidebarSafe.has(item.address)) {
        item.isChecked = true;
        item.isExist = true;
        safesToAdd.push(item);
      } else {
        item.isChecked = false;
        item.isExist = false;
      }

      return item;
    });

    // remove duplicates
    const selectedSafes_set = new Set(selectedSafes.map((item) => item.address));
    const newSafes = safesToAdd.filter((l) => !selectedSafes_set.has(l.address));

    if (safes.length != 0) {
      setSafePanelStatus(Status.SAFE_PANEL_LOADED);
    } else {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
    }

    setSelectedSafes(newSafes);
    setLoadedSafes(safesImported);
    dispatch(setUserSafes(safes));
    setIsAllSelected(newSafes.length === safesImported.length);
  };

  useEffect(() => {
    getSafes();
  }, [selectedAccount, sidebarAccounts]);

  useEffect(() => {
    selectedSafes.forEach((item: Safe) => {
      if (item.isExist) {
        setIsAnySelect(true);
      } else {
        setIsAnySelect(false);
      }
    });
  }, [selectedSafes]);

  useEffect(() => {
    if (!activeAccount) handleLoadComponent("selectAccount");
  }, [activeAccount]);

  const handleChange = (e: any, idx?: any) => {
    const { name, checked } = e.target;

    if (name === "allSelect") {
      const tempSafe = loadedSafes.map((item: Safe) => {
        return { ...item, isChecked: item.isExist ? true : checked };
      });

      setLoadedSafes(tempSafe);

      // assign/reassign all Selected safe list to SelectedSafe
      if (checked) {
        const newAddSafe = selectedSafes.concat(
          tempSafe.filter((safe1) => !selectedSafes.some((safe2) => safe2.address === safe1.address))
        );
        setSelectedSafes(newAddSafe);
      } else {
        const removeUncheck = selectedSafes.filter(
          (obj2) => !tempSafe.some((obj1) => obj1.address === obj2.address && !obj2.isExist)
        );
        setSelectedSafes(removeUncheck);
      }
    } else {
      const tempSafe = loadedSafes.map((item: any, index: any) => (index === idx ? { ...item, isChecked: checked } : item));
      setLoadedSafes(tempSafe);

      // assign/reassign Selected safe list to SelectedSafe

      const safeChange = tempSafe.find((asset, index) => index === idx);

      if (checked) {
        setSelectedSafes((prevSafes) => [...prevSafes, safeChange]);
      } else {
        setSelectedSafes((prevSafes) => prevSafes.filter((safe) => safe.address !== safeChange.address));
      }
    }
  };

  const handleAddSafe = async () => {
    const removePropertiesSafes: any[] = [];
    selectedSafes.forEach((item: Safe) => {
      if (!item.isExist) {
        removePropertiesSafes.push({
          name: item.name,
          address: item.address,
          appId: item.appId,
          errorName: "",
        });
      }
    });
    setSelectedNewSafes(removePropertiesSafes);
    setRenameSafes(true);
  };

  const handleSaveSafe = async () => {
    const allNewSafes: SidebarAccount[] = [];

    selectedNewSafes.forEach((acc: any) => {
      allNewSafes.push({
        address: acc.address,
        appId: acc.appId,
        name: acc.name,
      });
    });

    try {
      const listAppState = [...sidebarAccounts, ...allNewSafes];
      if (activeAccount) {
        await saveList(listAppState, activeAccount.address);
      } else {
        await saveList(listAppState);
      }

      if (allNewSafes.length > 0) {
        setSidebarAccount(allNewSafes[0]);
      }

      Router.push("/dashboard");
    } catch (e) {
      console.log("err:", e);
    }
  };

  const verifySafesName = (e: string, index: number) => {
    let accountToCheck: any = { ...selectedNewSafes[index], name: e };

    const checkSP = /^[a-zA-Z0-9 _-]*$/.test(accountToCheck.name);
    if (accountToCheck.name && !checkSP) {
      accountToCheck.errorName = errors.ERR_SAFE_SIGNERS_SPEC_CHAR;
    }
    if (accountToCheck.name.length < 4) {
      accountToCheck.errorName = "4-32 characters only"; //errors.ERR_SAFE_SIGNERS_TOO_SHORT;
    }
    if (checkSP && accountToCheck.name.length >= 4) {
      // eslint-disable-next-line
      const { errorName, ...updatedObj } = accountToCheck;
      accountToCheck = updatedObj;
    }
    return accountToCheck;
  };

  const handleChangeName = async (e: any, index: number) => {
    const safesAccount = await verifySafesName(e.target.value, index);
    const newSafes = [...selectedNewSafes];
    newSafes[index] = safesAccount;

    setSelectedNewSafes(newSafes);
  };

  useEffect(() => {
    if (renameSafes) {
      const checkInvalid = selectedNewSafes.find((v: any) => v.errorName && v.errorName.length !== 0);
      if (checkInvalid === undefined) {
        setSaveDisabled(false);
      } else {
        setSaveDisabled(true);
      }
    }
  }, [selectedNewSafes]);

  const AddrText = ({ value }: any) => {
    if (value.isExist) {
      return (
        <>
          <TooltipExistingSafe text="Safe has been imported">
            <div className={`${styles.textContent} ${styles.addrTextDesktop} ${styles.disableText}`}>
              {strTruncateMiddle(value.address, 25, 25)}
            </div>
          </TooltipExistingSafe>
          <TooltipExistingSafe text="Safe has been imported">
            <div className={`${styles.textContent} ${styles.addrTextDesktopMobile} ${styles.disableText}`}>
              {strTruncateMiddle(value.address, 10, 10)}
            </div>
          </TooltipExistingSafe>
        </>
      );
    } else {
      return (
        <>
          <div className={`${styles.textContent} ${styles.addrTextDesktop}`}>{strTruncateMiddle(value.address, 25, 25)}</div>
          <div className={`${styles.textContent} ${styles.addrTextDesktopMobile}`}>
            {strTruncateMiddle(value.address, 10, 10)}
          </div>
        </>
      );
    }
  };

  const HeaderTitle = () => {
    return (
      <>
        <div className={`${styles["headerTitle"]} justify-content-between`}>
          <div className={`${styles["headerLeftText"]}`}>
            <p>Safe Name</p>
          </div>
          <div className={`${styles["headerMiddleText"]}`}>
            <p>Safe Address</p>
          </div>
          <div className={`${styles["headerRightText"]}`}>
            <p>Safe ID</p>
          </div>
        </div>
        <div className={styles.headerTitleMobile}>
          <p>All Safe(s)</p>
        </div>
      </>
    );
  };

  return (
    <div className={styles["container"]}>
      {loadComponent === "selectAccount" && (
        <>
          {!renameSafes ? (
            <div className={`box-safe ${styles["add-load-safe"]}`}>
              <form className={styles.boxContent}>
                <div className={`${styles.textHeader} d-flex flex-column gap-2`}>
                  <label className={`${styles["textHeader"]}`}>Select Account</label>
                  <SelectWalletDropdown onChangeAccount={setSelectedAccount} />
                </div>
                {activeAccount && (
                  <div className={styles.boxContent}>
                    {safePanelStatus == Status.SAFE_PANEL_LOADING && (
                      <div className={`${styles.boxSafeList}`}>
                        <div className={`${styles.boxLoader} my-auto`}>
                          <div className={`${styles.wrapLoader}`}>
                            <Loader />
                          </div>
                          <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>Fetching Data ....</div>
                        </div>
                      </div>
                    )}
                    {safePanelStatus == Status.SAFE_PANEL_NO_DATA && (
                      <div className={`${styles.boxSafeList}`}>
                        <div className={`${styles.boxLoader} my-auto`}>
                          <div className={`${styles.wrapLoader}`}>
                            <SafeEmpty />
                          </div>
                          <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>No safe detected</div>
                        </div>
                      </div>
                    )}
                    {safePanelStatus == Status.SAFE_PANEL_LOADED && (
                      <div className={styles.boxSafeListWrapper}>
                        <div className={`${styles.boxSafeList}`}>
                          <div className={`${styles.radioWrap} ${styles.header}`}>
                            <input
                              type="checkbox"
                              role="button"
                              name="allSelect"
                              checked={!loadedSafes.some((user) => user.isChecked !== true)}
                              onChange={handleChange}
                              className={styles.checkboxInput}
                            />
                            <HeaderTitle />
                          </div>
                          {loadedSafes.map((value, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                role="button"
                                name={value.name}
                                checked={value.isChecked}
                                onChange={(e) => handleChange(e, index)}
                                disabled={value.isExist}
                                className={styles.checkboxInput}
                              />
                              <div className={styles["bodyTitle"]}>
                                <div className={`${styles["headerLeftText"]}`}>
                                  <div className={`${styles.textContent} ${styles.textBold}`}>
                                    <p className={`${value.isExist ? styles.disableText : styles["valueBold"]}`}>{value.name}</p>
                                  </div>
                                  {/* {value.status != "owner" && <div className={styles.wrapReadOnly}>read only</div>} */}
                                </div>
                                <div className={`${styles["headerMiddleText"]}`}>
                                  <AddrText value={value} />
                                  <IconCopy copy={value.address} disabled={value.isExist} />
                                  <IconLink
                                    link={algoexplorerTransactionUrl({
                                      id: value.address,
                                      path: "address",
                                    })}
                                    disabled={value.isExist}
                                  />
                                </div>
                                <div className={`${styles["headerRightText"]}`}>
                                  <div className={`${styles.textContent} ${value.isExist && styles.disableText}`}>
                                    #{value.appId}
                                  </div>
                                  <IconCopy copy={value.appId.toString()} disabled={value.isExist} />
                                  <IconLink
                                    link={algoexplorerTransactionUrl({
                                      id: value.appId.toString(),
                                      path: "application",
                                    })}
                                    disabled={value.isExist}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {safePanelStatus == Status.SAFE_PANEL_NO_WALLET && (
                      <div className={`${styles.boxSafeList}`}>
                        <div className={`${styles.boxLoader} my-auto`}>
                          <div className={`${styles.wrapLoader}`}>
                            <SafeEmpty />
                          </div>
                          <div className={`${styles.textContent} ${styles.textLoader} mt-3`}>Not connected</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
              {activeAccount && (
                <>
                  <div className="divider"></div>
                  <div className="box-button ms-auto">
                    <ButtonNew
                      primary
                      onClick={handleAddSafe}
                      className={styles["btnAdd"]}
                      disabled={
                        safePanelStatus === Status.SAFE_PANEL_NO_DATA ||
                        safePanelStatus === Status.SAFE_PANEL_LOADING ||
                        safePanelStatus === Status.SAFE_PANEL_NO_WALLET ||
                        selectedSafes.length === 0 ||
                        isAllSelected ||
                        isAnySelect
                      }
                    >
                      <p>ADD</p>
                    </ButtonNew>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`box-safe ${styles["add-load-safe"]}`}>
              <form className={styles.boxContent}>
                {activeAccount && (
                  <div className={`d-flex flex-column w-100`}>
                    <div className={`${styles.textContent} w-100 mb-3 mb-lg-4`}>
                      You are going to add these Safe to the side panel
                    </div>
                    <div className={`${styles["headerTitle"]} ${styles.withBorder} m-0`}>
                      <div className={`${styles.addressRename}`}>
                        <p>
                          Safe Address<span className="d-inline d-lg-none">/ID</span>
                        </p>
                      </div>
                      <div className={`${styles.appIdRename}`}>
                        <p>Safe ID</p>
                      </div>
                      <div className={`${styles.nameRename}`}>
                        <p>Safe Name</p>
                      </div>
                    </div>
                    <div className={`${styles.boxSafeList} ${styles.rename}`}>
                      {selectedNewSafes.map((value, index) => (
                        <div key={index} className={`d-flex align-items-center`}>
                          <div className={`${styles.addressRename}`}>
                            <div className={`${styles.textContent} d-none d-lg-inline`}>
                              {strTruncateMiddle(value.address, 10, 10)}
                            </div>
                            <div className={`${styles.textContent} d-flex flex-column d-lg-none`}>
                              <p>{strTruncateMiddle(value.address, 5, 5)}</p>
                              <p>#{value.appId}</p>
                            </div>
                          </div>
                          <div className={`${styles.appIdRename}`}>
                            <div className={`${styles.textContent} d-lg-inline`}>#{value.appId}</div>
                          </div>
                          <div className={`${styles.nameRename}`}>
                            <input
                              type="text"
                              className={`form-controls ${
                                value.errorName && value.errorName.length !== 0 ? "text-red" : "text-black"
                              }`}
                              id="ledgerName"
                              placeholder="Enter Safe Name"
                              onChange={(evt) => handleChangeName(evt, index)}
                              maxLength={32}
                              value={value.name}
                              style={{ textOverflow: "ellipsis" }}
                            />
                            <div className={styles.textCount}>{`${value.name?.length}/32`}</div>
                            {value.errorName && value.errorName.length !== 0 && (
                              <div className={styles.textErr}>{`${value.errorName}`}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
              {activeAccount && (
                <>
                  <div className="divider"></div>
                  <div className="box-button mx-auto">
                    <ButtonNew
                      cancel
                      onClick={() => {
                        // setSelectedSafes([]);
                        setRenameSafes(false);
                      }}
                      className={styles["btnAdd"]}
                    >
                      <p>BACK</p>
                    </ButtonNew>
                    <ButtonNew primary disabled={saveDisabled} onClick={() => handleSaveSafe()} className={styles["btnAdd"]}>
                      <p>SAVE</p>
                    </ButtonNew>
                  </div>
                </>
              )}
            </div>
          )}

          {!renameSafes && (
            <CoSignerOptInSelectAccount
              safe={safe}
              setSafe={setSafe}
              onChangeComponent={handleLoadComponent}
              setSelectedAccount={setSelectedAccount}
              selectedAccount={selectedAccount}
              isOnExistingSafe={true}
            />
          )}
        </>
      )}
      {loadComponent === "details" && (
        <CoSignerOptInDetail selectedAccount={selectedAccount} safe={safe} onChangeComponent={handleLoadComponent} />
      )}
    </div>
  );
};

export default AddExistingSafe;
