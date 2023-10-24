/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import React, { useState } from "react";
import styles from "./DeleteSafe.module.scss";
import ModalDanger from "./ModalDanger";

const DeleteSafe = (props: any) => {
  const [showModalDanger, setShowModalDanger] = useState(false);

  return (
    <div>
      <ModalDanger
        modalStatus={showModalDanger}
        setModalStatus={setShowModalDanger}
        onHide={() => setShowModalDanger(false)}
        title={"Delete Safe"}
        removeSafe={true}
      />
      <div className={styles.container}>
        <div className={styles.titleWrapper}>
          <p className={styles.titleHeader}>Delete Safe</p>
          <p style={{ textAlign: "justify" }}>
            This will create a &apos;Delete Safe&apos; pending transaction that requires confirmation by co-signers of the Safe.
          </p>
        </div>
        <div className={styles.btnWrapper}>
          <button
            onClick={() => setShowModalDanger(true)}
            className={`${styles.btnStyles} ${props.showDelete ? "" : styles.disabledBtn}`}
            disabled={!props.showDelete}
          >
            <img src="images/icon-delete-pink.svg" className={styles.iconStyles} />
            <p className={styles.text}>DELETE</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSafe;
