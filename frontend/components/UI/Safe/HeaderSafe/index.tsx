import styles from "frontend/components/UI/Safe/HeaderSafe/HeaderSafe.module.scss";

interface Props {
  children: React.ReactElement;
}

const HeaderSafe: React.FC<Props> = ({ children }: Props) => {
  return (
    <div className={styles["header-wrapper"]}>
      <div className={styles["header-title"]}>{children}</div>
    </div>
  );
};

export default HeaderSafe;
