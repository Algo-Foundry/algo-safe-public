import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";

export interface WalletState {
  showWalletDialog: boolean;
  walletAccounts: any[];
  selectedAddress: any;
}

const initialState: WalletState = {
  showWalletDialog: false,
  walletAccounts: [],
  selectedAddress: {},
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setShowWalletDialog(state: { showWalletDialog: boolean }, action: PayloadAction<boolean>) {
      state.showWalletDialog = action.payload;
    },
    setWalletAccounts(state: { walletAccounts: any[] }, action: PayloadAction<any[]>) {
      state.walletAccounts = action.payload;
    },
    setSelectedAddress(state: { selectedAddress: any }, action: PayloadAction<any>) {
      state.selectedAddress = action.payload;
    },
  },
});

export const selectShowWalletDialog = (state: AppState) => state.wallet.showWalletDialog;
export const getWalletAccounts = (state: AppState) => state.wallet.walletAccounts;
export const getSelectedAddress = (state: AppState) => state.wallet.selectedAddress;

export const { setShowWalletDialog, setWalletAccounts, setSelectedAddress } = walletSlice.actions;
export default walletSlice.reducer;
