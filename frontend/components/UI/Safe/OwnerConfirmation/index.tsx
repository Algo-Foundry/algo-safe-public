import styles from "./OwnerConfirmation.module.scss";
import { MouseEventHandler, useState, useEffect } from "react";
import { getNewSafeData } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import { verifyAlgorandAddress } from "shared/utils";
import SafeService from "frontend/services/safe";
import { useWallet } from "@txnlab/use-wallet";
import Info from "frontend/components/Icons/Info";
import AutoSuggestAddress from "./AutoSuggestAddress";
import { setShowWalletDialog } from "frontend/redux/features/wallet/walletSlice";
import { errors } from "shared/constants";
import { Collapse } from "react-bootstrap";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import Done from "frontend/components/Icons/Done";

interface Props {
  onNext: () => void;
  onBack?: MouseEventHandler;
  onChangeOwner?: any;
  onChangeTd?: any;
  disableConfirm: any;
}

const OwnerConfirmation: React.FC<Props> = ({ onNext, onBack, onChangeOwner, onChangeTd, disableConfirm }: Props) => {
  const ss = new SafeService();
  const { isReady, activeAccount, activeAddress } = useWallet();
  const dispatch = useAppDispatch();
  const newSafeData = useAppSelector(getNewSafeData);
  const [ownerSafe, setOwnerSafe] = useState<any[]>(JSON.parse(JSON.stringify(newSafeData.owners)));
  const [threshold, setThreshold] = useState(newSafeData.threshold);
  const [totalSigner, setTotalSigner] = useState(newSafeData.owners.length);
  const [signDropdown, setSignDropdown] = useState(false);
  const [totalSignDropdown, setTotalSignDropdown] = useState(false);
  let verifySignerDelay: any;

  const restoreOwner = [
    {
      name: "Master 1",
      addr: activeAddress || "",
      nfDomain: "",
      isValid: 1,
    },
    {
      name: "",
      addr: "",
      nfDomain: "",
      isValid: 0,
    },
  ];

  const verifySignerName = (e: string, index: number) => {
    let accountToCheck = { ...ownerSafe[index], name: e };
    // check co-signer name
    const checkSP = /^[A-Za-z/\s.'0-9_-]+$/.test(accountToCheck.name);
    if (accountToCheck.name && !checkSP) {
      accountToCheck.errorName = errors.ERR_SAFE_SIGNERS_SPEC_CHAR;
      accountToCheck.isValid = 2;
    }
    if (accountToCheck.name.length < 4) {
      accountToCheck.errorName = errors.ERR_SAFE_SIGNERS_TOO_SHORT;
      accountToCheck.isValid = 2;
    }
    if (checkSP && accountToCheck.name.length >= 4) {
      // eslint-disable-next-line
      const { errorName, ...updatedObj } = accountToCheck;
      accountToCheck = updatedObj;
      accountToCheck.isValid = 1;
    }
    return accountToCheck;
  };

  const verifySigner = async (e: string, index: number) => {
    const inputNameElement = document.getElementById(`name_${index}`) as HTMLInputElement;
    if (!inputNameElement) return;
    const inputName = (document.getElementById(`name_${index}`) as HTMLInputElement).value;
    let accountToCheck = { ...ownerSafe[index], addr: e, name: inputName };
    if (e.slice(-5) === ".algo") {
      const nfdAddress = await ss.nfdToAddress(e);
      if (!nfdAddress) {
        accountToCheck.isValid = 2;
        accountToCheck.errorAddress = errors.ERR_SAFE_SIGNERS_INVALID;
        return accountToCheck;
      }
      // eslint-disable-next-line
      const { errorAddress, ...updatedObj } = accountToCheck;
      accountToCheck = updatedObj;
      accountToCheck.nfDomain = nfdAddress.name;
      accountToCheck.addr = nfdAddress.owner;
      accountToCheck.isValid = nfdAddress.owner !== undefined ? 1 : 2;
    } else {
      const validAddress = verifyAlgorandAddress(e);

      const getNfd = await ss.getNfdDomainName(e);
      const nfd = getNfd === null ? "" : getNfd.name;
      accountToCheck.nfDomain = nfd;

      accountToCheck.isValid = 1;
      if (!validAddress) {
        accountToCheck.isValid = 2;
        accountToCheck.errorAddress = errors.ERR_SAFE_SIGNERS_INVALID;
      } else {
        // eslint-disable-next-line
        const { errorAddress, ...updatedObj } = accountToCheck;
        accountToCheck = updatedObj;
      }
    }

    return accountToCheck;
  };

  const verifyAllSigners = async () => {
    if (!activeAccount) return;
    const seenAddresses = new Set();
    let hasErrors = false;
    const newOwnerSafe = await Promise.all(
      ownerSafe.map(async (selected, index) => {
        // check form inputs based on number of signers entered
        const inputName = (document.getElementById(`name_${index}`) as HTMLInputElement).value;
        const inputAddr = (document.getElementById(`address_${index}`) as HTMLInputElement).value;
        const checkedAccount = await verifySigner(inputAddr, index);
        checkedAccount.name = inputName;

        // do unique check for address
        if (checkedAccount.isValid === 1) {
          if (inputAddr && seenAddresses.has(inputAddr)) {
            checkedAccount.isValid = 2;
            checkedAccount.errorAddress = errors.ERR_SAFE_SIGNERS_NOT_UNIQUE;
            hasErrors = true;
          } else {
            seenAddresses.add(inputAddr);
          }
        } else {
          hasErrors = true;
        }

        hasErrors = checkedAccount.isValid === 2;

        return checkedAccount;
      })
    );

    const checkInvalid = newOwnerSafe.find((v: any) => v.isValid === 2);

    setOwnerSafe(newOwnerSafe);
    if (!hasErrors && !checkInvalid) {
      onChangeOwner(newOwnerSafe);
      onNext();
    }
  };

  const handleAddressChange = async (e: string, index: number) => {
    clearTimeout(verifySignerDelay);
    verifySignerDelay = setTimeout(async () => {
      const account = await verifySigner(e, index);
      const updatedSafeOwners = [...ownerSafe];
      updatedSafeOwners[index] = account;
      setOwnerSafe(updatedSafeOwners);
    }, 1000);
  };

  const handleSignerNameChange = async (e: string, index: number) => {
    const account = await verifySignerName(e, index);
    const updatedSafeOwners = [...ownerSafe];
    updatedSafeOwners[index] = account;
    setOwnerSafe(updatedSafeOwners);
  };

  const addNewSigners = (total: number) => {
    const newData = {
      name: "",
      addr: "",
      nfDomain: "",
      isValid: 0,
    };

    if (ownerSafe.length > total) {
      setOwnerSafe(ownerSafe.slice(0, (ownerSafe.length - total) * -1));
    } else {
      for (let i = ownerSafe.length + 1; i <= total; i++) {
        setOwnerSafe((ownerSafe) => [...ownerSafe, newData]);
      }
    }
  };

  const handleChangeThreshold = (e: any) => {
    setThreshold(e);
    onChangeTd(e);
  };

  const handleChangeTotalSigners = (e: any) => {
    setTotalSigner(e);
    addNewSigners(Number(e));

    // reset threshold if selected signer exceeds threshold
    if (threshold > e) {
      setThreshold(1);
      onChangeTd(1);
    }
  };

  useEffect(() => {
    onChangeOwner(ownerSafe);
  }, [ownerSafe]);

  useEffect(() => {
    if (isReady && activeAccount?.address) {
      let newArr = [...ownerSafe];
      if (activeAccount.address !== ownerSafe[0]["addr"]) {
        // reset back to 2 owners
        newArr = [...restoreOwner];
        setTotalSigner(2);
      }

      newArr[0] = {
        name: ownerSafe[0].name,
        addr: activeAccount.address,
        nfDomain: "nfd" in activeAccount ? activeAccount["nfd"] : "",
        isValid: 1,
      };
      setOwnerSafe(newArr);
    }
  }, [activeAccount]);

  return (
    <div className={`${styles["confirmation-container"]}`}>
      <div className={`box-safe ${styles["owner-confirmation"]} align-items-stretch`}>
        <div className={`d-flex flex-column flex-md-row align-items-center gap-2 justify-content-between `}>
          <div className={`${styles.textContent} ${styles.bold} ${styles.wrapSelect}`}>
            <span>Total Number of Co-Signers</span>
            {/* <Form.Select value={totalSigner} onChange={handleChangeTotalSigners}>
              {(() => {
                const options = [];
                for (let i = 2; i <= 10; i++) {
                  options.push(
                    <option key={i} value={i}>
                      {i}
                    </option>
                  );
                }
                return options;
              })()}
            </Form.Select> */}
            <div className="d-flex flex-column position-relative">
              <button className={`${styles.btnDropDown}`} onClick={() => setTotalSignDropdown(!totalSignDropdown)}>
                <span>{totalSigner}</span>
                <ArrowDown />
              </button>
              <Collapse in={totalSignDropdown}>
                <div className={styles.dropdownSort}>
                  {(() => {
                    const options = [];
                    for (let i = 2; i <= 10; i++) {
                      options.push(
                        <div
                          className={`
                            ${styles.wrapTextBtn}
                            ${i === totalSigner ? styles.select : ""}
                            `}
                          key={"address" + i}
                          onClick={() => {
                            handleChangeTotalSigners(i);
                            setTotalSignDropdown(!totalSignDropdown);
                          }}
                        >
                          <span>{i}</span>
                          {i === totalSigner && <Done />}
                        </div>
                      );
                    }
                    return options;
                  })()}
                </div>
              </Collapse>
            </div>
          </div>
          <div className={`${styles.textContent} ${styles.bold} ${styles.wrapSelect}`}>
            <span>Required Number of Signatures</span>
            {/* <Form.Select value={threshold} onChange={handleChangeThreshold}>
              {ownerSafe.map((value, index) => (
                <option key={index} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </Form.Select> */}
            <div className="d-flex flex-column position-relative">
              <button className={`${styles.btnDropDown}`} onClick={() => setSignDropdown(!signDropdown)}>
                <span>{threshold}</span>
                <ArrowDown />
              </button>
              <Collapse in={signDropdown}>
                <div className={styles.dropdownSort}>
                  {ownerSafe.map((item: any, i: any) => {
                    return (
                      <div
                        className={`
                          ${styles.wrapTextBtn}
                          ${i + 1 === threshold ? styles.select : ""}
                          `}
                        key={"address" + i}
                        onClick={() => {
                          handleChangeThreshold(i + 1);
                          setSignDropdown(!signDropdown);
                        }}
                      >
                        <span>{i + 1}</span>
                        {i + 1 === threshold && <Done />}
                      </div>
                    );
                  })}
                </div>
              </Collapse>
            </div>
          </div>
        </div>
      </div>
      <div className={`box-safe ${styles["owner-confirmation"]}`}>
        <div className={styles.boxContent}>
          <div className={styles.textContent}>
            <b>Signers</b>
          </div>
          <div className="divider"></div>
          {ownerSafe.map((value, index) => (
            <div key={index} className={styles.inputWrap}>
              <div className={`d-flex flex-column gap-1`}>
                <div className={`box-input ${styles.name}`}>
                  <label htmlFor="name">Signer Name {index == 0 && "(Creator)"}</label>
                  <input
                    type="text"
                    className={`form-controls ${value.errorName ? "text-red" : "text-black"}`}
                    id={`name_${index}`}
                    placeholder="Enter Signer Name"
                    onChange={(evt) => handleSignerNameChange(evt.target.value, index)}
                    // value={value.name}
                    defaultValue={value.name}
                    maxLength={20}
                    minLength={4}
                    autoComplete="off"
                  />
                  <div className={styles.textCount}>{`${value.name?.length}/20`}</div>
                </div>
                {value.errorName && <div className={`${styles.errorName}`}>{value.errorName}</div>}
              </div>
              <div className={`d-flex flex-column gap-1`}>
                <div className={`box-input ${styles.address} flex-column gap-1`}>
                  <div className="box-input w-100 position-relative">
                    <label htmlFor="safeName">
                      Signer Address
                      {index == 0 && (
                        <div className={`${styles.infoBox}`}>
                          <div className="position-relative">
                            <Info />
                            <span>Creator’s address must be one of the connected account</span>
                          </div>
                        </div>
                      )}
                    </label>
                    {!activeAccount && index == 0 ? (
                      <button className={`btn default ${styles.btnConnect}`} onClick={() => dispatch(setShowWalletDialog(true))}>
                        CONNECT WALLET
                      </button>
                    ) : (
                      <AutoSuggestAddress data={value} index={index} onChange={handleAddressChange} />
                    )}
                  </div>
                  {value.errorAddress && <div className={`${styles.errorName}`}>{value.errorAddress}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="divider"></div>
        <div className="box-button mx-auto">
          <button className="btn btn-white" onClick={onBack}>
            <span>Cancel</span>
          </button>
          <button
            disabled={disableConfirm}
            className="btn default"
            onClick={async () => {
              await verifyAllSigners();
            }}
          >
            <span>Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerConfirmation;
