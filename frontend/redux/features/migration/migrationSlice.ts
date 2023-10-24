/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";

export interface migrationState {
  migrationActiveData: any;
  stepProgressMigration: number;
  isAssetListEmpty: boolean;
  isOwner: boolean;
  isMigrationActive: boolean;
  isMigrationLoader: boolean;
}

const initialState: migrationState = {
  migrationActiveData: {},
  stepProgressMigration: 0,
  isAssetListEmpty: false,
  isOwner: false,
  isMigrationActive: false,
  isMigrationLoader: false,
};

export const migrationSlice = createSlice({
  name: "ptxn-execute",
  initialState,
  reducers: {
    setstepProgressMigration(state: { stepProgressMigration: number }, action: PayloadAction<number>) {
      state.stepProgressMigration = action.payload;
    },
    setMigrationActiveData(state: { migrationActiveData: any }, action: PayloadAction<any>) {
      state.migrationActiveData = action.payload;
    },
    setIsAssetListEmpty(state: { isAssetListEmpty: boolean }, action: PayloadAction<boolean>) {
      state.isAssetListEmpty = action.payload;
    },
    setIsOwner(state: { isOwner: boolean }, action: PayloadAction<boolean>) {
      state.isOwner = action.payload;
    },
    setIsMigrationActive(state: { isMigrationActive: boolean }, action: PayloadAction<boolean>) {
      state.isMigrationActive = action.payload;
    },
    setIsMigrationLoader(state: { isMigrationLoader: boolean }, action: PayloadAction<boolean>) {
      state.isMigrationLoader = action.payload;
    },
  },
});

export const getstepProgressMigration = (state: AppState) => state.migration.stepProgressMigration;
export const getMigrationActiveData = (state: AppState) => state.migration.migrationActiveData;
export const getIsAssetListEmpty = (state: AppState) => state.migration.isAssetListEmpty;
export const getIsOwner = (state: AppState) => state.migration.isOwner;
export const getIsMigrationActive = (state: AppState) => state.migration.isMigrationActive;
export const getIsMigrationLoader = (state: AppState) => state.migration.isMigrationLoader;

export const {
  setstepProgressMigration,
  setIsAssetListEmpty,
  setIsOwner,
  setIsMigrationActive,
  setMigrationActiveData,
  setIsMigrationLoader,
} = migrationSlice.actions;
export default migrationSlice.reducer;
