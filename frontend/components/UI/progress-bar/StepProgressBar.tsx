import styles from "frontend/components/UI/progress-bar/StepProgressBar.module.scss";
//import Image from 'next/image';

interface Props {
  step: number;
  items: Array<string>;
}

const StepProgressBar: React.FC<Props> = ({ step, items }: Props) => {
  return (
    <div className={styles["stepper-wrapper"]}>
      {items.map((item: string, idx: any) => {
        return (
          <div
            key={idx}
            className={`
                ${styles["stepper-item"]}                 
                ${step == idx + 1 ? styles["active"] : ""}
                ${step > idx + 1 ? styles["completed"] : ""}
              `}
          >
            <div className={styles["step-dot"]}>
              <img src="/images/progress-bar/icon-check.svg" alt="" />
            </div>
            <div className={styles["step-name"]}>{item}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StepProgressBar;
