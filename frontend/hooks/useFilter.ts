import { useEffect, useState } from "react";
import AppConfig from "config/appConfig";

export default function useFilter(
  assets: any,
  search: string,
  selectedSorted: {
    id: number;
    value: string;
  },
  isNft: boolean
) {
  const [filteredSortedAssets, setFilteredSortedAssets] = useState([]);

  const assetName = isNft ? "name" : "unit-name";
  useEffect(() => {
    const filteredAssets = assets?.filter((asset: any) => {
      const idAsset = String(asset.id);
      // ignore empty searches or assets w/o names
      if (search === "" || search === undefined) return true;

      return (
        (asset[`${assetName}`] === undefined ? false : asset[`${assetName}`].toLowerCase().includes(search.toLowerCase())) ||
        idAsset.toLowerCase().includes(search.toLowerCase())
      );
    });

    const sortedAssets = filteredAssets?.sort((a: any, b: any) => {
      const aname = a[`${assetName}`] === undefined ? "" : a[`${assetName}`];
      const bname = b[`${assetName}`] === undefined ? "" : b[`${assetName}`];
      if (selectedSorted.id === 0) {
        return aname.localeCompare(bname);
      } else if (selectedSorted.id === 1) {
        return bname.localeCompare(aname);
      } else if (selectedSorted.id === 2) {
        if (isNft) return b.balance - a.balance;
        else return b.balance / Math.pow(10, b.decimals) - a.balance / Math.pow(10, a.decimals);
      } else if (selectedSorted.id === 3) {
        if (isNft) return a.balance - b.balance;
        else return a.balance / Math.pow(10, a.decimals) - b.balance / Math.pow(10, b.decimals);
      } else if (selectedSorted.id === 4 && !isNft) {
        if (b.balance !== a.balance) {
          return b.balance / Math.pow(10, b.decimals) - a.balance / Math.pow(10, a.decimals);
        }
        return aname.localeCompare(bname);
      }
    });

    if (selectedSorted.id === 4 && !isNft && sortedAssets !== undefined) {
      // make Algo and Stables on top of short when default
      let itemIds: any[];

      if (AppConfig.isMainNet()) {
        itemIds = [
          { id: 0, idx: 0 },
          { id: 31566704, idx: 1 },
          { id: 312769, idx: 2 },
        ];
      } else {
        itemIds = [
          { id: 0, idx: 0 },
          { id: 10458941, idx: 1 },
        ];
      }

      itemIds.forEach((itemId) => {
        const currentIndex = sortedAssets.findIndex((item: any) => item.id === itemId.id);
        if (currentIndex !== -1) {
          const [movedItem] = sortedAssets.splice(currentIndex, 1);
          sortedAssets.splice(itemId.idx, 0, movedItem);
        }
      });

      setFilteredSortedAssets(sortedAssets);
    } else {
      setFilteredSortedAssets(sortedAssets);
    }
  }, [assets, search, selectedSorted]);

  return {
    filteredSortedAssets,
  };
}
