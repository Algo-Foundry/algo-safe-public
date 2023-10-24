import React, { useState, useEffect } from "react";
import CoSignerOptInDetail from "./Details";
import CoSignerOptInSelectAccount from "./SelectAccount";
import { Safe } from "shared/interfaces";
import { useWallet } from "@txnlab/use-wallet";

const CoSignerOptIn = () => {
  const [loadComponent, setLoadComponent] = useState("selectAccount");
  const [selectedAccount, setSelectedAccount] = useState({});
  const [safe, setSafe] = useState<Safe | null>(null);
  const { activeAccount } = useWallet();
  const handleLoadComponent = (component: string) => {
    setLoadComponent(component);
  };

  useEffect(() => {
    if (!activeAccount) handleLoadComponent("selectAccount");
  }, [activeAccount]);

  return (
    <div>
      {loadComponent === "selectAccount" && (
        <CoSignerOptInSelectAccount
          safe={safe}
          setSafe={setSafe}
          onChangeComponent={handleLoadComponent}
          setSelectedAccount={setSelectedAccount}
          selectedAccount={selectedAccount}
        />
      )}
      {loadComponent === "details" && (
        <CoSignerOptInDetail selectedAccount={selectedAccount} safe={safe} onChangeComponent={handleLoadComponent} />
      )}
    </div>
  );
};

export default CoSignerOptIn;
