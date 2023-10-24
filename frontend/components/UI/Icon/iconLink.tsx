import styles from "./Icon.module.scss";

const iconLink = "/images/safe/icon-external-link-new.svg";

interface Props {
  link?: string;
  disabled?: boolean;
  small?: boolean;
}

const IconLink: React.FC<Props> = ({ link = "#", disabled = false, small = false }: Props) => {
  return (
    <img
      src={iconLink}
      className={`${styles.iconImg} ${disabled && styles.textDisabled} ${small && styles.small}`}
      onClick={() => window.open(link, "_blank")}
      alt=""
    />
  );
};

export default IconLink;
