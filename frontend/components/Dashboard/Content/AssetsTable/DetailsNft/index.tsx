import styles from "./DetailsNft.module.scss";
import Button from "frontend/components/Button";
import MoneySendIcon from "frontend/components/Icons/MoneySend";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import { algoexplorerTransactionUrl } from "frontend/utils/string";
import { strTruncateMiddle } from "shared/utils";
import WarningIcon from "frontend/components/Icons/Warning";
import { getExplorerURL } from "shared/utils";
import NftImage from "frontend/components/UI/NftImage";

interface DataModal {
  id: number;
  name: string;
  total: number;
  unitName: string;
  balance: number;
  creator: string;
  standard: string;
  description: string;
  properties: object;
  contentUrl: string;
}

interface Props {
  dataNft: DataModal;
  isHideButton?: boolean;
  onReceive?: () => void;
  onRemove?: () => void;
  onSend?: () => void;
}

const DetailsNft: React.FC<Props> = ({ dataNft, isHideButton, onSend }: Props) => {
  return (
    <div className={styles.detailNftCont}>
      <div className={`${styles.boxContentNft} ${isHideButton ? styles.noPadding : ""}`}>
        <div className={styles.imgWrapNft}>
          <NftImage url={dataNft?.contentUrl} isSizeFit isIconLinkLg isIconBottomMiddle />
          {dataNft?.balance !== 0 && <div className={`${styles.nftTotalSuply}`}>x{dataNft?.balance}</div>}
          {dataNft?.balance === 0 && <div className={styles.nftBlur} />}
          <div
            className={`
              ${dataNft?.balance !== 0 ? "d-none" : styles["warning-box"]}
            `}
          >
            <div className={styles["warning-icon"]}>
              <WarningIcon></WarningIcon>
            </div>

            <div className="flex-grow-1 d-flex flex-column">
              You opted-in to this NFT but you are not the owner of it yet. You can now receive the asset.
            </div>
          </div>
          {/* <div 
            className={`${styles.zoomImg}`}
            role="button"
          >
            <ZoomOut/>
          </div> */}
        </div>
        <div className={`${styles.wrapControl} d-md-none`}>
          <a
            href={`${getExplorerURL()}/asset/${dataNft?.id}`}
            rel="noreferrer"
            className={`${styles.textControl}`}
            role="button"
            target="_blank"
          >
            Show in Algo Explorer
          </a>
        </div>
        <div className={styles.contentWrapNft}>
          <div className={styles.boxListNft}>
            <div className={styles.listDetailNft}>
              <div className={styles.titleDetail}>Asset ID</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.textAdr}`}>{dataNft?.id}</div>
                <IconCopy copy={dataNft?.id ? dataNft?.id.toString() : ""} />
                <IconLink link={algoexplorerTransactionUrl({ id: dataNft?.id ? dataNft?.id.toString() : "", path: "asset" })} />
              </div>
            </div>
            <div className={styles.listDetailNft}>
              <div className={styles.titleDetail}>Unit Name</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.textAdr}`}>{dataNft?.unitName ? dataNft?.unitName : "-"}</div>
              </div>
            </div>
            <div className={styles.listDetailNft}>
              <div className={styles.titleDetail}>Total Supply</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.textAdr}`}>{dataNft?.total}</div>
              </div>
            </div>
            <div className={styles.listDetailNft}>
              <div className={styles.titleDetail}>Creator Account</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.textAdr}`}>{dataNft?.creator ? strTruncateMiddle(dataNft?.creator) : "-"}</div>
                <IconCopy copy={dataNft?.creator ? dataNft?.creator.toString() : ""} />
                <IconLink
                  link={algoexplorerTransactionUrl({ id: dataNft?.creator ? dataNft?.creator.toString() : "", path: "address" })}
                />
              </div>
            </div>
            <div className={styles.listDetailNft}>
              <div className={styles.titleDetail}>Standard</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.wrapType}`}>
                  <div className={`${styles.textAdr} text-uppercase`}>{dataNft?.standard}</div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.boxListNft}>
            <div className={`${styles.listDetailNft} ${styles.columnList}`}>
              <div className={styles.titleDetail}>Description</div>
              <div className={`${styles.adrWrap}`}>
                <div className={`${styles.textAdr}`}>{dataNft?.description}</div>
              </div>
            </div>
            {dataNft?.standard === "arc69" && (
              <div className={`${styles.listDetailNft} ${styles.columnList}`}>
                <div className={styles.titleDetail}>Traits</div>
                <div className={`${styles.wrapGrid}`}>
                  {Object.entries(dataNft?.properties).map(([key, value]) => (
                    <div className={`${styles.wrapType} ${styles.longType}`} key={key}>
                      <div className={`${styles.titleAdr}`}>{key}</div>
                      <div className={`${styles.textAdr} ${styles.lineToFont}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`d-flex justify-content-between align-items-center ${styles.wrapBtnMobile} ${
          isHideButton ? "d-none d-md-flex" : ""
        }`}
      >
        <div className={`${styles.wrapControl} d-none d-md-flex`}>
          <a
            href={`${getExplorerURL()}/asset/${dataNft?.id}`}
            rel="noreferrer"
            className={`${styles.textControl}`}
            role="button"
            target="_blank"
          >
            Show in Algo Explorer
          </a>
        </div>
        {!isHideButton && dataNft?.balance > 0 && (
          <Button primary className={`small-btn ${styles["action-btn"]}`} onClick={onSend}>
            <div className="d-flex align-items-center gap-1_5">
              <MoneySendIcon />
              <div className={styles["button-text"]}> SEND </div>
            </div>
          </Button>
          // :
          // <Button
          //   danger
          //   className={`small-btn ${styles["action-btn"]}`}
          //   onClick={onRemove}
          // >
          //   <div className="d-flex align-items-center gap-1_5">
          //     <DeleteSweepWhite />
          //     <div className={styles["button-text"]}> REMOVE </div>
          //   </div>
          // </Button>
        )}
      </div>
    </div>
  );
};

export default DetailsNft;
