import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import walletReducer from "./features/wallet/walletSlice";
import accountReducer from "./features/account/accountSlice";
import safeReducer from "./features/safe/safeSlice";
import ptxnExecuteReducer from "./features/ptxnExecute/ptxnExecuteSlice";
import migrationReducer from "./features/migration/migrationSlice";
import assetReducer from "./features/asset/assetSlice";
import sidebarAccountReducer from "./features/sidebarAccount/sidebarAccountSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      wallet: walletReducer,
      account: accountReducer,
      safe: safeReducer,
      ptxnExecute: ptxnExecuteReducer,
      migration: migrationReducer,
      asset: assetReducer,
      sidebarAccount: sidebarAccountReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const store = makeStore();

export type AppState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action<string>>;

export default store;
