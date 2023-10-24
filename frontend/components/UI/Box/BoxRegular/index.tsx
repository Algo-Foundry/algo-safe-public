import styles from "./BoxRegular.module.scss";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const BoxRegular: React.FC<Props> = ({ children, className }: Props) => {
  return (
    <div
      className={`
      ${styles.box}
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export default BoxRegular;
