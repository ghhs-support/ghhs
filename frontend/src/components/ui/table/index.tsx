import React from "react";

// Props for Table
interface TableProps {
  children: React.ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: React.ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: React.ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: React.ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

// Props for TableCell
interface TableCellProps {
  children: React.ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  colSpan?: number; // Number of columns this cell should span
}

// Table Component
export function Table({ children, className = "" }: TableProps) {
  return (
    <table className={`w-full border-collapse ${className}`}>
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
export function TableRow({ children, className = "" }: TableRowProps) {
  return (
    <tr className={className}>
      {children}
    </tr>
  );
}

// TableCell Component
export function TableCell({ children, className = "", colSpan, isHeader = false }: TableCellProps) {
  const Component = isHeader ? "th" : "td";
  return (
    <Component className={className} colSpan={colSpan}>
      {children}
    </Component>
  );
}
