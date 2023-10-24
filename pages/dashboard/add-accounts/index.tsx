import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import AddAccounts from "frontend/components/Dashboard/Content/AddAccounts";
import Layout from "frontend/components/Layouts";

export default function Dashboard() {
  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" layoutLabel="Add Accounts" isBackgroundTransparent>
        <AddAccounts />
      </NewDashboardLayout>
    </Layout>
  );
}
