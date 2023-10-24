import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AppState } from "frontend/redux/store";
import SidebarAccount from "shared/interfaces/SidebarAccount";

export interface SidebarAccountState {
  selectedAccount: SidebarAccount | null;
}

const initialState: SidebarAccountState = {
  selectedAccount: null,
};

export const sidebarAccountSlice = createSlice({
  name: "sidebarAccount",
  initialState,
  reducers: {
    setSelectedAccount(state: { selectedAccount: any }, action: PayloadAction<any>) {
      state.selectedAccount = action.payload;
    },
  },
});

export const getSelectedAccount = (state: AppState) => state.sidebarAccount.selectedAccount;

export const { setSelectedAccount } = sidebarAccountSlice.actions;
export default sidebarAccountSlice.reducer;
