import styles from "./Icon.module.scss";

const iconQr = "/images/safe/icon-qr.svg";

interface Props {
  data?: string;
}

const IconQr: React.FC<Props> = ({}: Props) => {
  return <img src={iconQr} className={styles.iconImg} alt="" />;
};

export default IconQr;
