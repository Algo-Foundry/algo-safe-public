/* eslint-disable @typescript-eslint/no-explicit-any */

import { Decimal } from "decimal.js";

export const converToTokenUnit = (amount: number, decimal = 6) => {
  return new Decimal(amount === undefined ? 0 : amount).dividedBy(Math.pow(10, decimal).toFixed(2)).toNumber();
};

export const converToMicroUnit = async (amount: number, decimal = 6) => {
  return new Decimal(amount === undefined ? 0 : amount).mul(Math.pow(10, decimal).toFixed(2)).toNumber();
};

export const numberFormat = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function thousandSeparator(val: number) {
  if (!val) return val;

  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let res = parts.join(".");

  if (res.length > 1 && res.charAt(0) === ".") {
    res = "0" + res;
  }

  return res;
}

export function getAssetDecimalTruncate(unitName: string) {
  switch (unitName) {
    case "ALGO":
      return 6;
    default:
      return 2;
  }
}

export function thousandSeparatorFloat(val: number, toFixedNum = 2) {
  if (!val) return String(val);
  const value = parseFloat(parseFloat(val.toString()).toFixed(toFixedNum));
  const parts = value.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let res = parts.join(".");

  if (res.length > 1 && res.charAt(0) === ".") {
    res = "0" + res;
  }

  return res;
}
