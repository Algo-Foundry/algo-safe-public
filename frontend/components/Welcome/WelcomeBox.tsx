/* eslint-disable @next/next/no-img-element */
import styles from "./welcomebox.module.scss";
import Link from "next/link";

export default function WelcomeBox(props: { children: React.ReactNode; title: string; link: string; isWidth?: boolean }) {
  const imgUrl = {
    create: "/images/create-safe.svg",
    existing: "/images/existing-safe.svg",
    ledger: "/images/ledger-safe.svg",
    optin: "/images/signer-optin.svg",
    resume: "/images/resume-safe.svg",
    watchlist: "/images/watchlist.svg",
  };

  const getImg = () => {
    if (props.title.includes("Create")) {
      return "create";
    } else if (props.title.includes("Existing")) {
      return "existing";
    } else if (props.title.includes("Resume")) {
      return "resume";
    } else if (props.title.includes("Opt-in")) {
      return "optin";
    } else if (props.title.includes("Watchlist")) {
      return "watchlist";
    } else {
      return "ledger";
    }
  };

  return (
    <Link href={props.link}>
      <div className={`${styles["welcome__box-btn"]} ${props.isWidth && styles.wider}`} role="button">
        <div className={styles["text"]}>
          <img src={imgUrl[getImg()]} alt="icon" />
          <div style={{ margin: "auto", marginLeft: "0px" }}>
            <label>{props.title}</label>
          </div>
        </div>
        <span>{props.children}</span>
      </div>
    </Link>
  );
}
