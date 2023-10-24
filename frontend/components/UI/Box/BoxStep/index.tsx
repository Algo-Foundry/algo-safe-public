import styles from "./BoxStep.module.scss";

interface Props {
  children?: React.ReactNode;
  className?: string;
  numberHeader: number;
  titleHeader: string;
  isActive?: boolean;
  titleInfo?: string;
  isDone?: boolean;
  isContentEmpty?: boolean;
  onTitleInfo?: () => void;
}

const BoxStep: React.FC<Props> = ({
  children,
  className,
  numberHeader,
  titleHeader,
  titleInfo,
  isActive,
  isDone,
  isContentEmpty,
  onTitleInfo,
}: Props) => {
  return (
    <div
      className={`
      ${styles.box} 
      ${className && styles.className} 
      ${isActive && styles.active}
      ${isContentEmpty ? styles.noGap : ""}
    `}
    >
      <div className={`${styles.header}`}>
        <div className={styles.number}>{numberHeader}</div>
        <div className={styles.title}>
          {titleHeader}
          {titleInfo ? (
            <a role="button" onClick={onTitleInfo}>
              ({titleInfo})
            </a>
          ) : (
            ""
          )}
        </div>
        {isDone && <img src="images/icon-checklist-green.svg" />}
      </div>
      {isActive && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default BoxStep;
