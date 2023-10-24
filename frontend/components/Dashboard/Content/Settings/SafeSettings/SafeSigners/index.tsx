import React, { useEffect, useState } from "react";
import styles from "./SafeSigners.module.scss";
import TableBody from "./TableBody";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import SafeService from "frontend/services/safe/index";
import SafeDetails from "shared/interfaces/SafeOwner";
import ModalLoading from "frontend/components/Modal/ModalLoadingTx";

const SafeSigners = () => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);
  const safeService = new SafeService();
  const [updated, setUpdated] = useState(false);
  const [data, setData] = useState<SafeDetails[]>([]);
  const getDomain = async () => {
    return await safeService.getNfdDomainName(selectedSafe.owners.map((item: any) => item.addr));
  };

  useEffect(() => {
    const ownerDetails = async () => {
      setUpdated(true);
      try {
        const domains = await getDomain();
        const details = await selectedSafe.owners.map(async (item: any) => {
          const { status } = await safeService.verifySafeOwnership(selectedSafe, item.addr);
          let domain, optedIn;
          if (status === "owner") {
            optedIn = false;
          } else {
            optedIn = true;
          }
          if (domains !== null && domains[item.addr]) {
            domain = domains[item.addr].name;
          } else {
            domain = "";
          }
          return {
            ...item,
            nfd: domain,
            optedIn: optedIn,
          };
        });
        setData(await Promise.all(details));
      } catch (err) {
        console.log(err);
        setUpdated(false);
      } finally {
        setUpdated(false);
      }
    };

    let isInit = true;
    if (isInit && selectedSafe?.address) {
      ownerDetails();
    }
    return () => {
      isInit = false;
      setData([]);
    };
  }, [selectedSafe?.address]);

  return (
    <div className={styles.container}>
      <ModalLoading title="Fetching owner details..." modalStatus={updated} />
      <div className={styles.titleWrapper}>
        <p className={styles.titleHeader}>Safe Signers</p>
      </div>
      <div>
        <div className={styles.headerWrapper}>
          <div className={styles.colOne}>
            <p className={styles.textHeader}>Name</p>
          </div>
          <div className={styles.colTwo}>
            <p className={styles.textHeader}>NFD</p>
          </div>
          <div className={styles.colThree}>
            <p className={styles.textHeader}>Wallet Address</p>
          </div>
          <div className={styles.colFour} />
        </div>
        <>
          {data.map((item: any, index: number) => (
            <div className={`${styles.bodyWrapper} ${styles.borderBottom}`} key={index}>
              <TableBody
                isNameDisabled={item.optedIn}
                name={item.name}
                nfd={item.nfd}
                walletAddress={item.addr}
                key={item.index}
              />
            </div>
          ))}
        </>
      </div>
    </div>
  );
};

export default SafeSigners;
