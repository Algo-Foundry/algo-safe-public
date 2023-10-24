/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";
import NewSafe from "shared/interfaces/NewSafe";
import AppConfig from "config/appConfig";
import { Safe, txIds } from "shared/interfaces";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { Account } from "@txnlab/use-wallet";

export interface SafeState {
  userSafes: Safe[];
  isNoReadOnly: boolean;
  optSafe: boolean;
  isNewDataCreated: boolean;
  selectedSafe: any;
  newSafeData: NewSafe;
  initBalanceTopUp: number;
  numOfPtxn: number;
  creationTxIds: txIds;
  alertNameValidation: boolean;
  signer: LedgerAccount | Account | null;
  availableSigners: Array<LedgerAccount | Account>;
  isHaveUrgentPtxn: boolean;
}

const initialState: SafeState = {
  userSafes: [],
  selectedSafe: {},
  isNoReadOnly: false,
  optSafe: false,
  isNewDataCreated: false,
  newSafeData: {
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
  },
  initBalanceTopUp: AppConfig.minBalance,
  creationTxIds: {
    safeCreation: "",
    safeID: 0,
    address: "",
    initGroup: "",
    creationFee: "",
    topUp: "",
    optin: "",
    initAppCall: "",
  },
  numOfPtxn: 0,
  alertNameValidation: false,
  signer: null,
  availableSigners: [],
  isHaveUrgentPtxn: false,
};

export const safeSlice = createSlice({
  name: "safe",
  initialState,
  reducers: {
    setUserSafes(state: { userSafes: Safe[] }, action: PayloadAction<Safe[]>) {
      state.userSafes = action.payload;
    },
    setSelectedSafe(state: { selectedSafe: any }, action: PayloadAction<any>) {
      state.selectedSafe = action.payload;
    },
    setNewSafeData(state: { newSafeData: any }, action: PayloadAction<any>) {
      state.newSafeData = action.payload;
    },
    setIsNoReadOnly(state: { isNoReadOnly: boolean }, action: PayloadAction<boolean>) {
      state.isNoReadOnly = action.payload;
    },
    setOptSafe(state: { optSafe: boolean }, action: PayloadAction<boolean>) {
      state.optSafe = action.payload;
    },
    setIsNewDataCreated(state: { isNewDataCreated: boolean }, action: PayloadAction<boolean>) {
      state.isNewDataCreated = action.payload;
    },
    setInitBalanceTopUp(state: { initBalanceTopUp: number }, action: PayloadAction<number>) {
      state.initBalanceTopUp = action.payload;
    },
    setCreationTxIds(state: { creationTxIds: txIds }, action: PayloadAction<txIds>) {
      state.creationTxIds = action.payload;
    },
    setNumOfPtxn(state: { numOfPtxn: number }, action: PayloadAction<number>) {
      state.numOfPtxn = action.payload;
    },
    setAlertNameValidation(state: { alertNameValidation: boolean }, action: PayloadAction<boolean>) {
      state.alertNameValidation = action.payload;
    },
    setSigner(state: { signer: LedgerAccount | Account | null }, action: PayloadAction<LedgerAccount | Account | null>) {
      state.signer = action.payload;
    },
    setAvailableSigners(
      state: { availableSigners: Array<LedgerAccount | Account> },
      action: PayloadAction<Array<LedgerAccount | Account>>
    ) {
      state.availableSigners = action.payload;
    },
    setIsHaveUrgentPtxn(state: { isHaveUrgentPtxn: boolean }, action: PayloadAction<boolean>) {
      state.isHaveUrgentPtxn = action.payload;
    },
  },
});

export const getUserSafes = (state: AppState) => state.safe.userSafes;
export const getSelectedSafe = (state: AppState) => state.safe.selectedSafe;
export const getNewSafeData = (state: AppState) => state.safe.newSafeData;
export const getIsNoReadOnly = (state: AppState) => state.safe.isNoReadOnly;
export const getOptSafe = (state: AppState) => state.safe.optSafe;
export const getIsNewDataCreated = (state: AppState) => state.safe.isNewDataCreated;
export const getInitBalanceTopUp = (state: AppState) => state.safe.initBalanceTopUp;
export const getCreationTxIds = (state: AppState) => state.safe.creationTxIds;
export const getNumOfPtxn = (state: AppState) => state.safe.numOfPtxn;
export const getAlertNameValidation = (state: AppState) => state.safe.alertNameValidation;
export const getSigner = (state: AppState) => state.safe.signer;
export const getAvailableSigners = (state: AppState) => state.safe.availableSigners;
export const getIsHaveUrgentPtxn = (state: AppState) => state.safe.isHaveUrgentPtxn;

export const {
  setUserSafes,
  setSelectedSafe,
  setNewSafeData,
  setIsNoReadOnly,
  setOptSafe,
  setIsNewDataCreated,
  setInitBalanceTopUp,
  setCreationTxIds,
  setNumOfPtxn,
  setAlertNameValidation,
  setSigner,
  setAvailableSigners,
  setIsHaveUrgentPtxn,
} = safeSlice.actions;
export default safeSlice.reducer;
