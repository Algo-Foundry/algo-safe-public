import { copyText } from "shared/utils";
import { toast } from "react-toastify";
import styles from "./Icon.module.scss";

// import 'react-toastify/dist/ReactToastify.css';

const iconCopy = "/images/safe/icon-copy-new.svg";

interface Props {
  copy: string;
  disabled?: boolean;
  small?: boolean;
}

const IconCopy: React.FC<Props> = ({ copy, disabled = false, small = false }: Props) => {
  const makeid = (length: number) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const copyfunc = (tx: string) => {
    copyText(tx);

    toast("Copied", {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
      type: "info",
      toastId: makeid(4),
    });
  };
  return (
    <div style={{ position: "relative" }}>
      <img
        src={iconCopy}
        className={`${styles.iconImg} ${disabled && styles.textDisabled} ${small && styles.small}`}
        onClick={() => copyfunc(copy)}
        alt=""
      />
      {/* <ToastContainer icon={false} /> */}
    </div>
  );
};

export default IconCopy;
