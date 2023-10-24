import styles from "./SafeIdGroup.module.scss";
import { getExplorerURL } from "shared/utils";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";

interface Props {
  safeId: string;
  noCopyButton?: boolean;
  className?: string;
  isHash?: boolean;
  isBold?: boolean;
  reverseIcon?: boolean;
}

const SafeIdGroup: React.FC<Props> = ({ safeId, noCopyButton, className, isHash, isBold, reverseIcon }: Props) => {
  return (
    <>
      <div
        className={`
        ${styles["safe-id"]} 
        ${isBold ? styles.bold : ""}
        ${className && styles.className}
      `}
      >
        <span>{`${isHash ? "#" : ""}${safeId}`}</span>
        <div className={`d-flex gap-1 align-items-center ${reverseIcon ? "flex-row-reverse" : ""}`}>
          {!noCopyButton && <IconCopy copy={safeId} />}
          <IconLink link={`${getExplorerURL()}/application/${safeId}`} />
        </div>
      </div>
    </>
  );
};

export default SafeIdGroup;
