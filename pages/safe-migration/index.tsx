import type { NextPage } from "next";
import styles from "./safe-migration.module.scss";
import Layout from "frontend/components/Layouts";
import SafeMigrationContent from "frontend/components/SafeMigration";
import HeaderSafe from "frontend/components/UI/Safe/HeaderSafe";

const safeMigration: NextPage = () => {
  return (
    <Layout pageTitle="Load Safe" layout="load-safe">
      <main className={`d-flex flex-column mx-auto ${styles.migrationSafe}`}>
        <HeaderSafe>
          <span>SAFE MIGRATION</span>
        </HeaderSafe>
        <div className={styles.mainContent}>
          <SafeMigrationContent />
        </div>
      </main>
    </Layout>
  );
};

export default safeMigration;
