import style from "../ConnectWalletModal.module.scss";
import { useState, useEffect } from "react";
import LinkOff from "frontend/components/Icons/LinkOff";
import { Collapse } from "react-bootstrap";
import ArrowDown from "frontend/components/Icons/ArrowDown";
import Done from "frontend/components/Icons/Done";
import { Account, Provider, useWallet } from "@txnlab/use-wallet";
import { strTruncateMiddle } from "shared/utils";
import SafeService from "frontend/services/safe";
import useSidebar from "frontend/hooks/useSidebar";
import { AccountWithNFD } from "shared/interfaces";

interface Props {
  provider: any;
}

const ss = new SafeService();

const WalletDropdown: React.FC<Props> = ({ provider }: Props) => {
  const { activeAddress, providers, connectedActiveAccounts, isReady } = useWallet();
  const [adrDropdown, setAdrDropdown] = useState(false);
  const [connectedAccountsWithNFD, setConnectedAccountsWithNFD] = useState<AccountWithNFD[]>([]);
  const [mainAccount, setMainAccount] = useState<AccountWithNFD | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const { mergeSidebarAccounts, clearSelected } = useSidebar();
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!providers) return;
    const found = providers.find((p) => p.isActive);
    if (found) {
      setActiveProvider(found);
    } else {
      setActiveProvider(null);
    }
  }, [JSON.stringify(providers)]);

  useEffect(() => {
    let isFetching = false;

    //fetch NFD for active connected accounts
    const fetchNFDs = async (accounts: Account[]) => {
      if (accounts.length === 0) return;

      const addresses = accounts.map((acc: Account) => acc.address);
      const allNFDs = await ss.getNfdDomainName(addresses);
      const accountsWithNFD: AccountWithNFD[] = accounts.map((acc: Account) => {
        const adrName = acc.address;
        if (allNFDs?.hasOwnProperty(adrName)) {
          return { ...acc, nfd: allNFDs[adrName].name };
        }
        return { ...acc } as AccountWithNFD;
      });

      setConnectedAccountsWithNFD(accountsWithNFD);
    };

    if (!isFetching) fetchNFDs(connectedActiveAccounts);

    return () => {
      isFetching = true;
    };
  }, [JSON.stringify(activeProvider)]);

  useEffect(() => {
    if (!isReady) return;

    let fetchingFor = null;

    const setNFDandUpdateSidebar = async () => {
      // nothing to update
      if (!activeAddress || connectedAccountsWithNFD.length === 0) return;

      // set main account
      const accFound = connectedAccountsWithNFD.find((acc) => acc.address === activeAddress);
      if (accFound !== undefined) {
        setMainAccount(accFound);
        await mergeSidebarAccounts(accFound.address);
      } else {
        setMainAccount(null);
      }
    };

    if (fetchingFor !== activeAddress) setNFDandUpdateSidebar();

    return () => {
      fetchingFor = activeAddress;
    };
  }, [activeAddress, isReady, JSON.stringify(connectedAccountsWithNFD)]);

  const changeActiveProvider = () => {
    const newActiveProvider = providers?.find((e) => e.isConnected && !e.isActive);
    if (newActiveProvider !== undefined) {
      newActiveProvider.setActiveProvider();
    }
  };

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

  return (
    <div className={`d-flex gap-1 align-items-center`}>
      {mainAccount && (
        <div className={style.boxSorting}>
          <button className={`${style.btnSort}`} onClick={() => setAdrDropdown(!adrDropdown)}>
            <div className={`d-flex flex-column align-items-start`}>
              <div className={`d-flex flex-column flex-md-row align-items-start`}>
                <b>{mainAccount.name} :&nbsp;</b>
                <b>{mainAccount.nfd}</b>
              </div>
              <div>{strTruncateMiddle(mainAccount.address, 10, 10)}</div>
            </div>
            <ArrowDown />
          </button>

          <Collapse in={adrDropdown}>
            <div className={style.dropdownSort}>
              {connectedAccountsWithNFD?.map((item: any, i: any) => {
                return (
                  <div
                    className={`
                      ${style.wrapTextBtn}
                      ${item.address === mainAccount.address ? style.select : ""}
                      `}
                    key={"address" + i}
                    onClick={() => {
                      setAdrDropdown(false);
                      if (provider.isActive && item.address !== activeAddress) {
                        provider.setActiveAccount(item.address);
                        clearSelected();
                      }
                    }}
                  >
                    <div className={`d-flex flex-column align-items-start`}>
                      <div className={`d-flex flex-column flex-md-row align-items-start`}>
                        <b>{item.name} :&nbsp;</b>
                        <b>{item.nfd}</b>
                      </div>
                      <div>{strTruncateMiddle(item.address, 10, 10)}</div>
                    </div>
                    {item.address === mainAccount.address && <Done />}
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      )}
      <div
        className={style.boxDisconnext}
        onClick={() => {
          provider.disconnect();
          clearSelected();
          changeActiveProvider();
        }}
      >
        <LinkOff />
        <div className={style.boxTooltips}>Disconnect</div>
      </div>
    </div>
  );
};

export default WalletDropdown;
