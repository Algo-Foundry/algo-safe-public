import styles from "frontend/components/Footer/Footer.module.scss";
import SocialDetails from "frontend/components/Footer/SocialDetails";

const Footer = () => {
  return (
    <>
      <div className={`${styles.footer}`}>
        <div className={styles["wrapper-footer"]}>
          {/* <div className={styles["footer--left"]}>
            <span>
              ALGOSAFE ©{(new Date().getFullYear())} 
            </span>
            <div className="d-flex align-items-center gap-1">
              <span>Brought to you by</span>
              <img src="/images/algofoundry.svg" alt="" />
            </div>            
          </div> */}
          <div className={styles["footer--right"]}>
            <span>
              <a href="mailto:hello@algofoundry.studio">HELLO@ALGOFOUNDRY.STUDIO</a>
              <div className={styles["text-barrier"]}>|</div>
              <a href="https://docs.algofoundry.studio/our-products/foundry-safe" target="_blank" rel="noreferrer">
                DOCS
              </a>
              <div className={styles["text-barrier"]}>|</div>
              <a href="/assets/file/algo_foundry_privacy.pdf" target="_blank">
                PRIVACY POLICY
              </a>
              <div className={styles["text-barrier"]}>|</div>
              <a href="/assets/file/algo_foundry_terms.pdf" target="_blank">
                TERMS
              </a>
            </span>
            <SocialDetails />
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
