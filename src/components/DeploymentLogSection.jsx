import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RefreshCw, XCircle, ChevronDown, ChevronUp, Terminal, Filter } from 'lucide-react';

export function DeploymentLogSection({ logs, onViewAllClick, filterQuery = '', isFullHistoryView = false }) {
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const toggleLogDetails = (id) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  // Status mapping colors & icons
  const getLogStatusStyle = (status) => {
    switch (status) {
      case '成功':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
          bg: 'bg-white',
          opacity: 'opacity-100',
        };
      case '進行中':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />,
          badge: 'bg-blue-50 text-blue-700 border-blue-200/50',
          bg: 'bg-blue-50/10 border-blue-100',
          opacity: 'opacity-100',
        };
      case '失敗':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          badge: 'bg-rose-50 text-rose-700 border-rose-200/50',
          bg: 'bg-rose-50/5',
          opacity: 'opacity-70',
        };
    }
  };

  // Filter logs by search query (name status version) + tags + static categories
  const filteredLogs = logs.filter((log) => {
    // Search query
    const matchSearch = filterQuery
      ? log.moduleName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        log.moduleTag.toLowerCase().includes(filterQuery.toLowerCase()) ||
        log.version.toLowerCase().includes(filterQuery.toLowerCase()) ||
        log.operator.toLowerCase().includes(filterQuery.toLowerCase())
      : true;

    // Filter by dropdown status
    const matchStatus = statusFilter === 'all' ? true : log.status === statusFilter;

    // Filter by dropdown module
    const matchModule = moduleFilter === 'all' ? true : log.moduleTag === moduleFilter;

    return matchSearch && matchStatus && matchModule;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex-1">
      {/* Header Container */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h5 className="font-sans font-bold text-slate-800 text-base">
            {isFullHistoryView ? '全部部署歷史記錄' : '最近部署記錄'}
          </h5>
          {isFullHistoryView && (
            <p className="text-xs text-slate-500 mt-1">
              展示專案所有手動或自動化部署管線日誌與記錄
            </p>
          )}
        </div>
        {!isFullHistoryView && onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-blue-600 hover:text-blue-700 font-sans text-xs font-bold hover:underline cursor-pointer"
          >
            查看全部
          </button>
        )}
      </div>

      {/* Toolbar for Filters in Full History View */}
      {isFullHistoryView && (
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100 mb-6 text-sm">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-xs uppercase tracking-wider">進階過濾:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">部署狀態:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 cursor-pointer"
            >
              <option value="all">所有狀態</option>
              <option value="成功">成功</option>
              <option value="進行中">進行中</option>
              <option value="失敗">失敗</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">服務模組:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 cursor-pointer"
            >
              <option value="all">所有模組</option>
              <option value="CORE">CORE (系統主程式)</option>
              <option value="API">API (後臺主程式)</option>
              <option value="FRONTEND">FRONTEND (後臺介面)</option>
              <option value="DATABASE">DATABASE (資料庫儲存)</option>
            </select>
          </div>

          {(statusFilter !== 'all' || moduleFilter !== 'all') && (
            <button
              onClick={() => { setStatusFilter('all'); setModuleFilter('all'); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer ml-auto"
            >
              重置篩選
            </button>
          )}
        </div>
      )}

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Terminal className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-sans">無相符的部署日誌記錄</p>
          <p className="text-xs text-slate-400 mt-1">請調整搜尋字詞或過濾選項</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredLogs.map((log) => {
            const style = getLogStatusStyle(log.status);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 ${style.bg} ${style.opacity}`}
              >
                {/* Collapsible Trigger block */}
                <button
                  onClick={() => toggleLogDetails(log.id)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/70 text-left transition-colors font-sans"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {style.icon}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {log.moduleName} <span className="font-mono text-xs text-slate-500 font-normal">({log.moduleTag})</span> {log.version}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        由 {log.operator} 部署 · 於 {log.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 border text-xs font-semibold rounded-full ${style.badge}`}>
                      {log.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Simulated Built Terminal logs drawer */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="border-t border-slate-100 bg-slate-900 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-sans">
                            <Terminal className="w-3.5 h-3.5" />
                            Build Pipeline Terminal Logs (伺服器部屬終端)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 select-none">
                            online • running
                          </span>
                        </div>
                        <div className="bg-slate-950 font-mono text-xs text-emerald-400 rounded-lg p-3.5 border border-slate-800 leading-6 max-h-72 overflow-y-auto overflow-x-auto shadow-inner select-text">
                          {log.details && log.details.length > 0 ? (
                            log.details.map((detailLine, index) => (
                              <div key={index} className="hover:bg-slate-900/40 px-1 py-0.5 rounded transition-colors whitespace-pre-wrap">
                                {detailLine}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">
                              [SYS INFO] 無主動日誌可用，這可能是因為程式從備份部署。
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
