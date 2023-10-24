import { MouseEventHandler } from "react";
import styles from "./ButtonHeader.module.scss";

interface Props {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler;
  className?: string;
}

const Button: React.FC<Props> = ({ children, disabled, onClick, className }: Props) => {
  return (
    <button className={`btn ${styles["btn-header"]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
