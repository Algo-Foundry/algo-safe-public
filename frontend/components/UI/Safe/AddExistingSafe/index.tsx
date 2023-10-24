import styles from "./AddExistingSafe.module.scss";
import { MouseEventHandler, useState, useEffect } from "react";
import { strTruncateMiddle } from "shared/utils";
import IconLink from "../../Icon/iconLink";
import IconCopy from "../../Icon/IconCopy";
import Loader from "frontend/components/Icons/Loader";
import SafeEmpty from "frontend/components/Icons/SafeEmpty";
import { setUserSafes, getUserSafes, getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import SafeService from "frontend/services/safe";
import { algoexplorerTransactionUrl } from "frontend/utils/string";
import WalletModal from "frontend/components/Wallet/WalletModal";
import { getSelectedAccount, setSelectedAccount } from "frontend/redux/features/account/accountSlice";
import AccountService from "frontend/services/account";
import { USER_SAFES } from "shared/constants";
import { Safe } from "shared/interfaces";

interface Props {
  onNext?: MouseEventHandler;
  onBack?: MouseEventHandler;
  onChangeSafe?: any;
  onChangeAppId?: any;
  shadow?: boolean;
}

enum Status {
  SAFE_PANEL_LOADING = 0,
  SAFE_PANEL_NO_DATA = 1,
  SAFE_PANEL_LOADED = 2,
  SAFE_PANEL_NO_WALLET = 3,
}

const AddExistingSafe: React.FC<Props> = ({ onNext, onBack, shadow, onChangeSafe, onChangeAppId }: Props) => {
  const ss = new SafeService();
  const dispatch = useAppDispatch();
  const selectedAccount = useAppSelector(getSelectedAccount);
  const ownerSafes = useAppSelector(getUserSafes);
  const currentSafe: any = useAppSelector(getSelectedSafe);
  const [adrSafe, setAdrSafe] = useState("");
  const [selectedUserSafe, setSelectedUserSafe] = useState<Safe[]>([]);
  const [safePanelStatus, setSafePanelStatus] = useState(Status.SAFE_PANEL_NO_WALLET);
  const [selectedSafe, setSelectedSafe] = useState<number>();
  const [modalWallet, setModalWallet] = useState(false);
  const [inputSafe, setInputSafe] = useState(false);

  const handleAdrSafe = (e: any) => {
    setAdrSafe(e.target.value);
  };

  const handleAppID = (e: any) => {
    setSelectedSafe(e.target.value);
  };

  useEffect(() => {
    if (adrSafe != "opt") {
      const obj = ownerSafes.find((o) => o.address === adrSafe);
      onChangeSafe(obj);
    } else {
      onChangeSafe(adrSafe);
    }
  }, [adrSafe]);

  useEffect(() => {
    onChangeAppId(Number(selectedSafe));
    if (selectedSafe != undefined) {
      if (selectedSafe.toString().length <= 0) {
        setInputSafe(true);
      } else {
        setInputSafe(false);
      }
    }
  }, [selectedSafe]);

  const syncAccount = async () => {
    const accountsData = await AccountService.getAccountInfo(selectedAccount.address);

    if (accountsData === undefined) {
      throw new Error("Unable to fetch account details");
    }

    dispatch(setSelectedAccount(accountsData));

    return accountsData;
  };

  const getSafes = async () => {
    setSafePanelStatus(Status.SAFE_PANEL_LOADING);
    const newSelectedAccount = await syncAccount();
    const userSafes = await ss.getUserSafes(newSelectedAccount.address, newSelectedAccount.appsLocalState);

    if (userSafes.length != 0) {
      setSafePanelStatus(Status.SAFE_PANEL_LOADED);
    } else {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
    }
    dispatch(setUserSafes(userSafes));
    setSelectedUserSafe(userSafes);
    localStorage.setItem(USER_SAFES, JSON.stringify(userSafes));
  };

  const getSafesFromLocalStorage = (item: any) => {
    setSafePanelStatus(Status.SAFE_PANEL_LOADING);

    if (item.length != 0) {
      setSafePanelStatus(Status.SAFE_PANEL_LOADED);
    } else {
      setSafePanelStatus(Status.SAFE_PANEL_NO_DATA);
    }
    setSelectedUserSafe(item);
    dispatch(setUserSafes(item));
  };

  useEffect(() => {
    const userSafesFromLocalStrorage = localStorage.getItem(USER_SAFES) ?? "";
    const userSafes = userSafesFromLocalStrorage && JSON.parse(userSafesFromLocalStrorage);

    if (safePanelStatus !== Status.SAFE_PANEL_LOADING && Object.keys(selectedAccount).length !== 0 && selectedAccount.address) {
      //determines get of userSafes
      if (userSafes) {
        getSafesFromLocalStorage(userSafes);
      } else {
        getSafes();
      }
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (currentSafe) {
      const safe: any = ownerSafes.find((v) => v.appId === currentSafe.appId);
      if (safe) {
        setAdrSafe(safe.address);
      }
    }
  }, [ownerSafes]);

  return (
    <>
      <WalletModal
        modalStatus={modalWallet}
        onHide={() => {
          setModalWallet(false);
        }}
      />
      <div className={`box-safe ${styles["add-load-safe"]} ${shadow ? "" : styles.noShadow}`}>
        <form className={styles.boxContent}>
          {shadow && <div className={`${styles.textContent}`}>To manage your safe, please choose one from the list below.</div>}
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
                  <div className={`${styles.adrWrap} ${styles.textHeader} ${styles.gapBig}`}>SAFE NAME</div>
                  <div className={`${styles.adrWrap} ${styles.textHeader} ${styles.mlMobile}`}>SAFE ID</div>
                  <div className={`${styles.adrWrap} ${styles.textHeader} ${styles.mlMobile}`}>SAFE ADDRESS</div>
                </div>
                {selectedUserSafe.map((value) => (
                  <div key={value.address} className={`${styles.radioWrap}`}>
                    <div className={`${styles.adrWrap} ${styles.gapBig}`}>
                      <label className="form-radio">
                        <input
                          value={value.address}
                          checked={adrSafe === value.address}
                          onChange={handleAdrSafe}
                          type="radio"
                          name="radio"
                        />
                        {value.name}
                      </label>
                      {value.status != "owner" && <div className={styles.wrapReadOnly}>read only</div>}
                    </div>
                    <div className={`${styles.adrWrap} ${styles.mlMobile}`}>
                      <div className={`${styles.textContent}`}>#{value.appId}</div>
                      <IconCopy copy={value.appId.toString()} />
                      <IconLink link={algoexplorerTransactionUrl({ id: value.appId.toString(), path: "application" })} />
                    </div>
                    <div className={`${styles.adrWrap} ${styles.mlMobile}`}>
                      <div className={`${styles.textContent}`}>{strTruncateMiddle(value.address)}</div>
                      <IconCopy copy={value.address} />
                      <IconLink link={algoexplorerTransactionUrl({ id: value.address, path: "address" })} />
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
          <div className={styles.boxInputAdr}>
            <label className="form-radio small-gap">
              <input type="radio" name="radio" value="opt" checked={adrSafe === "opt"} onChange={handleAdrSafe} />
              Load a safe from an application ID
            </label>
            <input
              type="number"
              className={`form-controls text-black ${styles.inputAdr}`}
              id="name"
              placeholder="Enter Safe Application ID"
              onChange={handleAppID}
              onClick={() => setAdrSafe("opt")}
            />
          </div>
        </form>
        <div className="divider"></div>
        <div className="box-button mx-auto">
          <button className="btn btn-white" onClick={onBack}>
            <span>Cancel</span>
          </button>
          <button
            disabled={
              safePanelStatus == Status.SAFE_PANEL_LOADING ||
              (selectedAccount && Object.keys(selectedAccount).length == 0) ||
              adrSafe.length === 0 ||
              (adrSafe === "opt" && selectedSafe == undefined) ||
              (adrSafe === "opt" && inputSafe == true)
            }
            className="btn default"
            onClick={onNext}
          >
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AddExistingSafe;
