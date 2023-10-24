import style from "./NewSidebar.module.scss";
import Router, { useRouter } from "next/router";
import SocialDetails from "frontend/components/Footer/SocialDetails";
import ListSidebarItem from "frontend/components/Dashboard/NewSidebar/ListSidebarItem";
import Image from "next/image";

interface Props {
  onBack?: () => void;
  isAbsolutePosition?: boolean;
}

const NewSidebar: React.FC<Props> = ({ onBack, isAbsolutePosition }: Props) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  return (
    <div className={`${style.sidebar} ${isAbsolutePosition ? style["absolute-position"] : ""}`}>
      <div className={`d-flex mt-4 ${style.logoContainer}`}>
        <img src="/images/dashboard/arrow-left-blue.svg" className={style["arrow-left-img"]} alt="arrow-icon" onClick={onBack} />
        <div className={style.logoWrapper}>
          <a target="_blank" href="https://algosafe.io" rel="noopener noreferrer">
            {/* <img
            src="/images/Algosafe.svg"
            className={style["algosafe-img"]}
            alt="algosafe-logo"
            role="button"
            onClick={() => Router.push("/")}
          /> */}
            <div className={`${style["img-logo"]}`}>
              <Image src="/images/Algosafe.svg" alt="Safe Logo" layout="fill" objectFit="cover" quality={100} priority />
            </div>
          </a>
        </div>
      </div>

      <ListSidebarItem />

      <div
        className={`${style["add-account"]} ${router.pathname === "/dashboard/add-accounts" && style["add-account-active"]}`}
        role="button"
        onClick={() => Router.push("/dashboard/add-accounts")}
      >
        <img src="/images/dashboard/library-add-blue.svg" alt="icon" />
        <label>Add Account</label>
      </div>

      <div className={style["footer-mobile"]}>
        <SocialDetails />
        <div className="d-flex flex-column gap-2 mt-3">
          <p>ALGOSAFE ©{currentYear} </p>
          <p>
            {" "}
            <a href="mailto:hello@algofoundry.studio">HELLO@ALGOFOUNDRY.STUDIO</a>
          </p>
          <p>
            {" "}
            <a href="https://docs.algofoundry.studio/our-products/foundry-safe" target="_blank" rel="noreferrer">
              DOCS
            </a>
            &nbsp; | &nbsp;
            <a href="/assets/file/algo_foundry_privacy.pdf" target="_blank">
              PRIVACY POLICY
            </a>
            &nbsp; | &nbsp;
            <a href="/assets/file/algo_foundry_terms.pdf" target="_blank">
              TERMS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewSidebar;
