import style from "./AddAccounts.module.scss";
import WelcomeBox from "frontend/components/Welcome/WelcomeBox";

export default function Dashboard() {
  return (
    <div className={style["add-accounts"]}>
      <WelcomeBox title={`Create Safe`} link={"/create-safe"}>
        {`Create a new Safe that is controlled by multiple signers.`}
      </WelcomeBox>
      <WelcomeBox title={`Resume Safe Creation`} link={"/resume-create-safe"}>
        {`Did you face an issue while creating a Safe? Resume your progress here.`}
      </WelcomeBox>
      <WelcomeBox title={`Co-signer Opt-in`} link={"/cosigner-optin"}>
        {`Easily opt-in here if you are a co-signer of a newly created Safe. Obtain the Safe ID from your creator.`}
      </WelcomeBox>
      <WelcomeBox title={`Add Existing Safe`} link={"/add-existing-safe"}>
        {`Manage a Safe by adding it from your connected wallet or imported Ledger account.`}
      </WelcomeBox>
      <WelcomeBox title={`Import Ledger Account`} link={"/import-ledger"}>
        {`Access, manage and transact using accounts from your Ledger Device`}
      </WelcomeBox>
    </div>
  );
}
