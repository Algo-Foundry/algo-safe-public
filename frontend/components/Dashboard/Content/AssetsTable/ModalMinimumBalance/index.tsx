import styles from "./ModalMinimumBalance.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import Button from "frontend/components/Button";
import { useAppSelector } from "frontend/redux/hooks";
import { useEffect, useState } from "react";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { SidebarAccount } from "shared/interfaces";
import AccountService from "frontend/services/account";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  isLedger?: boolean;
}

const ModalMinimumBalance: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  const selectedAccount = useAppSelector<SidebarAccount | null>(getSelectedAccount);
  const [minBalance, setMinBalance] = useState(0);

  useEffect(() => {
    if (!selectedAccount) return;

    let fetchingFor = null;

    const updateMinBalance = async () => {
      const minBalance = await AccountService.getMinBalance(selectedAccount.address);
      setMinBalance(minBalance.algoMinBalance);
    };

    if (fetchingFor !== selectedAccount.address) {
      updateMinBalance();
    }

    return () => {
      fetchingFor = selectedAccount.address;
    };
  }, [JSON.stringify(selectedAccount)]);

  return (
    <div>
      <ModalGeneral
        title="Minimum Balance"
        onHide={onHide}
        modalStatus={modalStatus}
        fullscreenSm
        backdrop="static"
        isPaddingTitleFixed
      >
        <div className={styles.modal}>
          <div className={styles["modal-body"]}>
            <div className={styles["box-min-balance"]}>
              <p>Your minimum balance :</p>
              <strong>{minBalance} ALGO</strong>
            </div>
            <p className="text-center">
              Submitting transactions to the Algorand blockchain requires an account to hold a minimum balance of ALGOs. The
              minimum balance of any account starts with 0.1 ALGO, and owning any other assets / applications increases it by 0.1
              ALGO each.
            </p>
          </div>
          <div className={styles["modal-footer"]}>
            <div className="btn-input-box">
              <Button primary onClick={onHide} className="flex-grow-1 w-100">
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalMinimumBalance;
