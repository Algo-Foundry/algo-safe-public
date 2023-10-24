/* eslint-disable @next/next/no-img-element */
interface Props {
  url: string;
}

const NftExternalLink: React.FC<Props> = ({ url }: Props) => {
  return (
    <a href={url} target="blank_">
      <img src="/images/nfts/nft-external-link.svg" alt="nft-img" />
    </a>
  );
};

export default NftExternalLink;
