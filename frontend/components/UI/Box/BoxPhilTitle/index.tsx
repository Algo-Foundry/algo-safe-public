import styles from "./BoxPhilTitle.module.scss";

interface Props {
  title: string;
  children?: React.ReactNode;
}

const BoxPhilTitle: React.FC<Props> = ({ title, children }: Props) => {
  return (
    <div className={styles.wrapper}>
      <label className={styles.title}>{title}</label>
      <div>{children}</div>
    </div>
  );
};

export default BoxPhilTitle;
