import styles from "./Overlay.module.scss";

interface Props {
  isShow: boolean;
  onClick: () => void;
}

const Overlay: React.FC<Props> = ({ isShow, onClick }: Props) => {
  return <>{isShow && <div className={styles.overlay} onClick={onClick} />}</>;
};

export default Overlay;
