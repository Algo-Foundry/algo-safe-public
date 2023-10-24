/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";

export interface AccountState {
  accountInformation: any[];
  selectedAccount: any;
  disconnectAccount: number;
}

const initialState: AccountState = {
  accountInformation: [],
  selectedAccount: {},
  disconnectAccount: 0,
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setAccountInformation(state: { accountInformation: any[] }, action: PayloadAction<any[]>) {
      state.accountInformation = action.payload;
    },
    setSelectedAccount(state: { selectedAccount: any[] }, action: PayloadAction<any>) {
      state.selectedAccount = action.payload;
    },
    setDisconnectAccount(state: { disconnectAccount: number }, action: PayloadAction<number>) {
      state.disconnectAccount = action.payload;
    },
  },
});

export const getAccountInformation = (state: AppState) => state.account.accountInformation;
export const getSelectedAccount = (state: AppState) => state.account.selectedAccount;
export const getDisconnectAccount = (state: AppState) => state.account.disconnectAccount;

export const { setAccountInformation, setSelectedAccount, setDisconnectAccount } = accountSlice.actions;
export default accountSlice.reducer;
