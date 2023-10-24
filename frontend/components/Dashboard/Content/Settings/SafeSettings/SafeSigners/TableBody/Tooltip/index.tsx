import React from "react";
import styles from "./Tooltip.module.scss";

interface ITooltipSafeSignersProps {
  children: React.ReactNode;
  text: string;
}

const TooltipSafeSigners = (props: ITooltipSafeSignersProps) => {
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

export default TooltipSafeSigners;
