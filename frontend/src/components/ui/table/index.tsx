import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
  role?: string;
  'aria-label'?: string;
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  colSpan?: number; // Number of columns this cell should span
  onClick?: () => void;
}

// Table Component
export function Table({ children, className = "" }: TableProps) {
  return (
    <table className={`w-full table-auto ${className}`}>
      {children}
    </table>
  );
}

// TableHeader Component
export function TableHeader({ children, className = "" }: TableHeaderProps) {
  return (
    <thead className={className}>
      {children}
    </thead>
  );
}

// TableBody Component
export function TableBody({ children, className = "" }: TableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

// TableRow Component
export function TableRow({ 
  children, 
  className = "", 
  onClick,
  onKeyDown,
  tabIndex,
  role,
  'aria-label': ariaLabel
}: TableRowProps) {
  return (
    <tr 
      className={className} 
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  );
}

// TableCell Component
export function TableCell({ children, isHeader = false, className = "", colSpan, onClick }: TableCellProps) {
  const Tag = isHeader ? "th" : "td";
  return (
    <Tag className={className} colSpan={colSpan} onClick={onClick}>
      {children}
    </Tag>
  );
}
