import Styles from "../MasterContractDetail/MasterContractDetail.module.scss";
import Alert from "frontend/components/UI/Alert";
import AppConfig from "config/appConfig";
import Image from "next/image";
import { getExplorerURL } from "shared/utils";
import BorderDivider from "frontend/components/UI/BorderDivider";

export default function index() {
  return (
    <div className={Styles["master-contract-detail"]}>
      <Alert
        message={
          "If any of these values are updated, please update the environment CI/CD variables in Gitlab (staging or production) and re-run the pipeline."
        }
        isWarning
        isFontSizeMedium
      />

      <div className={Styles["box-info"]}>
        <span>
          <b>feeUpdate</b>
          {` => NEXT_PUBLIC_FOUNDRY_SAFE_CREATE_FEE`}
        </span>
        <span>
          <b>minUpdate</b>
          {` => NEXT_PUBLIC_FOUNDRY_SAFE_MIN_BALANCE`}
        </span>
        <span>
          <b>treasuryUpdate</b>
          {` => TREASURY_ADDR`}
        </span>
        <span>
          <b>pkUpdate</b>
          {` => SIGNATURE_PUBLIC_KEY (Ensure that the corresponding SIGNATURE_SECRET_KEY is updated as well)`}
        </span>
      </div>

      <div className={Styles["master-id"]}>
        <b>Master ID:</b>
        <span>{`${AppConfig.masterId}`}</span>
        <a
          href={`${getExplorerURL()}/application/${AppConfig.masterId}`}
          className={`${Styles["box-icon-sm"]}`}
          target="_blank"
          rel="noreferrer"
        >
          <Image
            alt="Icon External Link"
            src="/images/safe/icon-external-link.svg"
            layout="fill"
            objectFit="cover"
            quality={100}
          />
        </a>
      </div>

      <BorderDivider />
    </div>
  );
}
