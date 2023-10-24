/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";

interface DataModal {
  title?: string;
  type: string;
  txHash?: string;
  seqNumb?: number | string;
  message?: string;
  errorDetails?: string;
  txHashLabel?: string;
}

export interface ptxnExecuteState {
  showModalTxn: boolean;
  isAction: boolean;
  isLoadingModalShow: boolean;
  stepProgress: number;
  reloader: number;
  dataModal: any;
  ptxnData: any;
  lsig_address: string;
}

const initialState: ptxnExecuteState = {
  showModalTxn: false,
  isAction: false,
  isLoadingModalShow: false,
  stepProgress: 1,
  reloader: 0,
  dataModal: {},
  ptxnData: {},
  lsig_address: "",
};

export const ptxnExecuteSlice = createSlice({
  name: "ptxn-execute",
  initialState,
  reducers: {
    setShowModalTxn(state: { showModalTxn: boolean }, action: PayloadAction<boolean>) {
      state.showModalTxn = action.payload;
    },
    setPtxnData(state: { ptxnData: any }, action: PayloadAction<any>) {
      state.ptxnData = action.payload;
    },
    setDataModal(state: { dataModal: any }, action: PayloadAction<DataModal>) {
      state.dataModal = action.payload;
    },
    setIsAction(state: { isAction: boolean }, action: PayloadAction<boolean>) {
      state.isAction = action.payload;
    },
    setLoadingModalShow(state: { isLoadingModalShow: boolean }, action: PayloadAction<boolean>) {
      state.isLoadingModalShow = action.payload;
    },
    setStepProgress(state: { stepProgress: number }, action: PayloadAction<number>) {
      state.stepProgress = action.payload;
    },
    setReloader(state: { reloader: number }, action: PayloadAction<number>) {
      state.reloader = action.payload;
    },
    setLsig_address(state: { lsig_address: string }, action: PayloadAction<string>) {
      state.lsig_address = action.payload;
    },
  },
});

export const getShowModalTxn = (state: AppState) => state.ptxnExecute.showModalTxn;
export const getPtxnData = (state: AppState) => state.ptxnExecute.ptxnData;
export const getDataModal = (state: AppState) => state.ptxnExecute.dataModal;
export const getIsAction = (state: AppState) => state.ptxnExecute.isAction;
export const getLoadingModalShow = (state: AppState) => state.ptxnExecute.isLoadingModalShow;
export const getStepProgress = (state: AppState) => state.ptxnExecute.stepProgress;
export const getReloader = (state: AppState) => state.ptxnExecute.reloader;
export const getLsig_address = (state: AppState) => state.ptxnExecute.lsig_address;

export const {
  setShowModalTxn,
  setPtxnData,
  setIsAction,
  setLoadingModalShow,
  setStepProgress,
  setDataModal,
  setReloader,
  setLsig_address,
} = ptxnExecuteSlice.actions;
export default ptxnExecuteSlice.reducer;
