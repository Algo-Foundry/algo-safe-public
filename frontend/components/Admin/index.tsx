import React, { useState, useEffect } from "react";
import styles from "../Admin/Admin.module.scss";
import Dropdown from "react-bootstrap/Dropdown";
import ArrowDownIcon from "frontend/components/Icons/ArrowDown";
import Alert from "frontend/components/UI/Alert/index";
import Button from "frontend/components/Button";
import SafeService from "frontend/services/safe";
import ModalTx from "frontend/components/Dashboard/Content/Transactions/ModalTx";
import ModalLoadingTx from "frontend/components/Modal/ModalLoadingTx";
import MasterContractDetail from "frontend/components/Admin/MasterContractDetail";
import { verifyAlgorandAddress } from "shared/utils";
import AppConfig from "config/appConfig";
import { useRouter } from "next/router";
import moment from "moment";
import useReimbursedSafeMigration from "frontend/hooks/useReimbursedSafeMigration";
import { useWallet } from "@txnlab/use-wallet";

import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import useSendTxAdmin from "frontend/hooks/useSendTxAdmin";
import InitTxnAdmin from "shared/interfaces/SendTxnAdmin";

const done = "/images/safe/icon-done.svg";
const fail = "/images/safe/icon-error.svg";

type Person = {
  id: number;
  from_safe: number;
  migrate_status: string;
  created_at: Date;
  updated_at: Date;
  to_safe: number;
  assets_to_transfer: number;
  reimbursed_amount: number;
  reimbursed_at: Date;
};

type AdminGlobalState = {
  global_states: any;
  treasury_addr: string;
};

const ss = new SafeService();

interface AdminProps {
  adminAddr: string;
  addrType: string;
}

