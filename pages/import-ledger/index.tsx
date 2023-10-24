import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import ImportLedger from "frontend/components/Dashboard/Content/ImportLedger";
import Layout from "frontend/components/Layouts";

export default function importLedger() {
  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" layoutLabel="Import Ledger Account">
        <ImportLedger />
      </NewDashboardLayout>
    </Layout>
  );
}
