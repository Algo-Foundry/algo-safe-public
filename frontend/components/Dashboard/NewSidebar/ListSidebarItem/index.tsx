import React, { useEffect, useState, useRef } from "react";
import style from "./ListSidebarItem.module.scss";
import { DropResult } from "react-beautiful-dnd";
import dynamic from "next/dynamic";
import { useWallet } from "@txnlab/use-wallet";
import SidebarAccount from "shared/interfaces/SidebarAccount";
import useSidebar from "frontend/hooks/useSidebar";
import SafeService from "frontend/services/safe";
import { useAppDispatch } from "frontend/redux/hooks";
import { getSelectedAccount, setSelectedAccount } from "frontend/redux/features/sidebarAccount/sidebarAccountSlice";
import { setSelectedSafe, getSelectedSafe, setNewSafeData } from "frontend/redux/features/safe/safeSlice";
import { useAppSelector } from "frontend/redux/hooks";
import RemoveListModal from "./RemoveListModal";
import RenameLedgerModal from "./RenameLedgerModal";
import Router from "next/router";
import ConfirmCreateLeaveModal from "./ConfirmCreateLeaveModal";

const ss = new SafeService();

const DragDropContext = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.DragDropContext;
    }),
  { ssr: false }
);

const Droppable = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.Droppable;
    }),
  { ssr: false }
);

const Draggable = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.Draggable;
    }),
  { ssr: false }
);

const ListSidebarItem = () => {
  const dispatch = useAppDispatch();
  const { activeAccount, activeAddress } = useWallet();
  const { saveList, sidebarAccounts, setSidebarAccount } = useSidebar();
  const selectedAccount = useAppSelector(getSelectedAccount);
  const selectedSafe: any = useAppSelector(getSelectedSafe);
  const [isOpenOptions, setIsOpenOptions] = useState<any>({});
  const modalRefs = useRef<any[]>([]);
  const [modalRemove, setModalRemove] = useState(false);
  const [modalRename, setModalRename] = useState(false);
  const [modalConfirmCreate, setModalConfirmCreate] = useState(false);
  const [pendingSidebarAccount, setPendingSidebarAccount] = useState<SidebarAccount | null>(null);
  const [modalData, setModalData] = useState<any>({});

  const setAccount = async (account: SidebarAccount) => {
    setSidebarAccount(account);
    dispatch(setSelectedAccount(account));

    // set selected Safe in redux
    if (Object.keys(selectedSafe).length === 0 && "appId" in account) {
      const safe = await ss.getSafe(Number(account.appId));
      dispatch(setSelectedSafe(safe));
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(sidebarAccounts as SidebarAccount[]);
    const [newOrder] = items.splice(source.index, 1);
    items.splice(destination.index, 0, newOrder);

    if (activeAddress) {
      await saveList(items, activeAccount?.address);
    } else {
      await saveList(items);
    }
  };

  const confirmChangeSidebarAccount = async (item?: SidebarAccount) => {
    const account = item?.address ? item : pendingSidebarAccount;
    if (!account) return;

    await setAccount(account);
    setModalConfirmCreate(false);

    if (!item?.address) {
      if (Router.pathname === "/create-safe") {
        dispatch(
          setNewSafeData({
            name: "",
            owners: [
              {
                name: "",
                addr: "",
                nfDomain: "",
                isValid: 0,
              },
              {
                name: "",
                addr: "",
                nfDomain: "",
                isValid: 0,
              },
            ],
            threshold: 1,
          })
        );
      }
      Router.push("/dashboard");
    }
  };

  const changeSidebarAccount = async (item: SidebarAccount) => {
    Router.replace({
      query: {},
    });
    if (Router.pathname === "/dashboard" || Router.pathname === "/dashboard/add-accounts") {
      confirmChangeSidebarAccount(item);
    } else {
      setPendingSidebarAccount(item);
      setModalConfirmCreate(true);
      return;
    }

    if (Router.pathname === "/dashboard/add-accounts") Router.push("/dashboard");
  };

  const handleOpenModal = (index: any) => {
    setIsOpenOptions((prevState: any) => ({
      ...prevState,
      [index]: true,
    }));
  };

  const handleCloseModal = (index: any) => {
    setIsOpenOptions((prevState: any) => ({
      ...prevState,
      [index]: false,
    }));
  };

  const handleClickOutside = (event: any, name: any) => {
    if (modalRefs.current[name] && !modalRefs.current[name].contains(event.target)) {
      handleCloseModal(name);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      Object.keys(isOpenOptions).forEach((name) => {
        handleClickOutside(event, name);
      });
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpenOptions]);

  return (
    <>
      <ConfirmCreateLeaveModal
        modalStatus={modalConfirmCreate}
        onHide={() => {
          setModalConfirmCreate(false);
        }}
        onConfirm={confirmChangeSidebarAccount}
      />
      <RemoveListModal
        modalStatus={modalRemove}
        onDataModal={modalData}
        onHide={() => {
          setModalRemove(false);
        }}
      />
      <RenameLedgerModal
        modalStatus={modalRename}
        onDataModal={modalData}
        onHide={() => {
          setModalRename(false);
        }}
      />
      <div className={style["box-list-items"]}>
        {sidebarAccounts.length !== 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" type="">
              {(droppableProvided) => (
                <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
                  {sidebarAccounts.map((item: SidebarAccount, index: number) => {
                    return (
                      <Draggable key={index} draggableId={String(index)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              item.address === selectedAccount?.address &&
                              Router.pathname !== "/dashboard/add-accounts" &&
                              style["active"]
                            } ${style["list-item"]} ${snapshot.isDragging ? style.dragging : ""}`}
                          >
                            <div
                              className={`d-flex gap-2 ${style.boxContent}`}
                              onClick={() => {
                                changeSidebarAccount(item);
                              }}
                            >
                              <img
                                src={`/images/dashboard/${item.ledgerAddress ? "ledger-icon-black.svg" : "safe-box-icon.svg"}`}
                                alt="algosafe-logo"
                              />
                              <p>{item.name}</p>
                              <div className={style.contentToolTips}>{item.name}</div>
                            </div>
                            <div className={`position-relative d-flex align-items-center`} style={{ height: "inherit" }}>
                              <img
                                src="/images/dashboard/overflow-menu-vertical.svg"
                                alt="algosafe-logo"
                                onClick={() => handleOpenModal(item.address)}
                              />
                              {isOpenOptions[item.address] && (
                                <div
                                  className={`${style.boxOptions}`}
                                  ref={(ref) => (modalRefs.current[item.address as any] = ref)}
                                >
                                  <div
                                    className={`${style.optionList}`}
                                    onClick={() => {
                                      setModalData(item);
                                      setModalRename(true);
                                      handleCloseModal(item.address);
                                    }}
                                  >
                                    Rename
                                  </div>
                                  <div
                                    className={`${style.optionList} ${style.red}`}
                                    onClick={() => {
                                      setModalData(item);
                                      setModalRemove(true);
                                      handleCloseModal(item.address);
                                    }}
                                  >
                                    Remove
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="d-none">
                              {droppableProvided.placeholder} {/** <<-- to handle warning issue */}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </>
  );
};

export default ListSidebarItem;
