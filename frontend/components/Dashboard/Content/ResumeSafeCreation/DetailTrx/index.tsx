import React, { useState } from "react";
import styles from "./DetailTrx.module.scss";
import IconCopy from "frontend/components/UI/Icon/IconCopy";
import IconLink from "frontend/components/UI/Icon/iconLink";
import Button from "frontend/components/Button";
import Review from "frontend/components/UI/Safe/Review";
import { Safe } from "shared/interfaces";

interface Props {
  backSection: () => void;
  selectedSafe: Safe | undefined;
}

const DetailTrx = (props: Props) => {
  const { backSection, selectedSafe } = props;
  const [safeStep, setSafeStep] = useState(1);

  const handleNext = () => {
    setSafeStep(2);
  };

  const handleBack = () => {
    backSection();
  };

  return (
    <>
      {safeStep === 1 && (
        <div className={`d-flex flex-column mx-auto ${styles.mainSafe}`}>
          <div className={styles.mainContent}>
            <Review isResume={true} loadedSafe={selectedSafe} onNext={handleNext} onBack={handleBack} />
          </div>
        </div>
      )}
      {safeStep === 2 && (
        <div className={styles["container"]}>
          <div className={`box-safe ${styles["cosigner-optin"]}`}>
            <div className={styles["wrapper"]}>
              <div className={styles["foundrySafeContainer"]}>
                <div className={styles["header"]}>
                  <p>Name of the Safe</p>
                  <p className={styles["textBold"]}>Algo Safe</p>
                </div>
                <div className={styles["content"]}>
                  {[1, 2, 3].map((_item, index) => (
                    <div key={index} className={styles["item"]}>
                      <p>Number of Co-signers</p>
                      <p className={styles["textBold"]}>10</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles["signerContainer"]}>
                <div className={styles["header"]}>
                  <p className={styles["textBold"]}>Signers</p>
                </div>
                <div>
                  {[1, 2, 3, 4, 5].map((_item, index) => (
                    <div key={index} className={styles["item"]}>
                      <p>Signer 1</p>
                      <div className={styles["itemRight"]}>
                        <p className={styles["textBold"]}>QU2WRMXKPR...DTDHEZXYME</p>
                        <div>
                          <IconCopy copy={"text"} />
                        </div>
                        <div>
                          <IconLink link={"#"} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`box-safe ${styles["cosigner-optin-desc"]}`}>
            <div>
              <div>
                <p className={styles["textDescription"]}>
                  You are about to load a Safe to your dashboard. You are one of the signers of the Safe, you need to{" "}
                  <span className={styles["optIn"]}>opt into</span> the Safe. Opting into a Safe will prompt you to confirm a
                  transaction with your currently connected wallet. Please make sure your browser{" "}
                  <a
                    target="_blank"
                    href="https://support.google.com/chrome/answer/95472?hl=en&co=GENIE.Platform%3DDesktop"
                    rel="noreferrer"
                  >
                    <span className={styles["popUp"]}>doesn’t block pop-up</span>
                  </a>{" "}
                  from your wallet.
                </p>
                <p>Here is the breakdown of the transactions</p>
              </div>
              <div className={styles["textBottomDesc"]}>
                <p className={styles["textBold"]}>Network Fees</p>
                <p className={styles["textBold"]}>0.001 ALGO</p>
              </div>
              <div className="divider"></div>
              <div className={styles["footerContentDesktop"]}>
                <button className={`btn btn-white ${styles["btnBackPos"]}`} onClick={() => setSafeStep(1)}>
                  <p>BACK</p>
                </button>
                <Button className={styles["btnOptInPos"]} primary onClick={() => console.log("clicked")}>
                  <p>OPT-IN</p>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailTrx;
