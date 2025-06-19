import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import { format } from "date-fns";
import { useState } from "react";

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
  const [searchText, setSearchText] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");

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

  const filteredAlarms = alarms.filter((alarm) => {
    const searchLower = searchText.toLowerCase();
    return (
      formatAddress(alarm).toLowerCase().includes(searchLower) ||
      alarm.who_contacted.toLowerCase().includes(searchLower) ||
      alarm.work_order_number.toLowerCase().includes(searchLower) ||
      formatTenants(alarm.tenants).toLowerCase().includes(searchLower) ||
      alarm.stage.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative z-20 bg-transparent">
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(e.target.value)}
              className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            >
              <option value="5" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">5</option>
              <option value="8" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">8</option>
              <option value="10" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
            </select>
            <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
              <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">entries</span>
        </div>
        <div className="relative">
          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-4 top-1/2 dark:text-gray-400">
            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill=""></path>
            </svg>
          </span>
          <input
            placeholder="Search..."
            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
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
            {filteredAlarms.slice(0, parseInt(entriesPerPage)).map((alarm) => (
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
                  <div className="w-24 whitespace-nowrap">
                    <Badge
                      size="xs"
                      variant="light"
                      color={getStatusColor(alarm.stage)}
                    >
                      {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
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
