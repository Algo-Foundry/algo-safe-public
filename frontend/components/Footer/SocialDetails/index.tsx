import styles from "./SocialDetails.module.scss";
import Image from "next/image";

const SocialDetails = () => {
  return (
    <div className={styles["social-details"]}>
      <a className={`d-flex ${styles["img-wrap"]}`} href="https://discord.com/invite/9EqPmrRA29" target="_blank" rel="noreferrer">
        <Image src="/images/footer/icon-discord.svg" alt="Discord Logo" layout="fill" objectFit="cover" quality={100} />
      </a>
      <a
        className={`d-flex ${styles["img-wrap"]}`}
        href="https://www.linkedin.com/company/algo-foundry"
        target="_blank"
        rel="noreferrer"
      >
        <Image src="/images/footer/icon-linkedin.svg" alt="LinkedIn Logo" layout="fill" objectFit="cover" quality={100} />
      </a>
      <a className={`d-flex ${styles["img-wrap"]}`} href="https://algofoundry.medium.com/" target="_blank" rel="noreferrer">
        <Image src="/images/footer/icon-medium.svg" alt="Medium Logo" layout="fill" objectFit="cover" quality={100} />
      </a>
      <a
        className={`d-flex ${styles["img-wrap"]}`}
        href="https://www.reddit.com/r/AlgoFoundry_/"
        target="_blank"
        rel="noreferrer"
      >
        <Image src="/images/footer/icon-reddit.svg" alt="Reddit Logo" layout="fill" objectFit="cover" quality={100} />
      </a>
      <a className={`d-flex ${styles["img-wrap"]}`} href="https://twitter.com/algo_foundry" target="_blank" rel="noreferrer">
        <Image src="/images/footer/icon-twitter-light-2.svg" alt="Twitter Logo" layout="fill" objectFit="cover" quality={100} />
      </a>
    </div>
  );
};

export default SocialDetails;
