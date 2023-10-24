/* eslint-disable @next/next/no-img-element */
import styles from "./AssetModalCard.module.scss";
import NftImage from "../NftImage";
import { digitGroupingRoundUp } from "shared/utils";
import DeleteSweepRed from "frontend/components/Icons/DeleteSweepRed";
import Image from "next/image";

interface Props {
  isNft: boolean;
  isRemove: boolean;
  asset: any;
  onClick: () => void;
}

const AssetModalCard: React.FC<Props> = ({ isNft, asset, isRemove, onClick }: Props) => {
  const maxBalance =
    asset.name == "ALGO"
      ? asset.maxBalance
      : parseFloat(
          digitGroupingRoundUp(asset.balance ? asset.balance / Math.pow(10, asset.decimals ?? 0) : 0, asset.decimals ?? 0)
        );

  return (
    <>
      {isNft ? (
        <div className={styles["token-card"]} key={asset.id} onClick={() => onClick()}>
          <div className={styles["nft-image"]}>
            <div className={styles["nft-image-wrap"]}>
              <NftImage url={asset?.contentUrl} isSizeFit isLinkEnable={false} />
            </div>
          </div>
          <div>
            <div className={styles["header"]}>{asset["name"]}</div>
            <div className={styles["subtitle"]}>
              {asset.id} | {asset["unit-name"]}
            </div>
          </div>
          <div className={styles["amount"]}>
            <div>
              {isRemove ? (
                <div className={styles.iconWrapper}>
                  <DeleteSweepRed />
                </div>
              ) : (
                digitGroupingRoundUp(asset.balance ? asset.balance / Math.pow(10, asset.decimals ?? 0) : 0, asset.decimals ?? 0)
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles["token-card"]} key={asset.id} onClick={() => onClick()}>
          <div>
            <img className={styles.imgToken} src={`${asset.imgUrl}`} alt="asset-logo" />
          </div>
          <div className="d-flex flex-column">
            <div className="d-flex flex-row gap-1 align-items-center">
              {asset["unit-name"] && <div className={styles["header"]}>{asset["unit-name"]}</div>}
              {asset.id !== 0 && <div className={`${styles["subtitle"]} ${styles.smallText}`}>{`(${asset.id})`}</div>}
              {asset.isVerified && (
                <div className={`${styles.verifIcon}`}>
                  <Image alt="Icon Verification" src="/images/icon-verified.svg" layout="fill" objectFit="cover" quality={100} />
                </div>
              )}
            </div>
            {!isRemove && (
              <div className={styles.smallText}>
                <div style={{ opacity: "0.5" }}> Balance = {maxBalance}</div>
              </div>
            )}
          </div>
          {isRemove && (
            <div className={`${styles.iconWrapper} ${styles["amount"]}`}>
              <DeleteSweepRed />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AssetModalCard;
