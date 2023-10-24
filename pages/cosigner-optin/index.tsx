import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import Layout from "frontend/components/Layouts";
import CoSignerOptIn from "frontend/components/Dashboard/Content/CoSignerOptIn";

export default function Dashboard() {
  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" layoutLabel="Co-Signer Opt-In" isBackgroundTransparent>
        <CoSignerOptIn />
      </NewDashboardLayout>
    </Layout>
  );
}
