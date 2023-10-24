import store from "frontend/redux/store";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import "styles/stylesheet.scss";
import "styles/globals.scss";
import "styles/fontface.scss";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { hotjar } from "react-hotjar";
import { useEffect } from "react";
import AppConfig from "config/appConfig";
import { reconnectProviders, WalletProvider, useInitializeProviders, PROVIDER_ID } from "@txnlab/use-wallet";
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { WalletConnectModalSign } from "@walletconnect/modal-sign-html";
import { SidebarAccountProvider } from "../frontend/services/provider/sidebarAccounts.context";
import { AppConnectorProvider } from "../frontend/services/provider/appConnectors.context";
import { DEFAULT_PROJECT_ID, DEFAULT_APP_METADATA } from "config/walletConnect";
import { getDefaultAlgodCredentials } from "backend/connection/algorand";

const MyApp = ({ Component, pageProps }: AppProps) => {
  const walletProviders = useInitializeProviders({
    providers: [
      { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
      {
        id: PROVIDER_ID.WALLETCONNECT,
        clientStatic: WalletConnectModalSign,
        clientOptions: {
          projectId: DEFAULT_PROJECT_ID,
          metadata: DEFAULT_APP_METADATA,
        },
      },
    ],
    nodeConfig: {
      ...getDefaultAlgodCredentials(),
    },
  });

  useEffect(() => {
    if (walletProviders) {
      if (AppConfig.HJID !== 0 && AppConfig.HJSV !== 0) {
        hotjar.initialize(AppConfig.HJID, AppConfig.HJSV);
      }
      // console.log(walletProviders)
      reconnectProviders(walletProviders);
    }
  }, [walletProviders]);

  return (
    <WalletProvider value={walletProviders}>
      {AppConfig.isMainNet() && (
        <>
          <Script async src="https://www.googletagmanager.com/gtag/js?id=G-116M64CZ7H" strategy="afterInteractive" />
          <Script id="google-analytics">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-116M64CZ7H');
            `}
          </Script>
        </>
      )}

      <AppConnectorProvider>
        <Provider store={store}>
          <SidebarAccountProvider>
            <Component {...pageProps} />

            <ToastContainer icon={false} />
          </SidebarAccountProvider>
        </Provider>
      </AppConnectorProvider>
    </WalletProvider>
  );
};

export default MyApp;
