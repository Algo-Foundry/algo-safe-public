import styles from "./ModalLogicSignature.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import SafeService from "frontend/services/safe";
import { useEffect, useState } from "react";

const service = new SafeService();

interface Props {
  modalStatus: boolean;
  isRawTxn?: boolean;
  lsigValue: string;
  title: string;
  onHide: () => void;
}

const ModalLogicSignature: React.FC<Props> = ({ modalStatus, title, isRawTxn, lsigValue, onHide }: Props) => {
  const [lsigData, setLsigData] = useState(null);
  const fetchLSIG = async (value: string) => {
    const convertText = await service.decodeProgram(value);
    setLsigData(convertText.data);
  };

  useEffect(() => {
    if (modalStatus) {
      fetchLSIG(lsigValue);
    }
  }, [modalStatus, lsigValue]);

  return (
    <ModalGeneral title={title} onHide={onHide} modalStatus={modalStatus} lsigContent={isRawTxn ? lsigValue : lsigData}>
      <div className={styles.modal}>{isRawTxn ? lsigValue : lsigData}</div>
    </ModalGeneral>
  );
};

export default ModalLogicSignature;
