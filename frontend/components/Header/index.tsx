/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Image from "next/image";
import styles from "./header.module.scss";
import Wallet from "frontend/components/Wallet";
import Link from "next/link";
import { useState } from "react";
import NewSidebar from "frontend/components/Dashboard/NewSidebar";
import Menu from "frontend/components/Icons/Menu";
import { useRouter } from "next/router";
import useSidebar from "frontend/hooks/useSidebar";
import { useOutsideClick } from "frontend/hooks/useOutsideClick";

type header = {
  [key: string]: string;
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useOutsideClick(() => setOpen(false));
  const { sidebarAccounts } = useSidebar();

  const headerText: header = {
    "/dashboard/add-accounts": "Add Accounts",
    "/create-safe": "Create New Safe",
    "/import-ledger": "Import Ledger",
    "/resume-create-safe": "Resume Safe Creation",
    "/add-existing-safe": "Add Existing Safe",
    "/cosigner-optin": "Co-Signer Opt-in",
  };

  return (
    <>
      <div className={`${styles.header}`}>
        <div className={`d-flex align-items-center`}>
          <div className={`${styles["img-logo-mobile"]} d-lg-none`} onClick={() => setOpen(!open)}>
            {/* <Menu /> */}
            <Image
              src="/images/dashboard/arrow-left-blue.svg"
              alt="arrow-left"
              layout="fill"
              objectFit="cover"
              quality={100}
              priority
            />
          </div>

          {/* back icon button */}
          {/* <Link
            href={router.pathname !== "/dashboard/add-accounts" ? "/dashboard/add-accounts" : "/dashboard"}
            className={`d-block`}
          >
            <div className={`${styles["img-back"]}`}>
              <Image
                src="/images/dashboard/arrow-left-black.svg"
                alt="arrow-left"
                layout="fill"
                objectFit="cover"
                quality={100}
                priority
              />
            </div>
          </Link> */}

          <a
            target="_blank"
            href="https://algosafe.io"
            rel="noopener noreferrer"
            className={`${styles["img-logo"]} ${
              router.pathname === "/" || (router.pathname === "/create-safe" && sidebarAccounts.length === 0)
                ? "position-relative"
                : ""
            }`}
          >
            <Image src="/images/Algosafe.svg" alt="Safe Logo" layout="fill" objectFit="cover" quality={100} priority />
          </a>
        </div>

        <div className={styles["wrapper-button"]}>
          <Wallet />
        </div>
      </div>
      <div className={`${styles["nav-blur"]} ${open == true && styles.active}`}></div>
      <div className={`${styles["nav-items"]} ${open == true ? styles["nav-active"] : ""} d-lg-none`}>
        <div className={`${styles.collapse} ${styles["navbar-collapse"]}`} id="navbarSupportedContent">
          <div className={styles.wrapper}>
            <div ref={ref} className="position-absolute" style={{ left: 0 }}>
              <NewSidebar onBack={() => setOpen(!open)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
