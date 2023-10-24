import styles from "./FormInfo.module.scss";
import AddressGroup from "frontend/components/UI/AddressGroup";
import { getExplorerURL } from "shared/utils";
import { useState } from "react";

interface Props {
  label: string;
  value: any;
  addtionalValueBefore?: any;
  addtionalValueAfter?: any;
  isValueAddress?: boolean;
  isAsset?: boolean;
  isTxn?: boolean;
  isApp?: boolean;
  isBracket?: boolean;
  isGreen?: boolean;
  isRed?: boolean;
  isLabelMax?: boolean;
  isWidthMinimum?: boolean;
  className?: string;
  isTruncate?: boolean;
  isLabelAlignStart?: boolean;
  isNoMb?: boolean;
  isRow?: boolean;
}

const FormInfo: React.FC<Props> = ({
  label,
  value,
  addtionalValueBefore,
  addtionalValueAfter,
  isValueAddress,
  isAsset,
  isTxn,
  isApp,
  isGreen,
  isRed,
  isLabelMax,
  isWidthMinimum,
  isBracket,
  className,
  isTruncate,
  isLabelAlignStart,
  isNoMb,
  isRow,
}: Props) => {
  const [showMore, setshowMore] = useState(false);

  const onShowMore = () => {
    isTruncate = false;
    setshowMore(!showMore);
  };

  return (
    <div
      className={`
      ${className}
      ${styles["form-info"]}
      ${isGreen && `${styles.green}`}
      ${isRed && `${styles.red}`}
      ${isLabelMax && `${styles["label-max"]}`}
    `}
    >
      <label
        className={`
        ${isWidthMinimum && `${styles["width-minimum"]}`}
        ${isLabelAlignStart && `align-self-start`}
      `}
      >
        {label} :
      </label>
      <span className={styles.normalLineHeight}>
        {isValueAddress ? (
          <AddressGroup
            address={`${addtionalValueBefore ? addtionalValueBefore : ""} ${isBracket ? `(${value})` : value} ${
              addtionalValueAfter ? addtionalValueAfter : ""
            }`}
            linkAddress={`
              ${getExplorerURL()}/${isTxn ? "tx" : isAsset ? "asset" : isApp ? "application" : "address"}/${value}
            `}
            isTruncate={isApp}
            noQRCode
            noCopyButton
            isRow={isRow}
            isNoMb={isNoMb}
          />
        ) : isTruncate && !showMore ? (
          value.substring(0, 48) + "..."
        ) : (
          value
        )}

        {isTruncate &&
          (showMore ? (
            <strong onClick={() => onShowMore()} role="button">
              Show Less
            </strong>
          ) : (
            <strong onClick={() => onShowMore()} role="button">
              Show More
            </strong>
          ))}
      </span>
    </div>
  );
};

export default FormInfo;
