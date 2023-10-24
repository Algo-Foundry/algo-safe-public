import React from "react";
import styles from "./Tooltip.module.scss";

interface ITooltipExistingSafeProps {
  children: React.ReactNode;
  text: string;
}

const TooltipExistingSafe = (props: ITooltipExistingSafeProps) => {
  const { children, text } = props;
  return (
    <div className={styles.tooltip}>
      {children}
      <div className={styles.tooltiptext}>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default TooltipExistingSafe;
