import Style from "./BoderDivider.module.scss";

const BorderDivider = ({
  isGrey,
  isRed,
  isOrange,
  isVertical,
  isResponsive,
  className,
}: {
  isGrey?: boolean;
  isRed?: boolean;
  isOrange?: boolean;
  isVertical?: boolean;
  isResponsive?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`
        ${Style.BorderDivider} 
        ${className}
        ${isGrey && `${Style.grey}`}
        ${isOrange && `${Style.orange}`}
        ${isRed && `${Style.red}`}
        ${isVertical && `${Style.vertical}`}
        ${isResponsive && `${Style.responsive}`}
      `}
    />
  );
};

export default BorderDivider;
