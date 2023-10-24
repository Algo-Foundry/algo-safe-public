import styles from "./SafeName.module.scss";
import { useState, useEffect } from "react";
import { getNewSafeData, setAlertNameValidation } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector, useAppDispatch } from "frontend/redux/hooks";
import Alert from "../../Alert";
import { useWallet } from "@txnlab/use-wallet";

interface Props {
  onChange?: any;
}

const SafeName: React.FC<Props> = ({ onChange }: Props) => {
  const { activeAddress } = useWallet();
  const newSafeData = useAppSelector(getNewSafeData);
  const [nameSafe, setNameSafe] = useState("");
  const [isAlertValidationShow, setAlertValidationShow] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    const creator = newSafeData?.owners[0];
    if ((activeAddress && activeAddress !== creator?.addr) || activeAddress === undefined) {
      setNameSafe("");
    } else {
      setNameSafe(newSafeData.name);
    }
  }, [activeAddress]);

  useEffect(() => {
    dispatch(setAlertNameValidation(isAlertValidationShow));
  }, [isAlertValidationShow]);

  const clearErrorMsg = () => {
    setAlertValidationShow(false);
    setAlertMsg("");
  };
  const setErrorMsg = (val: string) => {
    const valid = /^[A-Za-z/\s.'0-9_-]+$/.test(val);
    if (!valid && val.length < 4) {
      setAlertValidationShow(true);
      setAlertMsg(
        "Only alphanumeric characters, underscores or dashes are allowed. Safe name should be between 4 to 15 characters long."
      );
    } else if (!valid) {
      setAlertValidationShow(true);
      setAlertMsg("Only alphanumeric characters, underscores or dashes are allowed.");
    } else if (val.length < 4) {
      setAlertValidationShow(true);
      setAlertMsg("Safe name should be between 4 to 15 characters long.");
    } else {
      clearErrorMsg();
    }
  };

  function handleChange(e: any) {
    setNameSafe(e.target.value);
    // special character validation for safe name
    setErrorMsg(e.target.value);
  }

  useEffect(() => {
    onChange(nameSafe);
  }, [nameSafe]);

  useEffect(() => {
    if (newSafeData.name.length != 0) {
      setErrorMsg(newSafeData.name);
    }
  }, []);
  return (
    <div className={`box-safe ${styles["safe-name"]}`}>
      <div className={styles.boxContent}>
        <div className={`box-input ${styles.inputSafe}`}>
          <label htmlFor="safeName">Name of the Safe</label>
          <input
            type="text"
            className="form-controls"
            id="safe-name"
            placeholder="Enter Safe Name"
            maxLength={15}
            onChange={handleChange}
            value={nameSafe}
          />
          <div className={styles.textCount}>{`${nameSafe?.length}/15`}</div>
        </div>
        {isAlertValidationShow && <Alert message={alertMsg} />}
      </div>
    </div>
  );
};

export default SafeName;
