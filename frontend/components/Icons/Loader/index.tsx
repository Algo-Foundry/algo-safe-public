import styles from "./Loader.module.scss";
const iconWaiting = "/images/safe/icon-loader.svg";

export default function Loader() {
  return (
    <div className={styles.loader}>
      <img src={iconWaiting} alt="" />
    </div>
  );
}