export default function Admin(props: AdminProps) {
  const { adminAddr, addrType } = props;
  const { handleSendTxFromLedger, handleSendTxFromHotWallet } = useSendTxAdmin();
  const Router = useRouter();
  const itemsModal = ["Creating ", "Processing", "Success"];
  const [typeModal, setTypeModal] = useState("success-ptxn");
  const [errorDetails, setErrorDetails] = useState("");
  const [stepProgress, setStepProgress] = useState(1);
  const [responseModalShow, setResponseModalShow] = useState(false);
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<{ id: number; name: string } | null>(null);
  const [amount, setAmount] = useState<number | string>("");
  const [address, setAddress] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [imgValidateAddr, setImgValidateAddr] = useState(false);
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [globalState, setglobalState] = useState<AdminGlobalState | null>(null);
  const handleReimbursedSafeMigration = useReimbursedSafeMigration();

  const functionOption = [
    {
      id: 1,
      name: "treasuryUpdate",
    },
    {
      id: 2,
      name: "feeUpdate",
    },
    {
      id: 3,
      name: "minUpdate",
    },
    {
      id: 4,
      name: "pkUpdate",
    },
  ];
  const [reimbursState, setReimbursState] = useState<{ data: Person[]; message: string }>({ data: [], message: "" });

  const dateFormatter = (cell: Date) => {
    const newDate = moment(cell).format("MM-DD-YYYY");
    return newDate;
  };

  const reimburseFormatter = (cell: number) => {
    if (cell == null) {
      return <span>-</span>;
    } else {
      return <span>{cell}</span>;
    }
  };

  const reimbursedMigration = async (from_safe: number, migrationId: number, accAddr: string) => {
    const isComplete = await handleReimbursedSafeMigration(from_safe, migrationId, accAddr);
    if (isComplete) {
      Router.reload();
    }
  };

  const btnFormatter = (cell: Date, row: Person) => {
    if (cell == null) {
      return (
        <Button
          primary
          className="flex-grow-1 w-100"
          disabled={row.migrate_status !== "completed"}
          onClick={() => {
            if (!activeAddress) return;

            reimbursedMigration(row.from_safe, row.id, activeAddress);
          }}
        >
          Reimburse
        </Button>
      );
    } else {
      return <span>{dateFormatter(cell)}</span>;
    }
  };

  const columnHelper = createColumnHelper<Person>();

  const columns = [
    columnHelper.accessor("id", {
      cell: (info) => info.getValue(),
      header: () => <span>ID</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor((row) => row.from_safe, {
      id: "from_safe",
      cell: (info) => info.getValue(),
      header: () => <span>From Safe</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("migrate_status", {
      header: () => "Migrate Status",
      cell: (info) => info.renderValue(),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("created_at", {
      header: () => <span>Created At</span>,
      cell: (info) => dateFormatter(info.getValue()),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("updated_at", {
      header: "Updated at",
      cell: (info) => dateFormatter(info.getValue()),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("to_safe", {
      header: "To Safe",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("assets_to_transfer", {
      header: "Assets To Transfer",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("reimbursed_amount", {
      header: "Reimbursed Amount",
      cell: (info) => reimburseFormatter(info.getValue()),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor((row) => row.reimbursed_at, {
      id: "reimbursed_at",
      cell: (info) => btnFormatter(info.getValue(), info.row.original),
      header: () => <span>Reimbursed at</span>,
      footer: (info) => info.column.id,
    }),
  ];

  const [data, setData] = React.useState(() => [...reimbursState.data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getGlobalState = async () => {
    const getMasterAdmin = await ss.getMasterAdminConfig(AppConfig.masterId);
    setglobalState(getMasterAdmin);
  };

  const getReimbursState = async () => {
    const getReimbutData = await ss.getCompletedSafeMigrations();
    setReimbursState(getReimbutData);
    setData(getReimbutData.data);
  };

  useEffect(() => {
    getGlobalState();
  }, []);
  useEffect(() => {
    getReimbursState();
    // table.setPageSize(Number(15));
  }, [globalState]);

  // eslint-disable-next-line react/display-name
  const CustomToggle = React.forwardRef<
    HTMLInputElement,
    { onClick: React.MouseEventHandler<HTMLDivElement>; children: JSX.Element }
  >(({ children, onClick }, ref) => (
    <div
      ref={ref}
      className="select-toggle"
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}

      <div className="arrow-down">
        <ArrowDownIcon></ArrowDownIcon>
      </div>
    </div>
  ));

  const checkValid = (str: string) => {
    const isAddrValid = verifyAlgorandAddress(str);

    if (isAddrValid) {
      setImgValidateAddr(true);
    } else {
      setImgValidateAddr(false);
    }
  };

  const clearForm = () => {
    setAddress("");
    setAmount("");
    setPublicKey("");
  };

  const onSubmit = async () => {
    // TODO: update this fn

    setStepProgress(1);
    try {
      if (!selectedFunction?.name) return;

      setLoadingModalShow(true);
      const initTxn: InitTxnAdmin = {
        functName: selectedFunction.name,
        adminAddress: adminAddr,
        address: address,
        amount: amount ? Number(amount) : null,
        publicKey: publicKey,
      };

      if (addrType === "ledger") {
        const res = await handleSendTxFromLedger(initTxn, setStepProgress);
        if (res?.confirmation !== undefined) {
          setStepProgress(3);
          setTypeModal("success-txns");
          setResponseModalShow(true);
          clearForm();
        }
      }

      if (addrType === "hotwallet") {
        const res = await handleSendTxFromHotWallet(initTxn, setStepProgress, signTransactions, sendTransactions);
        if (res?.["confirmed-round"] !== undefined) {
          setStepProgress(3);
          setTypeModal("success-txns");
          setResponseModalShow(true);
          clearForm();
        }
      }
    } catch (err: any) {
      setTypeModal("fail");
      setErrorDetails(err?.message);
      setResponseModalShow(true);
    } finally {
      setLoadingModalShow(false);
    }
  };

  return (
    <>
      <ModalTx
        modalStatus={responseModalShow}
        type={typeModal}
        errorDetails={errorDetails}
        onHide={() => {
          if (typeModal === "success-txns" || typeModal === "success") {
            Router.reload();
          } else {
            setResponseModalShow(false);
          }
        }}
      />
      <ModalLoadingTx title="Transaction is Processing" items={itemsModal} modalStatus={loadingModalShow} step={stepProgress} />
      <div className={styles["admin-panel"]}>
        <h5 className="text-center">ADMIN PANEL</h5>
        <MasterContractDetail />
        <div className={`box-input ${styles["form-select"]}`}>
          {/* <div className='box-input mt-3'> */}
          <label htmlFor="select-asset">Select an function</label>

          <Dropdown className="custom-dropdown">
            <Dropdown.Toggle as={CustomToggle} id="select-asset">
              {selectedFunction ? (
                <div className={`${styles["option-asset"]} align-items-center`}>
                  <div></div>
                  <div>{selectedFunction.name ? selectedFunction.name : selectedFunction.id}</div>
                </div>
              ) : (
                <div>Select Function</div>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {functionOption.map((item, i) => {
                return (
                  <Dropdown.Item
                    key={"function-" + i}
                    onClick={() => {
                      setSelectedFunction(item);
                    }}
                  >
                    <div className={styles["option-asset"]}>
                      <div>
                        <div>{item.name}</div>
                      </div>
                    </div>
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {selectedFunction?.name === "treasuryUpdate" && (
          <div className={`box-input mt-3 ${styles.address}`}>
            <div className="box-input w-100 position-relative">
              <label htmlFor="recipient">Address</label>
              <input
                id="address"
                type="text"
                className="form-controls"
                placeholder="Enter Address"
                onChange={(e) => {
                  setAddress(e.currentTarget.value);
                  checkValid(e.currentTarget.value);
                  const isAddressVerified = verifyAlgorandAddress(e.currentTarget.value);
                  if (isAddressVerified) {
                    setErrorMsg("");
                  } else {
                    setErrorMsg("Recipient is invalid. Please enter recipient address/NF domain.");
                  }
                }}
                value={address}
              />
              {address && <img id="img" className={styles.imgAdr} src={imgValidateAddr ? done : fail} alt="" />}
            </div>
          </div>
        )}

        {selectedFunction && (selectedFunction.name === "minUpdate" || selectedFunction.name === "feeUpdate") && (
          <div className="box-input mt-3">
            <div className="d-flex justify-content-between">
              <label htmlFor="number">Amount</label>
            </div>
            <input
              id="number"
              type="number"
              className="form-controls hide-arrows"
              placeholder="Enter Number"
              pattern="[0-9]"
              onChange={(e) => {
                setAmount(!!e.currentTarget.value ? parseFloat(e.currentTarget.value) : "");
                if (!parseFloat(e.currentTarget.value) || parseFloat(e.currentTarget.value) < 0) {
                  setErrorMsg("Number must be greater than 0.");
                } else {
                  setErrorMsg("");
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]|\./.test(e.key) || e.key === ".") {
                  e.preventDefault();
                }
              }}
              value={amount}
            />
          </div>
        )}

        {selectedFunction?.name === "pkUpdate" && (
          <div className="box-input mt-3">
            <label htmlFor="recipient">Public Key</label>
            <input
              id="text"
              type="text"
              className="form-controls"
              placeholder="Enter Text"
              onChange={(e) => {
                setPublicKey(e.currentTarget.value);
              }}
              value={publicKey}
            />
          </div>
        )}

        <div className="mt-3 w-100">{!!errorMsg && <Alert message={errorMsg} />}</div>

        <div className="mt-3">
          <Button primary className="flex-grow-1 w-100" onClick={onSubmit} disabled={!address && !amount && !publicKey}>
            SUBMIT
          </Button>
        </div>

        {
          <div className={styles["box-state"]}>
            <div className={styles["state-details"]}>
              {globalState &&
                Object.keys(globalState.global_states)?.map((item: any) => {
                  return (
                    <span key={item}>
                      <b>&#39;{item}&#39; : </b>
                      {globalState?.global_states?.[item]}
                    </span>
                  );
                })}
            </div>
            <span>
              <b>Treasury Address:</b> {globalState?.treasury_addr}
            </span>
          </div>
        }
      </div>
      <div className={styles["admin-panel"]}>
        <h5 className="text-center text-uppercase">Reimbursement PANEL</h5>

        <div className={`box-input`}>
          <div className={styles["table-container"]}>
            <table className="w-100">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`d-flex align-items-center justify-content-center mt-3 gap-4 ${styles["box-pgn"]}`}>
              <div className={`d-flex align-items-center justify-content-center gap-2`}>
                <button
                  className="border rounded p-1"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  {"<<"}
                </button>
                <button
                  className="border rounded p-1"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {"<"}
                </button>
                <button className="border rounded p-1" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  {">"}
                </button>
                <button
                  className="border rounded p-1"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  {">>"}
                </button>
              </div>
              <span className="d-flex align-items-center justify-content-center gap-1">
                <div>Page</div>
                <strong>
                  {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </strong>
              </span>
              <span className="d-flex align-items-center justify-content-center gap-1">
                | Go to page:
                <input
                  type="number"
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                  className="border p-1 rounded w-16"
                />
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
