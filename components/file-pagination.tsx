"use client";

import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface FilePaginationProps {
  isTruncated: boolean;
  continuationToken?: string;
  onPageChange: (token?: string) => void;
}

export default function FilePagination({
  isTruncated,
  continuationToken,
  onPageChange,
}: FilePaginationProps) {
  const [pageHistory, setPageHistory] = useState<
    { token?: string; page: number }[]
  >([{ token: undefined, page: 1 }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentPage = pageHistory[currentPageIndex]?.page || 1;

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      const prevPageIndex = currentPageIndex - 1;
      const prevPage = pageHistory[prevPageIndex];
      setCurrentPageIndex(prevPageIndex);
      onPageChange(prevPage.token);
    }
  };

  const handleNext = () => {
    if (isTruncated) {
      if (currentPageIndex < pageHistory.length - 1) {
        // We already have the next page in history
        const nextPageIndex = currentPageIndex + 1;
        const nextPage = pageHistory[nextPageIndex];
        setCurrentPageIndex(nextPageIndex);
        onPageChange(nextPage.token);
      } else {
        // We need to fetch a new page
        const newPage = {
          token: continuationToken,
          page: currentPage + 1,
        };

        // Update history and move to the new page
        setPageHistory([...pageHistory, newPage]);
        setCurrentPageIndex(pageHistory.length);
        onPageChange(continuationToken);
      }
    }
  };

  // Reset pagination when the component mounts or remounts
  useEffect(() => {
    setPageHistory([{ token: undefined, page: 1 }]);
    setCurrentPageIndex(0);
  }, []);

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            className={
              currentPageIndex <= 0
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            aria-disabled={currentPageIndex <= 0}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink isActive>{currentPage}</PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            className={
              !isTruncated ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
            aria-disabled={!isTruncated}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
