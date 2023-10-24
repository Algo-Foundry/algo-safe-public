import style from "./ModalWalletStatus.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";

interface Props {
  modalStatus: boolean;
  type: string;
  message: string;
  onHide: () => void;
}

const ModalWalletStatus: React.FC<Props> = ({ modalStatus, type, message, onHide }: Props) => {
  const typeModal = () => {
    let title = "";
    let imgLink = "";

    switch (type) {
      case "fail":
        title = "Error";
        imgLink = "/images/icon-disconnected.svg";
        break;
      case "info":
        title = "Info";
        imgLink = "/images/icon-warning-orange.svg";
        break;
      case "disconnected":
        title = "Wallet disconnected";
        imgLink = "/images/icon-disconnected.svg";
        break;
      default:
        break;
    }

    return {
      title: title,
      img: imgLink,
    };
  };

  return (
    <div>
      <ModalGeneral onHide={onHide} title={typeModal().title} modalStatus={modalStatus}>
        <div className={style.walletDisconect}>
          <img src={typeModal().img} className={style.iconModal} alt="" />
          <span>{message}</span>
        </div>
      </ModalGeneral>
    </div>
  );
};

export default ModalWalletStatus;
