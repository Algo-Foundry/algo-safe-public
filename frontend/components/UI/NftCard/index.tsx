/* eslint-disable @next/next/no-img-element */
import styles from "frontend/components/UI/NftCard/NftCard.module.scss";
import NftImage from "frontend/components/UI/NftImage";

interface NftData {
  name: string;
  asaID: number;
  unitName: string;
  imgUrl: string;
  optIn?: number;
}

interface Props {
  data: NftData;
}

const NftCard: React.FC<Props> = ({ data }: Props) => {
  const truncateName = data.name?.length > 20 ? data.name.substring(0, 20) + "..." : data.name;

  return (
    <div className={styles["asset-nft"]}>
      <NftImage url={data.imgUrl} />
      <div className="d-block">
        <span>{truncateName}</span>
        <p>
          {data.asaID} | {data.unitName}
        </p>
        {data.optIn ? <span className={styles["nft-optIn"]}>x{data.optIn}</span> : ""}
      </div>
    </div>
  );
};

export default NftCard;
