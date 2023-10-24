import styles from "./DappsConnectedSection.module.scss";
import { useEffect, useState } from "react";
import ConnectedDappsItem from "./ConnectedDappsItem";
import Button from "frontend/components/Button";
import ModalConnectApps from "frontend/components/Dashboard/Content/Dapps/DappsConnectedSection/ModalConnectApps";
import ModalDisconnectApps from "frontend/components/Dashboard/Content/Dapps/DappsConnectedSection/ModalDisconnectApps";
import { Spinner } from "react-bootstrap";
import { useAppSelector } from "frontend/redux/hooks";
import ModalGeneral from "frontend/components/Modal/ModalGeneral/ModalGeneral";
import ModalExceedPtxn from "frontend/components/Modal/ModalExceedPtxn";
import Alert from "frontend/components/UI/Alert";
import AppConnectorV2 from "frontend/services/safe/appConnectorV2";
import { SessionTypes } from "@walletconnect/types";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { events } from "shared/constants";
import useAppConnectors from "frontend/hooks/useAppConnectors";
import { SidebarAccount } from "shared/interfaces";
import { getIsHaveUrgentPtxn } from "frontend/redux/features/safe/safeSlice";
import { AppConnector } from "frontend/services/safe/appConnector";

interface Props {
  isLedger?: boolean;
}

const iconFail = "/images/safe/icon-error.svg";

