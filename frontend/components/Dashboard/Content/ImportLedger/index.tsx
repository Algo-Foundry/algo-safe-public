import style from "./ImportLedger.module.scss";
import Button from "frontend/components/Button";
import BorderDivider from "frontend/components/UI/BorderDivider";
import Loader from "frontend/components/UI/Loader";
import SelectImportAccount from "frontend/components/Dashboard/Content/ImportLedger/SelectImportAccount";
import { useState } from "react";
import useLedger from "frontend/hooks/useLedger";
import Algorand from "@ledgerhq/hw-app-algorand";

export default function ImportLedger() {
  const [stepProgress, setStepProgress] = useState(1);
  const [transport, setTransport] = useState<Algorand | null>(null);
  const { connect } = useLedger();

  const handleOnClick = () => {
    if (stepProgress == 3) {
      setStepProgress(4);
    } else if (stepProgress == 4) {
      setStepProgress(5);
    } else {
      setStepProgress(2);
    }
  };

  const connectLedger = async () => {
    setStepProgress(2);
    try {
      const ledgerTransport = await connect();
      setTransport(ledgerTransport);
      setStepProgress(4);
    } catch (e) {
      console.log(e);
      setStepProgress(3);
    }
  };

  const handleBack = () => {
    if (stepProgress == 5) {
      setStepProgress(4);
    } else {
      setStepProgress(1);
    }
  };

  return (
    <div className={`${style["import-ledger"]} ${stepProgress == 4 && "align-items-start w-100"}`}>
      {(stepProgress == 1 || stepProgress == 3) && (
        <>
          {stepProgress == 3 ? (
            <>
              <img src="/images/dashboard/ledger-import-red.svg" alt="icon" className={style.icon} />
              <p className={style.redLabel}>No Ledger Detected</p>
            </>
          ) : (
            <>
              <img src="/images/dashboard/ledger-import-blue-big-transparent.svg" alt="icon" className={style.icon} />
              <p className={style.blueLabel}>Connect to Your Ledger</p>
            </>
          )}

          <span>{"Connect your Ledger to your computer, unlock, and choose the 'Algorand' app before connecting."}</span>

          <a
            href="https://docs.algofoundry.studio/our-products/algosafe/getting-started/import-ledger-account"
            target="_blank"
            rel="noreferrer"
          >
            Having trouble connecting? Find out how to set it up
          </a>

          <BorderDivider />

          <Button primary onClick={() => connectLedger()}>
            {stepProgress == 3 ? "TRY AGAIN" : "CONNECT"}
          </Button>
        </>
      )}

      {stepProgress == 2 && (
        <div className="mt-auto mb-auto">
          <Loader isLedger />
        </div>
      )}

      {(stepProgress == 4 || stepProgress == 5) && (
        <SelectImportAccount
          stepProgress={stepProgress}
          onImport={() => handleOnClick()}
          handleBack={() => handleBack()}
          transport={transport}
        />
      )}
    </div>
  );
}
