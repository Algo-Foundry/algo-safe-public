import NftExternalLink from "./NftExternalLink";
import Style from "./NftImage.module.scss";

/* eslint-disable @next/next/no-img-element */
interface Props {
  url: string;
  isIconLinkSm?: boolean;
  isSizeFit?: boolean;
  isIconTop?: boolean;
  isIconLinkLg?: boolean;
  isIconBottomMiddle?: boolean;
  onModal?: () => void;
  isBlur?: boolean;
  isLinkEnable?: boolean;
}

const imgEmpty = "/images/nfts/nft-not-found.png";
const imgAudio = "/images/nfts/nft-mp3-not-found.png";
const imgVideo = "/images/nfts/nft-mp4-not-found.png";

const NftImage: React.FC<Props> = ({
  url,
  isIconLinkSm,
  isSizeFit,
  isIconTop,
  isIconLinkLg,
  isIconBottomMiddle,
  onModal,
  isBlur,
  isLinkEnable = true,
}: Props) => {
  const isAudio = url ? url.includes("#a") : false;
  const isVideo = url ? url.includes("#v") : false;

  const nftNotFound = () => {
    let imgNotFound = "";

    if (isAudio) {
      imgNotFound = imgAudio;
    } else if (isVideo) {
      imgNotFound = imgVideo;
    } else {
      imgNotFound = imgEmpty;
    }

    return imgNotFound;
  };

  return (
    <div className={`position-relative ${isSizeFit ? Style.sizeFit : ""}`}>
      <img
        src={url}
        alt="nft-img"
        onError={({ currentTarget }) => {
          currentTarget.onerror = null; // prevents looping
          currentTarget.src = `${nftNotFound()}`;
        }}
        onClick={onModal}
      />
      {isBlur && <div className={Style.nftBlur} onClick={onModal} />}
      {isLinkEnable && (
        <div
          className={`
            ${Style.link} 
            ${isIconLinkSm ? Style.sm : ""} 
            ${isIconTop ? Style.iconTop : ""} 
            ${isIconLinkLg ? Style.lg : ""}
            ${isIconBottomMiddle ? Style.iconBottomMiddle : ""}
          `}
        >
          <NftExternalLink url={url} />
        </div>
      )}
    </div>
  );
};

export default NftImage;
