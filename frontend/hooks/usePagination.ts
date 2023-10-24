import { useState, useMemo, useCallback } from "react";

export default function usePagination(items: any[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = useMemo(() => (items ? items.length : 0), [items]);
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const currentItems = useMemo(() => {
    if (!items) return [];

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage, totalItems]);

  const currentTotalItem = useMemo(() => {
    if (!items) return "0 - 0 of 0";

    return `${currentPage * itemsPerPage - itemsPerPage + 1} - ${
      currentPage === totalPages ? items.length : currentPage * itemsPerPage
    } of ${items.length}`;
  }, [items, currentPage, itemsPerPage, totalItems]);

  const goToNextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }, []);

  const goToPage = useCallback(
    (page: any) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    },
    [totalPages]
  );

  return {
    currentItems,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    totalPages,
    currentPage,
    currentTotalItem,
  };
}
