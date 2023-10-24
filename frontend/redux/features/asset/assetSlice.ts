/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "frontend/redux/store";
import { Asset } from "shared/interfaces";

export interface AssetState {
  assets: Asset[];
  nfts: any[];
  tokens: any[];
  isFetchAssetsLoading: boolean;
  isModalFailClose: boolean;
  isModalProcessingClose: boolean;
  refreshAssetTableKey: number;
  tokensValue: number;
}

const initialState: AssetState = {
  assets: [],
  nfts: [],
  tokens: [],
  isFetchAssetsLoading: false,
  isModalFailClose: true,
  isModalProcessingClose: true,
  refreshAssetTableKey: 0,
  tokensValue: 0,
};

export const assetSlice = createSlice({
  name: "asset",
  initialState,
  reducers: {
    setAssets(state: { assets: Asset[] }, action: PayloadAction<Asset[]>) {
      state.assets = action.payload;
    },
    setNfts(state: { nfts: any[] }, action: PayloadAction<any[]>) {
      state.nfts = action.payload;
    },
    setTokens(state: { tokens: any[] }, action: PayloadAction<any[]>) {
      state.tokens = action.payload;
    },
    setIsFetchAssetsLoading(state: { isFetchAssetsLoading: boolean }, action: PayloadAction<boolean>) {
      state.isFetchAssetsLoading = action.payload;
    },
    setIsModalFailClose(state: { isModalFailClose: boolean }, action: PayloadAction<boolean>) {
      state.isModalFailClose = action.payload;
    },
    setIsModalProcessingClose(state: { isModalProcessingClose: boolean }, action: PayloadAction<boolean>) {
      state.isModalProcessingClose = action.payload;
    },
    setRefreshAssetTableKey(state: { refreshAssetTableKey: number }, action: PayloadAction<number>) {
      state.refreshAssetTableKey = action.payload;
    },
    setTokensValue(state: { tokensValue: number }, action: PayloadAction<number>) {
      state.tokensValue = action.payload;
    },
  },
});

export const getAssets = (state: AppState) => state.asset.assets;
export const getNfts = (state: AppState) => state.asset.nfts;
export const getTokens = (state: AppState) => state.asset.tokens;
export const getIsFetchAssetsLoading = (state: AppState) => state.asset.isFetchAssetsLoading;
export const getIsModalFailClose = (state: AppState) => state.asset.isModalFailClose;
export const getIsModalProcessingClose = (state: AppState) => state.asset.isModalProcessingClose;
export const getRefreshAssetTableKey = (state: AppState) => state.asset.refreshAssetTableKey;
export const getTokensValue = (state: AppState) => state.asset.tokensValue;

export const {
  setAssets,
  setNfts,
  setTokens,
  setIsFetchAssetsLoading,
  setIsModalFailClose,
  setIsModalProcessingClose,
  setRefreshAssetTableKey,
  setTokensValue,
} = assetSlice.actions;
export default assetSlice.reducer;
