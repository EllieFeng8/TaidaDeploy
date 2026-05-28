import React from 'react';
import { Upload, Terminal, Network, LayoutGrid, Database, Server, Clock, AlertTriangle } from 'lucide-react';

export const ModuleCard = ({ module, onUploadClick }) => {
  // Map string iconName to Lucide components
  const getIcon = (name) => {
    switch (name) {
      case 'terminal':
        return <Terminal className="w-5 h-5 text-blue-600" />;
      case 'settings_ethernet':
        return <Network className="w-5 h-5 text-blue-600" />;
      case 'dashboard_customize':
        return <LayoutGrid className="w-5 h-5 text-blue-600" />;
      case 'database':
        return <Database className="w-5 h-5 text-blue-600" />;
      default:
        return <Server className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          barBg: 'bg-emerald-500',
          textMsg: 'text-emerald-700',
          wrapperBorder: 'hover:border-emerald-500 hover:shadow-emerald-50',
          progressText: 'text-emerald-600',
        };
      case 'deploying':
        return {
          barBg: 'bg-blue-600 shimmer',
          textMsg: 'text-blue-700',
          wrapperBorder: 'border-blue-500 shadow-blue-50/50 ring-2 ring-blue-500/10',
          progressText: 'text-blue-600',
        };
      case 'failed':
        return {
          barBg: 'bg-rose-500',
          textMsg: 'text-rose-700',
          wrapperBorder: 'hover:border-rose-500 hover:shadow-rose-50',
          progressText: 'text-rose-600',
        };
      case 'queued':
      default:
        return {
          barBg: 'bg-slate-400',
          textMsg: 'text-slate-500',
          wrapperBorder: 'hover:border-slate-400 hover:shadow-slate-50',
          progressText: 'text-slate-500',
        };
    }
  };

  const style = getStatusStyle(module.status);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xs transition-all duration-300 group flex flex-col justify-between min-h-[290px] ${style.wrapperBorder}`}>
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="min-w-0">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-2 inline-block">
              {module.tag}
            </span>
            <h4 className="font-sans font-bold text-slate-800 text-base truncate">
              {module.name}
            </h4>
            <p className="font-mono text-xs text-slate-500 mt-1">
              Version: {module.version}
            </p>
          </div>
          <div className="bg-blue-50/80 p-2.5 rounded-lg shrink-0">
            {getIcon(module.iconName)}
          </div>
        </div>

        {/* Progress Container */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-sans text-xs text-slate-500 font-semibold">
              {module.status === 'deploying'
                ? '正在更新中...'
                : module.status === 'queued'
                ? '佇列中'
                : module.status === 'failed'
                ? '部署失敗'
                : '目前進度'}
            </span>
            <span className={`font-mono text-xs font-bold ${style.progressText}`}>
              {Math.round(module.progress)}%
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${style.barBg}`}
              style={{ width: `${module.progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center mt-2.5">
            <div className="flex items-center gap-1">
              {module.status === 'deploying' && (
                <Clock className="w-3 h-3 text-blue-600 animate-spin" />
              )}
              {module.status === 'failed' && (
                <AlertTriangle className="w-3 h-3 text-rose-500" />
              )}
              <span className={`font-sans text-[11px] font-semibold ${style.textMsg}`}>
                {module.statusMessage}
              </span>
            </div>
            {module.status === 'deploying' && typeof module.timeRemaining === 'number' && (
              <span className="font-mono text-[10px] text-slate-400">
                預計剩餘 {module.timeRemaining} 秒
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Button footer */}
      <button
        onClick={() => onUploadClick(module.id)}
        disabled={module.status === 'deploying'}
        className={`w-full py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-sans text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-sm hover:shadow-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
          module.status === 'deploying' ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 hover:bg-transparent hover:text-slate-400' : ''
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        上傳新版本
      </button>
    </div>
  );
}
