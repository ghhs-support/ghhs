import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import { format } from "date-fns";

interface Alarm {
  id: number;
  date: string;
  street_number: string;
  street_name: string;
  suburb: string;
  city: string;
  state: string;
  postal_code: string;
  who_contacted: string;
  contact_method: string;
  work_order_number: string;
  sound_type: string;
  install_date: string;
  brand: string;
  hardware: number;
  wireless: number;
  tenant_names: string;
  phone: string;
  completed: boolean;
  stage: string;
}

interface AlarmBasicTableProps {
  alarms: Alarm[];
}

export default function AlarmBasicTable({ alarms }: AlarmBasicTableProps) {
  const getStatusColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'quote_sent':
        return 'warning';
      case 'to_be_called':
        return 'info';
      case 'to_be_booked':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const formatAddress = (alarm: Alarm) => {
    const parts = [
      alarm.street_number,
      alarm.street_name,
      alarm.suburb,
      alarm.city,
      alarm.state,
      alarm.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Address
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Contact
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Work Order
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Stage
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Tenant
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {alarms.map((alarm) => (
              <TableRow key={alarm.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center">
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {format(new Date(alarm.date), 'MM/dd/yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <div className="flex items-center">
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {formatAddress(alarm)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <div>
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {alarm.who_contacted}
                    </span>
                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                      {alarm.phone}
                    </span>
                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                      {alarm.contact_method}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {alarm.work_order_number || '-'}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <Badge
                    size="sm"
                    variant="light"
                    color={getStatusColor(alarm.stage)}
                  >
                    {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-start">
                  <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {alarm.tenant_names}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
