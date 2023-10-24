import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import Layout from "frontend/components/Layouts";
import ResumeSafeCreation from "frontend/components/Dashboard/Content/ResumeSafeCreation";

export default function Dashboard() {
  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" layoutLabel="Resume Safe Creation" isBackgroundTransparent>
        <ResumeSafeCreation />
      </NewDashboardLayout>
    </Layout>
  );
}
