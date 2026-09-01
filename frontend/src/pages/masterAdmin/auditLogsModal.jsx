// components/AuditLogsModal.jsx
import { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../config/api';

export function AuditLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [actorName, setActorName] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (actorName) params.append('actor_name', actorName);
      if (action) params.append('action', action);
      if (entityType) params.append('entity_type', entityType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_BASE}/dashboard/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
    fetchLogs();
  }, [actorName, action, entityType, startDate, endDate]);

  // Fetch logs when offset changes
  useEffect(() => {
    if (offset > 0) {
      fetchLogs();
    }
  }, [offset]);

  // Handle pagination
  const nextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  const prevPage = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActorName('');
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setOffset(0);
  };

  // Format date using native JavaScript
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('login')) return 'bg-purple-100 text-purple-800';
    if (actionLower.includes('logout')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-[#1E1B4B]">Audit Logs</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Filter by actor name..."
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Filter by action..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Filter by entity type..."
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchLogs}
                className="flex-1 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-md transition-colors flex items-center justify-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#4F4679]">Loading...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#4F4679]">No audit logs found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">Actor</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">Action</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">Entity Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">Message</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#4F4679]">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#1E1B4B]">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1E1B4B]">
                        {log.actor_name || 'System'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4F4679]">
                        {log.entity_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4F4679] max-w-xs truncate">
                        {log.message || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4F4679]">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-[#4F4679]">
            Showing {logs.length > 0 ? offset + 1 : 0} - {offset + logs.length} of {total} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={offset === 0}
              className={`px-4 py-2 border border-gray-300 rounded-md transition-colors ${
                offset === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1 inline" />
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={!hasMore}
              className={`px-4 py-2 border border-gray-300 rounded-md transition-colors ${
                !hasMore 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1 inline" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsModal;