import Header from "frontend/components/Header";
import Head from "next/head";
import Styles from "./Layout.module.scss";
import { getSelectedSafe } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import { useEffect } from "react";
import Router from "next/router";
import { useWallet } from "@txnlab/use-wallet";
import useSidebar from "frontend/hooks/useSidebar";

type layouts = "welcome" | "dashboard" | "load-safe" | "new-dashboard";

interface Props {
  children: React.ReactElement;
  pageTitle: string;
  layout?: layouts;
}

const Layouts: React.FC<Props> = ({ children, pageTitle, layout = "welcome" }: Props) => {
  const selectedSafe = useAppSelector<any>(getSelectedSafe);

  const { activeAddress, isReady } = useWallet();
  const { getList } = useSidebar();

  useEffect(() => {
    const checkAppState = async () => {
      let listAppState = [];

      listAppState = await getList(activeAddress);

      if (listAppState.length !== 0 && Router.pathname === "/") {
        Router.push("/dashboard");
      } else if (listAppState.length === 0 && Router.pathname === "/dashboard") {
        if (activeAddress) {
          Router.push("/dashboard/add-accounts");
        } else {
          Router.push("/");
        }
      }
    };

    if (isReady) {
      checkAppState();
    }
  }, [activeAddress, isReady]);

  useEffect(() => {
    if (layout == "new-dashboard") {
      localStorage.removeItem("preventSpammingModal");
    }
  }, [selectedSafe]);

  return (
    <>
      <Head>
        <title>{"AlgoSafe" || pageTitle}</title>
        <meta name="title" content="AlgoSafe"></meta>
        {
          /* eslint-disable max-len */
          <meta
            name="description"
            content="Your trusted multi-sig to manage digital assets. AlgoSafe is a set of smart contracts, APIs and SDKs that provide multi-sig functionality for use on the Algorand blockchain. It allows any Dapp on Algorand to integrate multi-sig functionality inside it, finally unlocking the true power of multi-sig on Algorand."
          ></meta>
          /* eslint-disable max-len */
        }
        <meta
          name="keywords"
          content="multisig, algorand, algo, blockchain, crypto, smart contract, defi, safe, digital asset management, dapp development"
        ></meta>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>

      {layout == "welcome" && (
        <div className="container-home-index">
          <Header />
          <div className={` d-flex  position-relative`}>{children}</div>
          {/* <Footer /> */}
        </div>
      )}

      {layout != "welcome" && (
        <div className="container-home d-flex flex-column">
          {layout == "load-safe" && <div className="bg-color load-safe"></div>}
          {layout == "dashboard" && <div className="bg-color full dashboard"></div>}
          <Header />
          {layout == "new-dashboard" ? (
            <div className={Styles["new-dashboard"]}>{children}</div>
          ) : (
            <div
              className={`
                ${layout == "dashboard" ? ` ${Styles.dashboard}` : "container-xl"} d-flex  position-relative 
                ${layout == "load-safe" ? `container-safe` : ""}`}
            >
              {children}
            </div>
          )}
          {/* <div className={`${Styles.footer} mt-auto`}>
            <Footer />
          </div> */}
        </div>
      )}
    </>
  );
};

export default Layouts;