export default function DappsConnectedSection({ isLedger }: Props) {
  const [modalShow, setModalShow] = useState(false);
  const [v1ModalShow, setV1ModalShow] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalExceedPtxn, setModalExceedPtxn] = useState(false);

  // disconnect all modal
  const [dcModalShow, setDcModalShow] = useState(false);

  // get selected sidebar account
  const selectedAccount = useAppSelector<SidebarAccount | null>(getSelectedAccount);

  // wallet connect v2
  const { initConnectorForAccount } = useAppConnectors();
  const [appConnector, setAppConnector] = useState<AppConnectorV2 | null>(null);

  // connected Dapps
  const [connectedDapps, setConnectedDapps] = useState<SessionTypes.Struct[]>([]);
  const [connectedV1Dapps, setConnectedV1Dapps] = useState<AppConnector[]>([]);

  // For the input of wallet connect url
  const [wcApp, setWcApp] = useState("");

  // Loading state for btns
  const [disabledBtn, setDisabledBtn] = useState(false);
  const [disabledDcAllBtn, setDisabledDcAllBtn] = useState(false);

  const isHaveUrgentPtxn: boolean = useAppSelector(getIsHaveUrgentPtxn);

  const [peerMeta, setPeerMeta] = useState({
    description: "",
    icons: [""],
    name: "",
    url: "",
  });

  useEffect(() => {
    let isRunning = false;

    const init = async () => {
      if (isRunning || !selectedAccount) return;

      const connector = await initConnectorForAccount(selectedAccount);
      setAppConnector(connector);
      const connDapps = connector.getConnectedDapps();
      const connV1Dapps = connector.getConnectedV1Dapps();
      setConnectedDapps(connDapps);
      setConnectedV1Dapps(connV1Dapps);
    };

    init();

    return () => {
      isRunning = true;
    };
  }, [selectedAccount?.address]);

  useEffect(() => {
    window.addEventListener(events.MAX_PTXN, () => {
      setModalExceedPtxn(true);
    });

    window.addEventListener(events.DISCONNECT, () => {
      // update list of dapps on display
      if (appConnector) {
        const connDapps = appConnector.getConnectedDapps();
        setConnectedDapps(connDapps);
      }
    });

    window.addEventListener(events.DISCONNECT_V1, () => {
      // update list of v1 dapps on display
      if (appConnector) {
        // update connected v1 dapps
        appConnector.setConnectedV1Dapps();
        const connDappsV1 = appConnector.getConnectedV1Dapps();
        setConnectedV1Dapps(connDappsV1);
      }
    });

    window.addEventListener(events.NEW_SESSION, async () => {
      if (!appConnector) return;
      // Display the session proposer details
      const proposal = appConnector.proposal;
      if (proposal !== undefined) {
        setPeerMeta(proposal.params.proposer.metadata);
        setModalShow(true);
      }
    });

    window.addEventListener(events.NEW_SESSION_V1, async () => {
      if (!appConnector) return;
      // Display the session payload details
      const payload = appConnector.v1Connector.payload;
      if (payload !== undefined) {
        setPeerMeta(payload.params[0].peerMeta);
        setV1ModalShow(true);
      }
    });
  }, [appConnector]);

  // User is trying to disconnect the connected DApp
  const onDisconnect = async (idx: number) => {
    if (!appConnector) return;

    const dappToDisconnect = connectedDapps[idx];
    await appConnector.disconnect(dappToDisconnect.topic);

    // update frontend
    const remainingDapps = connectedDapps.filter((dapp) => dapp.topic !== dappToDisconnect.topic);
    setConnectedDapps(remainingDapps);
  };

  // User is trying to disconnect the connected DApp
  const onV1Disconnect = async (idx: number) => {
    if (!appConnector) return;

    const v1DappToDisconnect = connectedV1Dapps[idx];
    await v1DappToDisconnect.kill();

    // update connected v1 dapps
    appConnector.setConnectedV1Dapps();

    // update frontend
    const remainingDapps = connectedV1Dapps.filter((dapp) => dapp.uid !== v1DappToDisconnect.uid);
    setConnectedV1Dapps(remainingDapps);
  };

  const onWcAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // copy input value as is
    const val = e.target.value;
    setWcApp(val);
  };

  // Reject the connection
  const rejectWcConnect = async () => {
    if (!appConnector) return;

    await appConnector.rejectSession();
    setModalShow(false);
  };

  // Reject the v1 connection
  const rejectV1WcConnect = async () => {
    if (!appConnector) return;

    appConnector.v1Connector.reject();
    setV1ModalShow(false);
  };

  // Approve the connection
  const confirmWcConnect = async () => {
    if (!appConnector) return;

    await appConnector.approveSession();
    const connDapps = appConnector.getConnectedDapps();
    setConnectedDapps(connDapps);
    setModalShow(false);

    // clear the input
    setWcApp("");
  };

  // Approve the v1 connection
  const confirmV1WcConnect = async () => {
    if (!appConnector) return;
    appConnector.approve();
    const connDapps = appConnector.getConnectedV1Dapps();
    setConnectedV1Dapps(connDapps);
    setV1ModalShow(false);

    // clear the input
    setWcApp("");
  };

  const onWcConnect = async () => {
    setDisabledBtn(true);

    try {
      if (appConnector) {
        await appConnector.connect(wcApp);
      }
    } catch (e: any) {
      setModalError(e.message);
    }
    setWcApp("");
    setDisabledBtn(false);
  };

  const onWcDisconnectAll = async () => {
    setDisabledDcAllBtn(true);

    try {
      await appConnector?.disconnectAll();
      setDcModalShow(false);
    } catch (e: any) {
      console.log(e);
      await appConnector?.reset();
    } finally {
      // update frontend
      setConnectedDapps([]);
    }

    setDisabledDcAllBtn(false);
  };

  return (
    <div className="pb-lg-3 w-100">
      <ModalExceedPtxn
        modalStatus={modalExceedPtxn}
        onHide={() => {
          setModalExceedPtxn(false);
        }}
      />

      <div className={styles.boxDapss}>
        {/* {isNoReadOnly && 
        <> */}
        {/* <div className="d-block d-lg-none">
          <BoxPhilTitle title={"CONNECT TO DAPPSzzz"}></BoxPhilTitle>
        </div> */}
        <div className={styles["connect-to-app-container"]}>
          <div className={styles.titleBox}>Connect to Dapps</div>
          <div className={styles.title}>Paste Your WalletConnect URL</div>

          <div className="mt-2 d-flex flex-column flex-lg-row gap-2">
            <input
              id="wallet-connect-url"
              type="text"
              value={wcApp}
              onChange={onWcAppChange}
              className={styles.inputWc + " form-controls text-black"}
              placeholder="Enter Wallet Connect URL"
            />
            <Button primary className={styles.BtnConnect} onClick={onWcConnect} disabled={disabledBtn || isHaveUrgentPtxn}>
              {disabledBtn ? (
                <Spinner animation="border" role="status" size="sm">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              ) : (
                "CONNECT"
              )}
            </Button>
          </div>
        </div>
        {/* </>
        } */}
        <ModalConnectApps modalStatus={modalShow} onHide={rejectWcConnect} onConfirm={confirmWcConnect} app={peerMeta} />
        <ModalConnectApps modalStatus={v1ModalShow} onHide={rejectV1WcConnect} onConfirm={confirmV1WcConnect} app={peerMeta} />
        <ModalDisconnectApps
          modalStatus={dcModalShow}
          onHide={() => setDcModalShow(false)}
          onConfirm={onWcDisconnectAll}
          disabledDcAllBtn={disabledDcAllBtn}
        />
        <ModalGeneral
          title="Failed"
          modalStatus={modalError != ""}
          onHide={() => {
            setModalError("");
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img src={iconFail} className={styles.iconModal} alt="" />
            <p className={styles.textModal}>Error: {modalError}</p>
          </div>
        </ModalGeneral>
      </div>

      {(connectedDapps.length > 0 || connectedV1Dapps.length > 0) && (
        <div className={`${styles["connected-dapp"]} ${styles.boxDapss} ${styles.borderFull}`}>
          <div className={`${styles.titleBox} d-flex justify-content-between align-items-center mb-4`}>
            <div className={`d-flex flex-column gap-2`}>
              <div className={styles.connectedTextWrapper}>
                <span>Connected Dapps</span>
                <span className={styles.btnDisconnectAll} onClick={() => setDcModalShow(true)}>
                  Disconnect All
                </span>
              </div>
              <div className={styles.title}>
                {isLedger
                  ? "Your Ledger account is connected to these Dapps via WalletConnect."
                  : "This Safe is connected to these sites. These sites are able to see your address and initiate transaction approval to your Safe."}
              </div>
            </div>
            <div className={styles.btnDisconnectShow}>
              <Button primary className={styles.BtnConnect} onClick={() => setDcModalShow(true)}>
                DISCONNECT ALL
              </Button>
            </div>
          </div>
          <Alert
            message={"Do not disconnect or close this browser unless you have completed all Dapp transactions/actions."}
            isWarning
            isFontSizeMedium
          />
          <div className="container-fluid px-0 mt-4">
            <div className={`mx-0 ${styles["connected-dapps-row"]}`}>
              {connectedDapps.map((item, i) => {
                return (
                  <ConnectedDappsItem
                    item={{
                      name: item.peer.metadata.name,
                      link: item.peer.metadata.url,
                      icon: item.peer.metadata.icons[0],
                    }}
                    key={"item-" + i}
                    idx={i}
                    onDisconnect={onDisconnect}
                  ></ConnectedDappsItem>
                );
              })}
              {connectedV1Dapps.map((item, i) => {
                return (
                  <ConnectedDappsItem
                    item={{
                      name: item.session.peerMeta.name,
                      link: item.session.peerMeta.url,
                      icon: item.session.peerMeta.icons[0],
                    }}
                    key={"item-" + i}
                    idx={i}
                    onDisconnect={onV1Disconnect}
                  ></ConnectedDappsItem>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
