import style from "./ConnectWalletModal.module.scss";
import Image from "next/image";
import AddOutline from "frontend/components/Icons/AddOutline";
import { useWallet } from "@txnlab/use-wallet";
import WalletDropdown from "frontend/components/Wallet/WalletModal/WalletDropdown";
import { strTruncateMiddle } from "shared/utils";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import { getExplorerURL } from "shared/utils";
import { useEffect, useState } from "react";
import AccountService from "frontend/services/account";
import { microalgosToAlgos } from "algosdk";
import SafeService from "frontend/services/safe";
import { AccountWithNFD } from "shared/interfaces";

interface Props {
  modalStatus: boolean;
  onHide: () => void;
  logOut?: () => void;
  onSetActiveAccount?: (accWithNFD: AccountWithNFD | null) => void;
}

type AccWithBalance = {
  address: string;
  amount: number | bigint;
  minBalance: number | bigint;
};

const ss = new SafeService();

const WalletModal: React.FC<Props> = ({ modalStatus, onSetActiveAccount, onHide }: Props) => {
  const { providers, isReady, activeAccount } = useWallet();
  const [accountInfo, setAccountInfo] = useState<AccWithBalance | null>(null);
  const [activeNfd, setActiveNfd] = useState(null);

  const getMaxDecimal = (num: number) => {
    const algoNumber = microalgosToAlgos(num).toFixed(3);

    return parseFloat(algoNumber);
  };

  useEffect(() => {
    let isFetching = false;

    const getAccountsData = async () => {
      if (!activeAccount?.address) {
        if (onSetActiveAccount) onSetActiveAccount(null);
      } else {
        const accountsData = await AccountService.getAccountInfo(activeAccount.address);
        // accountsData.minBalance returns undefined so we will use accountsData["min-balance"] instead
        // @ts-ignore
        const minBalance = ("min-balance" in accountsData ? accountsData["min-balance"] : 0) as number;
        setAccountInfo({
          address: activeAccount.address,
          amount: accountsData.amount,
          minBalance,
        });
        const getNfd = await ss.getNfdDomainName(activeAccount.address);
        const nfd = getNfd === null ? "" : getNfd.name;
        setActiveNfd(nfd);
        if (onSetActiveAccount)
          onSetActiveAccount({
            ...activeAccount,
            nfd,
          });
      }
    };

    if (!isFetching && isReady) getAccountsData();

    return () => {
      isFetching = true;
    };
  }, [activeAccount?.address, isReady]);

  useEffect(() => {
    if (modalStatus) {
      document.body.style.overflowY = "scroll";
      document.body.style.position = "static";
    } else {
      document.body.style.position = "";
      document.body.style.overflowY = "";
    }
  }, [modalStatus]);

  return (
    <div>
      {modalStatus && (
        <div
          className={`
            ${style.connectWalletBg}          
          `}
          onClick={onHide}
        ></div>
      )}
      {isReady && (
        <div
          className={`
            ${style.boxConnectWallet}
            ${modalStatus ? style.show : ""}
          `}
        >
          <div
            className={`
              ${style.boxConnectMsg}              
            `}
          >
            {!activeAccount ? (
              <div className={`${style.textBig}`}>
                Connect your wallet(s) here. AlgoSafe allows you to connect multiple accounts from multiple wallets. However,
                there will only be one active wallet at a time.
              </div>
            ) : (
              <>
                <div className={`d-flex flex-column ${style.gapMsg}`}>
                  <div className={`${style.textBig} ${style.textBold}`}>{activeNfd ? activeNfd : activeAccount.name}</div>
                  <div className={`d-flex align-items-center gap-1 ${style.svgIcon}`}>
                    <span className={style.normalLineHeight}>{strTruncateMiddle(activeAccount.address || "", 10, 10)}</span>
                    <IconCopy copy={`${activeAccount.address}`} small />
                    <IconLink link={`${getExplorerURL()}/address/${activeAccount.address}`} small />
                  </div>
                </div>
                <div className={`d-flex flex-column ${style.gapMsg}`}>
                  <div className={`d-flex align-items-center gap-1`}>
                    <div className={`${style.textWidth}`}>
                      <span>Total Balance</span>
                      <span>:</span>
                    </div>
                    <div
                      className={`${style.textBig} ${style.textBold} ${style.textMinWidth} text-end `}
                      style={{ marginLeft: "auto" }}
                    >
                      {accountInfo && accountInfo.amount ? getMaxDecimal(accountInfo.amount as number) + " ALGO" : "-"}
                    </div>
                  </div>
                  <div className={`d-flex align-items-center gap-1`}>
                    <div className={`${style.textWidth}`}>
                      <span>Available</span>
                      <span>:</span>
                    </div>
                    <div
                      className={`${style.textBig} ${style.textBold} ${style.textMinWidth} text-end`}
                      style={{ marginLeft: "auto" }}
                    >
                      {accountInfo && accountInfo.amount
                        ? getMaxDecimal((accountInfo.amount as number) - (accountInfo.minBalance as number)) + " ALGO"
                        : "-"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {providers?.map((provider, idx) => {
            return (
              <div
                className={`
                  ${style.wrapWallet}
                  ${provider.isConnected ? style.connected : ""}
                  ${provider.isActive ? style.active : ""}
                `}
                key={idx}
              >
                <div className={`${style.boxIcon} d-none d-md-flex`}>
                  <Image
                    src={provider.metadata.icon}
                    alt={provider.metadata.name}
                    layout="fill"
                    objectFit="cover"
                    quality={100}
                  />
                </div>
                <div className={`d-flex flex-column flex-grow-1 ${style.gapWallet}`}>
                  <div className={`d-flex justify-content-between align-items-center`}>
                    <div className={`d-flex gap-2 align-items-center`}>
                      <div className={`${style.boxIcon} d-flex d-md-none`}>
                        <Image
                          src={provider.metadata.icon}
                          alt={provider.metadata.name}
                          layout="fill"
                          objectFit="cover"
                          quality={100}
                        />
                      </div>
                      <div className={style.textTitleWallet}>{provider.metadata.name}</div>
                    </div>

                    {provider.isActive && <div className={style.activeConnect}>Active</div>}
                    {provider.isConnected && !provider.isActive && (
                      <div className={style.btnConnect} role="button" onClick={provider.setActiveProvider}>
                        <div className="text-decoration-underline">Set Active</div>
                      </div>
                    )}
                    {!provider.isConnected && (
                      <div className={style.btnConnect} role="button" onClick={provider.connect}>
                        <div className="text-decoration-underline">Connect</div>
                        <AddOutline />
                      </div>
                    )}
                  </div>
                  {provider.isActive && provider.accounts.length && <WalletDropdown provider={provider} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WalletModal;
