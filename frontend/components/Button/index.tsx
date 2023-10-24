import styles from "./Button.module.scss";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  outlined?: boolean;
  outlineRed?: boolean;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  cancel?: boolean;
  onClick?: () => void;
  type?: "submit" | "reset" | "button";
}

const ButtonNew: React.FC<Props> = ({
  children,
  onClick,
  style,
  className,
  outlined,
  outlineRed,
  primary,
  danger,
  cancel,
  disabled,
  type,
}: Props) => {
  return (
    <button
      className={`
      ${styles.btn} ${className}
      ${outlined ? styles.outlined : ""}
      ${outlineRed ? styles["outline-red"] : ""}
      ${primary ? styles.primary : ""}
      ${danger ? styles.danger : ""}
      ${cancel ? styles.cancel : ""}
      ${disabled ? styles.disabled : ""}
    `}
      style={style}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default ButtonNew;
