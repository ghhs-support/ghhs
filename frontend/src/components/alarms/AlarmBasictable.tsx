import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import { format } from "date-fns";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface Alarm {
  id: number;
  date: string;
  is_rental: boolean;
  is_private: boolean;
  realestate_name: string | null;
  street_number: string | null;
  street_name: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  who_contacted: string;
  contact_method: 'email' | 'phone' | 'work_order';
  work_order_number: string;
  sound_type: 'full_alarm' | 'chirping_alarm';
  install_date: string | null;
  brand: 'red' | 'firepro' | 'emerald' | 'cavius' | 'other';
  hardwire_alarm: number | null;
  wireless_alarm: number | null;
  is_wall_control: boolean;
  completed: boolean;
  stage: 'to_be_booked' | 'quote_sent' | 'completed' | 'to_be_called';
  tenants: Tenant[];
  created_at: string;
  updated_at: string;
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
      alarm.street_number && alarm.street_name ? `${alarm.street_number}, ${alarm.street_name}` : null,
      alarm.suburb,
      alarm.state,
      alarm.postal_code,
      alarm.country === 'Australia' ? null : alarm.country // Only show country if not Australia
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatTenants = (tenants: Tenant[]) => {
    return tenants.map(t => t.name).join(', ');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Address
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Contact
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Work Order
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Stage
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Tenant
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {alarms.map((alarm) => (
              <TableRow key={alarm.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-3 py-2 text-start">
                  <span className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                    {formatDate(alarm.date)}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 text-start">
                  <span className="text-theme-xs text-gray-800 dark:text-white/90">
                    {formatAddress(alarm)}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 text-start">
                  <div className="space-y-0.5">
                    <div className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                      {alarm.who_contacted}
                    </div>
                    <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                      {alarm.contact_method}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2 text-start">
                  <span className="text-theme-xs text-gray-800 dark:text-white/90">
                    {alarm.work_order_number || '-'}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 text-start">
                  <Badge
                    size="sm"
                    variant="light"
                    color={getStatusColor(alarm.stage)}
                  >
                    {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-start">
                  <span className="text-theme-xs text-gray-800 dark:text-white/90">
                    {formatTenants(alarm.tenants)}
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
