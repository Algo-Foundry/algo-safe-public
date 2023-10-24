import styles from "./AutoSuggestAddress.module.scss";
import { useState, useEffect } from "react";
import { strTruncateMiddle } from "shared/utils";
import { Account, useWallet } from "@txnlab/use-wallet";
//import WalletIcon from "frontend/components/Icons/WalletIcon";
import SafeService from "frontend/services/safe";
import useSidebar from "frontend/hooks/useSidebar";
import SidebarAccount from "shared/interfaces/SidebarAccount";

type Data = {
  providerId: string;
  name: string;
  address: string;
  nfd?: string;
};

interface Props {
  data: any;
  onChange?: any;
  index: number;
}

const ss = new SafeService();

const AutoSuggestAddress: React.FC<Props> = ({ data, onChange, index }: Props) => {
  const { isReady, activeAccount, connectedAccounts, activeAddress } = useWallet();
  const [inputAdr, setInputAdr] = useState(data.nfDomain || data.addr);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [excludeActiveAccounts, setExcludeActiveAccounts] = useState<Data[]>([]);
  const { getList } = useSidebar();

  useEffect(() => {
    if (isReady) {
      onChange(inputAdr, index);
    }
  }, [inputAdr]);

  useEffect(() => {
    if (isReady) {
      // set main signer address
      if (activeAddress && index === 0) {
        setInputAdr(activeAddress);
      }

      // co-signer address should not contain active address
      if ((index !== 0 && inputAdr === activeAddress) || activeAddress === undefined) {
        setInputAdr("");
      }
    }
  }, [activeAddress]);

  const handleGetNfd = async (activeAccount: Account) => {
    let allAccounts: Data[] = [];

    // fetch any ledger accounts
    const sidebarAccs = await getList(activeAccount.address);
    sidebarAccs.forEach((acc: SidebarAccount) => {
      if (acc.ledgerAddress !== undefined) {
        allAccounts.push({
          providerId: "Ledger",
          name: acc.name,
          address: acc.address,
        });
      }
    });

    // merge with hot wallet accounts
    connectedAccounts.forEach((acc: Account) => {
      allAccounts.push({
        providerId: acc.providerId,
        name: acc.name,
        address: acc.address,
      });
    });

    const accountsAddress = allAccounts.map((object: any) => object.address);
    const getNfd = await ss.getNfdDomainName(accountsAddress);

    if (getNfd !== null) {
      allAccounts = allAccounts.map((adrObject: Data) => {
        const adrName = adrObject.address;
        if (getNfd.hasOwnProperty(adrName)) {
          return { ...adrObject, nfd: getNfd[adrName].name };
        }
        return adrObject;
      });
    }

    return allAccounts;
  };

  useEffect(() => {
    const init = async () => {
      if (!activeAccount) return;
      const accsWithNFD = await handleGetNfd(activeAccount);
      setExcludeActiveAccounts(accsWithNFD.filter((e) => e.address !== activeAccount?.address));
    };

    init();
  }, [connectedAccounts, activeAccount]);

  const handleChange = async (e: any) => {
    setInputAdr(e.target.value);
  };

  return (
    <div className="box-input w-100 position-relative">
      <input
        type="text"
        className={`form-controls ${data.errorAddress && inputAdr.length !== 0 ? "text-red" : "text-black"} ${styles.inputMob}`}
        id={`address_${index}`}
        placeholder="Enter Address or NFD"
        onChange={(evt) => handleChange(evt)}
        onFocus={() => setOpenSuggest(true)}
        onBlur={() => setTimeout(() => setOpenSuggest(false), 200)}
        value={inputAdr}
        style={{ textOverflow: "ellipsis" }}
        disabled={index === 0}
        autoComplete="off"
      />
      {data.isValid > 0 && inputAdr.length !== 0 && (
        <img
          id="img"
          className={styles.imgAdr}
          src={!data.errorAddress ? "/images/safe/icon-done.svg" : "/images/safe/icon-error.svg"}
          alt=""
        />
      )}
      {openSuggest && excludeActiveAccounts.length !== 0 && (
        <div className={styles.boxAutoSuggest}>
          <div className={styles.outer}>
            {excludeActiveAccounts?.map((value: any, index: any) => (
              <div
                key={index}
                className={`${styles.itemSuggest}`}
                role="button"
                onClick={() => {
                  setInputAdr(value.address);
                  setOpenSuggest(false);
                }}
              >
                <img
                  className={styles.imgSuggest}
                  src={
                    value.providerId == "defly"
                      ? "/img/icon/icon-algofy-black.svg"
                      : value.providerId == "walletconnect"
                      ? "/img/icon/icon-walletconnect-black.svg"
                      : value.providerId == "pera"
                      ? "/img/icon/icon-pera-wallet-black.svg"
                      : "/img/icon/icon-ledger-black.svg"
                  }
                  alt=""
                />
                <div className={styles.textSuggest}>
                  <b>
                    {value.name} : {value.nfd ? value.nfd : ""}
                  </b>{" "}
                  {strTruncateMiddle(value.address, 10, 10)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSuggestAddress;
