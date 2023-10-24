import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import Layout from "frontend/components/Layouts";
import AddExistingSafe from "frontend/components/Dashboard/Content/AddExistingSafe";

export default function Dashboard() {
  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" layoutLabel="Add Existing Safe" isBackgroundTransparent>
        <AddExistingSafe />
      </NewDashboardLayout>
    </Layout>
  );
}
