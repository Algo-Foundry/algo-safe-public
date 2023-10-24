import React from "react";
import styles from "./TableBody.module.scss";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import TooltipSafeSigners from "./Tooltip";
import { strTruncateMiddle } from "shared/utils";
import { algoexplorerTransactionUrl } from "frontend/utils/string";

interface ITableBodyProps {
  isNameDisabled?: boolean;
  name: string;
  nfd?: string;
  walletAddress: string;
}

const TableBody = (props: ITableBodyProps) => {
  const { name, nfd, walletAddress, isNameDisabled } = props;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.colOne}>
          {!isNameDisabled ? (
            <p>{name}</p>
          ) : (
            <div className={styles.disabledWrapper}>
              <p>{name}</p>
              <TooltipSafeSigners text="Signer requires to Opted-in to the Safe">
                <div>
                  <img src="images/icon-warning-grey.svg" className={styles.iconStyles} />
                </div>
              </TooltipSafeSigners>
            </div>
          )}
        </div>
        <div className={styles.colTwo}>
          <p>{nfd ? nfd : "-"}</p>
        </div>
        <div className={styles.colThree}>
          <p>{walletAddress}</p>
        </div>
        <div className={styles.colFour}>
          <div>
            <IconCopy copy={walletAddress} />
          </div>
          <div>
            <IconLink
              link={algoexplorerTransactionUrl({
                id: walletAddress,
                path: "address",
              })}
            />
          </div>
        </div>
      </div>
      <div className={styles.mobileContainer}>
        <div className={`${isNameDisabled ? styles.disabledWrapper : "d-flex gap-1"} flex-column align-items-start`}>
          <p>{name}</p>
          <div className={styles.addrWrapper}>
            {nfd && (
              <p className={styles.nfdText}>
                {" "}
                {nfd}
                {" | "}
              </p>
            )}
            <div className={styles.textAddr}>
              <p>{strTruncateMiddle(walletAddress, 5, 5)}</p>
            </div>
          </div>
        </div>
        <div className={styles.iconWrapper}>
          <div>
            <IconCopy copy={"string"} disabled={isNameDisabled} />
          </div>
          <div>
            <IconLink link={"#"} disabled={isNameDisabled} />
          </div>
        </div>
      </div>
    </>
  );
};

export default TableBody;
