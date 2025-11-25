import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  // <div
  //   className={cn(
  //     "border shadow rounded-xl overflow-hidden w-full",
  //     "bg-gray-50 border-black/5 shadow-black/[0.05]",
  //     "dark:bg-gray-950 dark:border-white/10 dark:shadow-black/[0.1]",
  //     className
  //   )}
  // >
  <table
    ref={ref}
    className={cn("w-full caption-bottom text-sm", className)}
    {...props}
  />
  // </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-black/5 [&_tr]:bg-gray-50",
      "dark:[&_tr]:bg-surface-200 dark:[&_tr]:border-[#232328]",
      // [&_tr]:border-b
      "font-medium",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      "[&_tr:first-child_td:first-child]:rounded-tl-md [&_tr:first-child_td:last-child]:rounded-tr-md",
      "[&_tr:last-child_td:first-child]:rounded-bl-md [&_tr:last-child_td:last-child]:rounded-br-md",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-gray-50",
      "dark:bg-gray-950",
      "border-t font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    isExpanded?: boolean;
  }
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-black/5 bg-white hover:bg-surface-100 data-[state=selected]:bg-surface-100 data-[state=expanded]:bg-surface-100 data-[state=expanded]:hover:bg-surface-50",
      "dark:bg-surface-100 dark:hover:bg-[#1f1f23] dark:data-[state=selected]:bg-[#1f1f23] dark:border-[#232328]",
      "border-b",
      // "[&_td:first-child]:rounded-tl-xl [&_td:last-child]:rounded-tr-xl",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "text-secondary text-sm h-8 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableHeadRow = React.forwardRef<
  HTMLTableRowElement,
  React.ThHTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("py4", className)} {...props} />
));
TableHeadRow.displayName = "TableHeadRow";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0 text-primary text-base",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableNavigation = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    TablePaginationProps &
    TablePagesProps &
    TableResultsPerPageProps
>(
  (
    {
      className,

      perPage,
      total,
      currentPage,
      onValueChange,

      hasNextPage,
      nextPageUrl,
      onNextPage,

      hasPreviousPage,
      onPreviousPage,
      previousPageUrl,
    },
    ref
  ) => (
    <footer
      ref={ref}
      className={cn("flex justify-between p-4 w-full", className)}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-1.5">
          <TablePages
            total={total}
            perPage={perPage}
            currentPage={currentPage}
          />
          <div className="h-4 w-px bg-gray-200"></div>
          <TableResultsPerPage value={perPage} onValueChange={onValueChange} />
        </div>
        <TablePagination
          hasNextPage={hasNextPage}
          nextPageUrl={nextPageUrl}
          onNextPage={onNextPage}
          hasPreviousPage={hasPreviousPage}
          onPreviousPage={onPreviousPage}
          previousPageUrl={previousPageUrl}
        />
      </div>
    </footer>
  )
);

type TablePagesProps = {
  currentPage: number;
  total: number;
  perPage: string;
};

const TablePages = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TablePagesProps
>(({ className, currentPage, total, ...props }, ref) => (
  <div className={cn("flex gap-2", className)} {...props} ref={ref}>
    <div className="text-xs text-primary">
      {currentPage * 10 - 9}-{currentPage * 10} of {total}
    </div>
  </div>
));

type TableResultsPerPageProps = {
  value?: string;
  onValueChange: (value: string) => void;
};

const TableResultsPerPage = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & TableResultsPerPageProps
>(({ className, onValueChange, value = "10", ...props }, ref) => {
  const options = ["10", "25", "50", "100"];

  return (
    <div className="flex items-center text-xs text-primary gap-1">
      Results per page
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger variant="secondary" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

type TablePaginationProps = {
  hasNextPage: boolean;
  onNextPage?: () => void;
  nextPageUrl?: string;

  hasPreviousPage: boolean;
  onPreviousPage?: () => void;
  previousPageUrl?: string;
};

const TablePagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TablePaginationProps
>(
  (
    {
      className,

      hasNextPage,
      nextPageUrl,
      onNextPage,

      hasPreviousPage,
      onPreviousPage,
      previousPageUrl,
      ...props
    },
    ref
  ) => (
    <div className={cn("flex gap-2", className)} {...props} ref={ref}>
      <Button
        asChild={!!previousPageUrl}
        disabled={!hasPreviousPage}
        onClick={onPreviousPage}
        variant="secondary"
        size="sm"
      >
        {previousPageUrl ? (
          <Link href={previousPageUrl}>
            <ArrowLeft className="w-3 h-3" />
          </Link>
        ) : (
          <ArrowLeft className="w-3 h-3" />
        )}
      </Button>

      <Button
        variant="secondary"
        size="sm"
        asChild={!!nextPageUrl}
        disabled={!hasNextPage}
        onClick={onNextPage}
      >
        {nextPageUrl ? (
          <Link href={nextPageUrl}>
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <ArrowRight className="w-3 h-3" />
        )}
      </Button>
    </div>
  )
);

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-secondary", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeadRow,
  TableNavigation,
  TablePages,
  TablePagination,
  TableResultsPerPage,
  TableRow
};

