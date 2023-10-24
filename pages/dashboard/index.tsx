import NewDashboardLayout from "frontend/components/Layouts/NewDashboardLayout";
import Layout from "frontend/components/Layouts";
import LedgerDetails from "frontend/components/Dashboard/Content/LedgerDetails";
import { useEffect, useState } from "react";
import ModalDappSigning from "frontend/components/Dashboard/Content/ModalDappSigning";
import { events } from "shared/constants";
import { useAppSelector } from "frontend/redux/hooks";
import { getSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import useAppConnectors from "frontend/hooks/useAppConnectors";

export default function Dashboard() {
  const [showSigningModal, setShowSigningModal] = useState(false);

  // get selected sidebar account
  const selectedAccount = useAppSelector(getSelectedAccount);

  // setup app connector
  const { initConnectorForAccount } = useAppConnectors();

  useEffect(() => {
    const showModal = (e: Event) => {
      e.preventDefault();

      const height = 296;
      const width = 400;

      if (width && height) {
        window.open(
          "/signature-required",
          "targetWindow",
          `directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}`
        );
      }

      setShowSigningModal(true);
    };

    const closeModal = () => {
      setShowSigningModal(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(events.INC_TXN, showModal);
      window.addEventListener(events.CLOSE_MODAL, closeModal);
    }

    return () => {
      window.removeEventListener(events.INC_TXN, showModal);
      window.removeEventListener(events.CLOSE_MODAL, closeModal);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!selectedAccount) return;

      // setup app connector
      await initConnectorForAccount(selectedAccount);
    };

    init();
  }, [selectedAccount, initConnectorForAccount]);

  return (
    <Layout pageTitle="Dashboard" layout="new-dashboard">
      <NewDashboardLayout contentClass="pt-0" isBackgroundTransparent isBalanceBox>
        {showSigningModal && <ModalDappSigning setShowSigningModal={setShowSigningModal} showSigningModal={showSigningModal} />}
        <LedgerDetails />
      </NewDashboardLayout>
    </Layout>
  );
}
