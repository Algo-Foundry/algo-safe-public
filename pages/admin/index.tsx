import type { NextPage } from "next";
import Layout from "frontend/components/Layouts";
import AdminPanel from "frontend/components/Admin";
import { useWallet } from "@txnlab/use-wallet";
import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";

const Admin: NextPage = () => {
  const { activeAddress } = useWallet();
  const selectedAccount = useAppSelector(getSelectedAccount);

  //get selected address if ledger
  const getIfSelectedAddr = selectedAccount?.ledgerAddress ? selectedAccount.address : null;
  //check if address is admin
  const adminAddr = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "";
  const checkAuthorized = adminAddr === activeAddress || adminAddr === getIfSelectedAddr;
  const addrType = adminAddr === activeAddress ? "hotwallet" : "ledger";

  return (
    <>
      <Layout pageTitle="Dashboard" layout="new-dashboard">
        <NewDashboardLayout contentClass="pt-0" layoutLabel="Admin" isBackgroundTransparent>
          {!checkAuthorized ? (
            <div>
              <p>Access is Unauthorised</p>
            </div>
          ) : (
            <AdminPanel adminAddr={adminAddr} addrType={addrType} />
          )}
        </NewDashboardLayout>
      </Layout>
    </>
  );
};

export default Admin;
