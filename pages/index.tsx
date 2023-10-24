/* eslint-disable @next/next/no-img-element */
import Layout from "frontend/components/Layouts";
import type { NextPage } from "next";
import styles from "styles/Home.module.scss";
import WelcomeBox from "frontend/components/Welcome/WelcomeBox";

const Home: NextPage = () => {
  return (
    <Layout pageTitle="Home" layout="welcome">
      <main className={styles.main}>
        <div className="d-flex flex-column">
          <div className={`${styles.scale} d-flex align-items-center justify-content-center`}>
            <div className={styles["title-wrap"]}>
              <div className={styles["main__title"]}>Welcome to AlgoSafe!</div>
              <div className={styles["main__subtitle"]}>
                Your most trusted platform to manage digital assets on Algorand. Get started here:
              </div>
            </div>
            <div className={styles["main__img"]}>
              <img src="/images/safe.png" alt="safe-image" />
            </div>
          </div>
          <div className={styles["main__mob-img"]}>
            <img src="/images/safe.png" alt="safe-image" />
          </div>
          <div className={styles["main__box-btn"]}>
            <WelcomeBox title={`Create Safe`} link={"/create-safe"} isWidth>
              {`Create a new Safe that is controlled by multiple signers.`}
            </WelcomeBox>
            <WelcomeBox title={`Resume Safe Creation`} link={"/resume-create-safe"} isWidth>
              {`Did you face an issue while creating a Safe? Resume your progress here.`}
            </WelcomeBox>
            <WelcomeBox title={`Co-signer Opt-in`} link={"/cosigner-optin"} isWidth>
              {`Easily opt-in here if you are a co-signer of a newly created Safe. Obtain the Safe ID from your creator.`}
            </WelcomeBox>
            <WelcomeBox title={`Add Existing Safe`} link={"/add-existing-safe"} isWidth>
              {`Manage a Safe by adding it from your connected wallet or imported Ledger account.`}
            </WelcomeBox>
            <WelcomeBox title={`Import Ledger Account`} link={"/import-ledger"} isWidth>
              {`Access, manage, and transact using accounts from your Ledger Device.`}
            </WelcomeBox>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Home;
