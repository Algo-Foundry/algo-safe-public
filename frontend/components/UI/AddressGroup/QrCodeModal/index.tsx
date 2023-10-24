import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import QrCodeBody from "frontend/components/UI/AddressGroup/QrCodeModal/QrCodeBody";

interface Props {
  modalStatus: boolean;
  safeQrCode?: boolean;
  onHide: () => void;
  safeName?: string;
  safeAppId?: string;
  codeValue: string;
  linkAddressQR?: string;
}

const QrCodeModal: React.FC<Props> = ({
  modalStatus,
  safeQrCode,
  onHide,
  codeValue,
  linkAddressQR,
  safeName,
  safeAppId,
}: Props) => {
  return (
    <ModalGeneral title="Scan QR Code" onHide={onHide} modalStatus={modalStatus}>
      <QrCodeBody
        codeValue={codeValue}
        safeQrCode={safeQrCode}
        linkAddressQR={linkAddressQR}
        safeName={safeName}
        safeAppId={safeAppId}
        isCenterPosition
      />
    </ModalGeneral>
  );
};

export default QrCodeModal;
