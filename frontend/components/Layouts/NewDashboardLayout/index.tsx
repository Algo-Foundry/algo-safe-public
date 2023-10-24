/* eslint-disable indent */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import styles from "./DashboardLayouts.module.scss";
import NewSidebar from "frontend/components/Dashboard/NewSidebar";
import ArrowLeft from "frontend/components/Icons/ArrowLeft";
import Router from "next/router";
import { useRouter } from "next/router";
import { getIsNoReadOnly } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import Image from "next/image";
import Link from "next/link";
import Footer from "frontend/components/Footer";
import useSidebar from "frontend/hooks/useSidebar";

type header = {
  [key: string]: string;
};

export default function Dashboard({
  children,
  isSubPage,
  topMenuTitle,
  contentClass,
  layoutFor,
  layoutLabel,
  isBalanceBox,
  isBackgroundTransparent,
}: {
  children?: React.ReactNode;
  isBalanceBox?: boolean;
  isBackgroundTransparent?: boolean;
  isSubPage?: boolean;
  topMenuTitle?: string;
  contentClass?: string;
  layoutLabel?: string;
  layoutFor?: string;
}) {
  const router = useRouter();
  const isNoReadOnly = useAppSelector(getIsNoReadOnly);
  const { sidebarAccounts } = useSidebar();

  return (
    <div className={`d-lg-flex ${!isNoReadOnly && "readonly"}`}>
      <div className={`${isSubPage ? "d-lg-none" : "d-none"}`}>
        <div className={styles["top-nav"]}>
          <div className="d-flex" onClick={() => Router.push("/dashboard/settings")}>
            <ArrowLeft></ArrowLeft>
          </div>

          <div className={styles.title}>{topMenuTitle}</div>
        </div>
      </div>

      {!isBalanceBox && <div className={styles["dashboard-label-mobile"]}>{layoutLabel}</div>}

      <div className={styles["dashboard-layout"]}>
        <div className={`${styles["sidebar-desktop"]}`}>
          <NewSidebar isAbsolutePosition />
        </div>

        <div className={styles.contentWrapper}>
          {router.pathname !== "/dashboard" && router.pathname !== "/" && (
            <div
              className={
                router.pathname !== "/dashboard/add-accounts"
                  ? `${styles.headerWrapper} ${styles.dashboardPage}`
                  : `${styles.headerWrapper}`
              }
            >
              {router.pathname !== "/dashboard/add-accounts" && (
                <Link
                  href={router.pathname !== "/dashboard/add-accounts" ? "/dashboard/add-accounts" : "/dashboard"}
                  // className={`d-block`}
                >
                  <div className={styles.iconWrapper}>
                    <Image
                      src="/images/dashboard/arrow-left-black.svg"
                      alt="arrow-left"
                      layout="fill"
                      objectFit="cover"
                      quality={100}
                      priority
                    />
                  </div>
                </Link>
              )}
              <p>{layoutLabel}</p>
            </div>
          )}

          <div
            className={`
            ${styles["content-side"]} 
            ${isSubPage ? "bg-mobile-white content-mobile-height" : ""} 
            ${contentClass}
            ${isBackgroundTransparent ? "bg-transparent" : ""}
          `}
          >
            {children}
          </div>
          {/* <div className={styles.footer}>
            <Footer />
          </div>           */}
        </div>
      </div>
    </div>
  );
}
