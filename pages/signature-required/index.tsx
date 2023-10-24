import styles from "./signature-required.module.scss";
import Image from "next/image";

export default function SignatureRequired() {
  return (
    <>
      <div className={styles["signing-header-container"]}>
        <div className={styles.logo}>
          <Image src="/images/AlgoSafeLight.svg" alt="Safe Logo" layout="fill" objectFit="cover" quality={100} priority />
        </div>
      </div>
      <div className={styles["signing-content"]}>
        <Image alt="Icon Checklist" src="/images/icon-checklist.svg" height={100} width={100} />
        <div className={styles.header}>Signature Required</div>
        <div className={styles.paragraph}>Please go back to Algo Safe window to sign the transactions</div>
      </div>
    </>
  );
}
