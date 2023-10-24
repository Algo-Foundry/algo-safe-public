import styles from "./ModalNft.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import DetailsNft from "frontend/components/Dashboard/Content/AssetsTable/DetailsNft";
import CloseX from "frontend/components/Icons/Close";
import { useState, useEffect } from "react";

interface DataModal {
  id: number;
  name: string;
  total: number;
  unitName: string;
  balance: number;
  creator: string;
  standard: string;
  description: string;
  properties: object;
  contentUrl: string;
}

interface Props {
  dataNft: DataModal;
  isHideButton?: boolean;
  onReceive?: () => void;
  modalStatus: boolean;
  onHide: () => void;
  onRemove?: () => void;
  onSend?: () => void;
}

const ModalNft: React.FC<Props> = ({ dataNft, isHideButton, modalStatus, onReceive, onHide, onRemove, onSend }: Props) => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowResize);

    handleWindowResize();

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [windowWidth]);

  useEffect(() => {
    if (windowWidth < 768) {
      if (modalStatus) {
        document.body.style.overflowY = "hidden";
      } else {
        document.body.style.overflowY = "unset";
      }
    }
  }, [modalStatus]);

  return (
    <>
      {windowWidth >= 768 ? (
        <ModalGeneral title={dataNft?.name ? dataNft?.name : "-"} modalStatus={modalStatus} isBig noBorder onHide={onHide}>
          <DetailsNft dataNft={dataNft} onReceive={onReceive} isHideButton={isHideButton} onRemove={onRemove} onSend={onSend} />
        </ModalGeneral>
      ) : (
        <div
          className={`
            ${styles.detailsNftMobile}
            ${modalStatus ? styles.inUp : ""}
          `}
        >
          <div className={styles.headerMobileNft}>
            <div className={styles.textHeader}>{dataNft?.name ? dataNft?.name : "-"}</div>
            <div
              className={styles.closeNftDetail}
              role="button"
              onClick={() => {
                onHide();
              }}
            >
              <CloseX />
            </div>
          </div>
          <div className={styles.contentDetailMobile}>
            <DetailsNft dataNft={dataNft} onReceive={onReceive} isHideButton={isHideButton} onRemove={onRemove} onSend={onSend} />
          </div>
        </div>
      )}
    </>
  );
};

export default ModalNft;
