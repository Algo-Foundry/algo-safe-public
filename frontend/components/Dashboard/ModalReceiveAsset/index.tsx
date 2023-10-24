import styles from "./ModalReceiveAsset.module.scss";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import React from "react";
import { Asset } from "shared/interfaces";
import { useAppSelector } from "frontend/redux/hooks";
import { getExplorerURL } from "shared/utils";
import QrCodeBody from "frontend/components/UI/AddressGroup/QrCodeModal/QrCodeBody";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
interface Props {
  modalStatus: boolean;
  onHide: () => void;
  onConfirm: () => void;
  assets?: Array<Asset>;
}

const ModalReceiveAsset: React.FC<Props> = ({ modalStatus, onHide }: Props) => {
  const selectedAccount: any = useAppSelector(getSelectedAccount);

  return (
    <>
      <ModalGeneral
        onHide={onHide}
        modalStatus={modalStatus}
        fullscreenSm
        isNoMargin
        noBorder
        backdrop="static"
        isPaddingTitleFixed
        classNameBody={styles["modal-body"]}
      >
        <div className={styles.containerHeight}>
          <QrCodeBody
            safeQrCode={true}
            safeName={selectedAccount?.name}
            safeAppId={selectedAccount?.appId}
            codeValue={selectedAccount?.address}
            linkAddressQR={`${getExplorerURL()}/address/${selectedAccount?.address}`}
            isCenterPosition
          />
        </div>
      </ModalGeneral>
    </>
  );
};

export default ModalReceiveAsset;
