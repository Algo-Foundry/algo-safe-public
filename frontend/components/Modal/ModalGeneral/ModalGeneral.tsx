import style from "./ModalGeneral.module.scss";
import Modal from "react-bootstrap/Modal";
import Alert from "frontend/components/UI/Alert";
import Button from "frontend/components/Button";
import BorderDivider from "frontend/components/UI/BorderDivider";
import Loader from "frontend/components/Icons/Loader";
import SafeService from "frontend/services/safe";
import { useState, useEffect } from "react";
import { STATUS_READY, STATUS_REJECT_READY } from "shared/constants/ptxn";
import { getPtxnData, setPtxnData } from "frontend/redux/features/ptxnExecute/ptxnExecuteSlice";
import { useAppDispatch, useAppSelector } from "frontend/redux/hooks";
import { setRefreshAssetTableKey } from "frontend/redux/features/asset/assetSlice";
import { getSigner, getSelectedSafe } from "frontend/redux/features/safe/safeSlice";

const service = new SafeService();

type backdrop = "static" | true | false;

interface Props {
  title?: string;
  removeSafe?: boolean;
  seqNumb?: number | string;
  lsig_address?: string;
  children: React.ReactNode;
  modalStatus: boolean;
  onHide?: () => void;
  isBig?: boolean;
  isNoMargin?: boolean;
  fullscreenSm?: boolean;
  noBorder?: boolean;
  noCloseBtn?: boolean;
  isPaddingTitleFixed?: boolean;
  titleChild?: JSX.Element;
  backdrop?: backdrop;
  onExecute?: () => void;
  classNameBody?: string;
  classNameModal?: string;
  classNameHeader?: string;
  isTxnPage?: boolean;
  lsigContent?: any;
}

