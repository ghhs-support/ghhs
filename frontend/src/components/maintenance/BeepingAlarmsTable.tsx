import { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BeepingAlarm } from "../../types/maintenance";

export default function BeepingAlarmsTable() {
  const { authenticatedGet } = useAuthenticatedApi();
  const [beepingAlarms, setBeepingAlarms] = useState<BeepingAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        const data = await authenticatedGet('/beeping_alarms');
        setBeepingAlarms(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching alarms:', err);
        setError('Failed to load alarms');
      } finally {
        setLoading(false);
      }
    };

    fetchAlarms();
  }, [authenticatedGet]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge size="sm" color="success">Active</Badge>;
      case 'pending':
        return <Badge size="sm" color="warning">Pending</Badge>;
      case 'resolved':
        return <Badge size="sm" color="info">Resolved</Badge>;
      default:
        return <Badge size="sm" color="error">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading alarms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Description
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created At
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Updated At
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {beepingAlarms.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-gray-500">
                  No beeping alarms found
                </TableCell>
              </TableRow>
            ) : (
              beepingAlarms.map((alarm) => (
                <TableRow key={alarm.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {alarm.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {alarm.description}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {getStatusBadge(alarm.status || 'Unknown')}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {new Date(alarm.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {new Date(alarm.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
