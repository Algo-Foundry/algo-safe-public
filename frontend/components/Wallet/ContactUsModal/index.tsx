import styles from "./ContactUsModal.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import { useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import axios from "axios";
import AppConfig from "config/appConfig";
import { toast } from "react-toastify";
import { verifyAlgorandAddress } from "shared/utils";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
}

const ContactUsModal: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(true);
  const [address, setAddress] = useState("");
  const [addressValid, setAddressValid] = useState(true);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("");
  const [dropdown, setDropdown] = useState(false);
  const [agree, setAgree] = useState(false);
  const [process, setProcess] = useState(false);

  const listType = ["Multi-sig Safe", "Ledger", "Others"];

  const handleChange = (e: any) => {
    const { checked } = e.target;
    setAgree(checked);
  };

  const submit = async () => {
    setProcess(true);
    try {
      const formData = {
        name: name,
        email: email,
        address: address,
        description: desc,
        type: type,
        agree: agree,
      };

      await axios.post(`${AppConfig.appURL}/api/contact-us`, formData);

      setName("");
      setEmail("");
      setAddress("");
      setDesc("");
      setType("");
      setAgree(false);
      setProcess(false);
      toast("Submitted", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        type: "info",
        toastId: 1,
      });
    } catch (error) {
      setProcess(false);
      toast("Fail to submit", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        type: "warning",
        toastId: 2,
      });
      console.log("err", error);
    }
  };

  function ModalTitle() {
    return (
      <div className={styles.titleModal}>
        <div>Contact Us</div>
      </div>
    );
  }

  const handleEmail = (email: string) => {
    setEmail(email);
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (emailRegex.test(email)) {
      setEmailValid(true);
    } else {
      setEmailValid(false);
    }
  };

  const handleAddress = (adr: string) => {
    setAddress(adr);
    const validAdr = verifyAlgorandAddress(adr);

    if (validAdr) {
      setAddressValid(true);
    } else {
      setAddressValid(false);
    }
  };

  useEffect(() => {
    if (address.length === 0) setAddressValid(true);
  }, [address]);

  return (
    <ModalGeneral
      titleChild={<ModalTitle />}
      onHide={process ? undefined : onHide}
      modalStatus={modalStatus}
      fullscreenSm
      backdrop="static"
      classNameModal={styles.modalContainer}
      classNameBody={styles.noOverflow}
      classNameHeader={styles.pHeader}
    >
      <div className={styles.modal}>
        <div className={styles.wrapInput}>
          <div className={`box-input ${styles.inputContact} ${styles.smallBox}`}>
            <label htmlFor="name">
              Name <span>*</span>
            </label>
            <input
              type="text"
              className="form-controls"
              id="name"
              placeholder="Enter Safe Name"
              onChange={(e) => {
                setName(e.target.value);
              }}
              value={name}
            />
          </div>
          <div className={`box-input ${styles.inputContact} ${styles.wFlex}`}>
            <label htmlFor="email">
              Email <span>*</span>
            </label>
            <input
              type="email"
              className="form-controls"
              id="name"
              placeholder="Enter Safe Name"
              onChange={(e) => {
                handleEmail(e.target.value);
              }}
              value={email}
            />
            {!emailValid && <span className={styles.textFail}>Invalid email address</span>}
          </div>
        </div>
        <div className={styles.wrapInput}>
          <div className={`box-input ${styles.inputContact}`}>
            <label htmlFor="name">
              Type <span>*</span>
            </label>
            <div className={`${styles.boxDropdown}`}>
              <div className={`${styles.btnDropdown}`} role="button" onClick={() => setDropdown(!dropdown)}>
                <span className={`${type !== "" && styles.darker}`}>{type === "" ? "Select the type of subject" : type}</span>
                <div className={`${styles.boxArrow} ${dropdown && styles.activeDr}`}>
                  <ArrowDown />
                </div>
              </div>
              <Collapse in={dropdown}>
                <div className={styles.dropdownMedia} onClick={() => setDropdown(false)}>
                  {listType.map((list, index) => (
                    <div
                      key={index}
                      role="button"
                      className={`${styles.wrapTextBtn} ${type === list && styles.active}`}
                      onClick={() => {
                        setType(list);
                      }}
                    >
                      {list}
                    </div>
                  ))}
                </div>
              </Collapse>
            </div>
          </div>
        </div>
        <div className={styles.wrapInput}>
          <div className={`box-input ${styles.inputContact}`}>
            <label htmlFor="name">Algorand Account Address</label>
            <input
              type="text"
              className="form-controls"
              id="name"
              placeholder="Enter Safe Name"
              onChange={(e) => {
                handleAddress(e.target.value);
              }}
              value={address}
            />
            {!addressValid && <span className={styles.textFail}>Invalid algo address</span>}
          </div>
        </div>
        <div className={styles.wrapInput}>
          <div className={`box-input ${styles.inputContact}`}>
            <label htmlFor="name">
              Description of the issue <span>*</span>
            </label>
            <textarea
              className="form-controls"
              id="name"
              placeholder="Enter Safe Name"
              onChange={(e) => {
                setDesc(e.target.value);
              }}
              value={desc}
              rows={3}
            />
          </div>
        </div>
        <div className={styles.formCheck}>
          <input
            type="checkbox"
            role="button"
            checked={agree}
            onChange={(e) => handleChange(e)}
            className={styles.checkboxInput}
          />
          <label>Share browser and OS versions for better issue resolution</label>
        </div>

        <div className={styles["modal-footer"]}>
          <Button
            primary
            onClick={submit}
            className={`${styles.btnSave}`}
            disabled={name === "" || email === "" || desc === "" || type === "" || process || !emailValid || !addressValid}
          >
            {process ? "LOADING.." : "SUBMIT"}
          </Button>
        </div>
      </div>
    </ModalGeneral>
  );
};

export default ContactUsModal;