const ModalGeneral: React.FC<Props> = ({
  modalStatus,
  title,
  removeSafe,
  seqNumb,
  lsig_address,
  onHide,
  onExecute,
  children,
  isBig,
  fullscreenSm,
  isNoMargin,
  noBorder,
  titleChild,
  classNameBody,
  classNameModal,
  classNameHeader,
  isPaddingTitleFixed,
  backdrop = true,
  noCloseBtn = false,
  isTxnPage = false,
  lsigContent,
}: Props) => {
  const selectedSafe: any = useAppSelector(getSelectedSafe);
  const dispatch = useAppDispatch();
  const ptxnDataSelected = useAppSelector(getPtxnData);
  const selectedAddress = useAppSelector(getSigner);
  const isDappPtxn = ptxnDataSelected?.dappName;
  const isBtnCanExecute = ptxnDataSelected?.canExecute;
  const isDappConnected = ptxnDataSelected?.dappConnected;
  const isInitiator = selectedAddress?.address == ptxnDataSelected?.sender;
  const isPtxnStatusRejectReady = ptxnDataSelected?.status == STATUS_REJECT_READY;
  const isPtxnStatusReady = ptxnDataSelected?.status == STATUS_READY;
  const thresholdNotMet = ptxnDataSelected?.approvers < selectedSafe?.threshold;

  const [loader, setLoader] = useState(false);
  const [isRemoveItem, setIsRemoveItem] = useState(false);

  const fetchData = async () => {
    const addr = localStorage.getItem("SelectedAccount") || "";

    setLoader(true);
    try {
      const appGS = await service.getSafeGlobalState(selectedSafe.appId);

      if (removeSafe) {
        const removeSafePtxns = await service.getDeleteSafePtxn(selectedSafe, addr, appGS);
        dispatch(setPtxnData(removeSafePtxns));
        setLoader(false);
      } else {
        const ptxns = await service.getSafePendingTransactions(selectedSafe, addr, appGS);
        ptxns?.forEach((item: any) => {
          if (seqNumb == item.seq || lsig_address == item.lsig_address) {
            dispatch(setPtxnData(item));
            setLoader(false);
          }
        });
      }
    } catch (error) {
      setLoader(false);
    }
    setLoader(false);
  };

  useEffect(() => {
    if ((modalStatus && title === "Success" && (seqNumb || lsig_address)) || (title === "Delete Safe" && removeSafe)) {
      fetchData();
    }
    if (isRemoveItem) {
      localStorage.removeItem("lsaDapp");
    }
  }, [modalStatus, title, isRemoveItem, removeSafe]);

  const handleClose = () => {
    if (!loader) {
      onHide && onHide();
      dispatch(setPtxnData({}));
      setIsRemoveItem(true);
      dispatch(setRefreshAssetTableKey(0));
    }
  };

  return (
    <>
      <Modal
        show={modalStatus}
        backdropClassName={style["modal-backdrop"]}
        dialogClassName={`${style["modal-dialog"]} ${fullscreenSm ? style["modal-dialog-full-sm"] : ""} ${
          isBig ? style.isBig : ""
        }`}
        contentClassName={`${style["modal-content"]} ${fullscreenSm ? style["modal-content-full-sm"] : ""} ${classNameModal}`}
        onHide={backdrop == "static" ? undefined : () => handleClose()}
      >
        <Modal.Header
          className={`
            ${style["modal-header"]}
            ${isPaddingTitleFixed ? style["fixed-padding"] : ""}
            ${classNameHeader}
          `}
        >
          {titleChild}
          <div>
            <span>{loader ? "Fetching Data..." : title}</span>
            {(title == "Logic Signature" || title == "Raw Transaction") && (
              <span
                onClick={() => {
                  navigator.clipboard.writeText(lsigContent);
                }}
                className={style["btn-copy"]}
              >
                copy
              </span>
            )}
          </div>
          {onHide != undefined && !loader && !noCloseBtn && (
            <button className={style["btn-close"]} onClick={handleClose}></button>
          )}
        </Modal.Header>

        {!isBig && title === "Success" && <BorderDivider />}

        {!noBorder && <BorderDivider />}

        {!loader && (
          <Modal.Body
            className={`
            ${style["modal-body"]}
            ${isNoMargin && style["no-margin"]}
            ${classNameBody}
          `}
          >
            {children}
          </Modal.Body>
        )}

        {loader && (
          <div className={`${style.wrapLoader} mt-4 mb-2`}>
            <Loader />
          </div>
        )}

        {!loader && (title === "Success" || title === "Fail") && (
          <div>
            {title === "Success" && isBtnCanExecute && (
              <>
                <BorderDivider className="mb-3 mt-3" />
                <Alert
                  message={`
                    ${!removeSafe ? `Maximum ${isPtxnStatusRejectReady ? "rejections" : "approvals"} reached.` : ""}
                    ${
                      !isDappPtxn || (isBtnCanExecute && isInitiator) || isPtxnStatusRejectReady
                        ? `The transaction can now be ${isPtxnStatusRejectReady ? "removed" : "executed"}.`
                        : ""
                    }
                  `}
                  boldMessage={
                    isDappPtxn &&
                    !isInitiator &&
                    !isPtxnStatusRejectReady &&
                    "Please inform the initiator to execute this transaction."
                  }
                  isSuccess={isBtnCanExecute && isPtxnStatusReady}
                  isDelete={isDappConnected && isPtxnStatusRejectReady}
                  isFontSizeMedium
                />
              </>
            )}
            {title === "Success" &&
            isDappPtxn &&
            !isBtnCanExecute &&
            isTxnPage &&
            !isInitiator &&
            (ptxnDataSelected?.approvers === selectedSafe?.threshold ||
              ptxnDataSelected?.rejections === selectedSafe?.threshold) ? (
              <>
                <BorderDivider className="mb-3 mt-3" />
                <Alert
                  message={`
                    ${`Maximum ${isPtxnStatusRejectReady ? "rejections" : "approvals"} reached.`}
                  `}
                  boldMessage={
                    isDappPtxn &&
                    !isInitiator &&
                    !isPtxnStatusRejectReady &&
                    "Please inform the initiator to execute this transaction."
                  }
                  isSuccess={true}
                  isDelete={false}
                  isFontSizeMedium
                />
              </>
            ) : (
              title === "Success" &&
              thresholdNotMet &&
              !isPtxnStatusRejectReady &&
              ptxnDataSelected?.approvers + ptxnDataSelected?.rejections < selectedSafe?.threshold && (
                <>
                  <BorderDivider className="mb-3 mt-3" />
                  <Alert
                    message={`Inform co-signer(s) for approval before this transaction can be executed.`}
                    isSigner
                    isFontSizeMedium
                  />
                </>
              )
            )}
            {title === "Success" && isBtnCanExecute && (isDappConnected || isPtxnStatusRejectReady || !isDappPtxn) ? (
              <div className={style["btn-wrapper"]}>
                <Button cancel onClick={handleClose} className={style["btn-cancel"]}>
                  DO IT LATER
                </Button>
                <Button onClick={() => onExecute?.()} primary danger={isPtxnStatusRejectReady} className={style["btn-confirm"]}>
                  {isPtxnStatusRejectReady ? "DELETE" : "EXECUTE"}
                </Button>
              </div>
            ) : (
              <Button onClick={handleClose} primary className={style["button-close"]}>
                CLOSE
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ModalGeneral;
