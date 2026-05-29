import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ModuleCard } from './components/ModuleCard';
import { DeploymentLogSection } from './components/DeploymentLogSection';
import { UploadModal } from './components/UploadModal';
import { Toast } from './components/Toast';
import {
  createDeployTask,
  getDeployConsole,
  getRuntimeVersions,
  getVersionByDeployId,
  listDeployLogs,
  listVersions,
  startDeploy,
  startQtApp,
  stopQtApp,
} from './api/deployApi';

const MODULE_CATALOG = [
  { id: 'QT_APP', name: 'QT主程式', tag: 'QT_APP', apiType: 'QT_APP', iconName: 'terminal' },
  { id: 'HTML', name: 'UI_HTML', tag: 'HTML', apiType: 'UI_HTML', iconName: 'settings_ethernet' },
  { id: 'BACKEND', name: 'BACKEND_JAR', tag: 'BACKEND', apiType: 'BACKEND_JAR', iconName: 'dashboard_customize' },
];

const API_LOG_TYPES = ['QT_APP', 'UI_HTML', 'BACKEND_JAR'];

function formatTimestamp(value) {
  if (!value) return '未提供時間';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('zh-TW')} ${date.toLocaleTimeString('zh-TW', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
}

function getModuleById(moduleId) {
  return MODULE_CATALOG.find((module) => module.id === moduleId);
}

function getModuleByApiType(apiType) {
  return MODULE_CATALOG.find((module) => module.apiType === apiType);
}

function normalizeConsoleLines(payload) {
  const items = Array.isArray(payload) ? payload : [];
  const lines = items.map((item, index) => ({
    sequence: typeof item.sequence === 'number' ? item.sequence : index + 1,
    text: item.line || item.message || item.content || '',
    timestamp: item.timestamp || item.createdTime || '',
  }));
  const maxSequence = lines.reduce((max, item) => Math.max(max, item.sequence), 0);
  return {
    lines,
    details: lines.map((item) => `[${formatTimestamp(item.timestamp)}] ${item.text}`),
    nextSequence: maxSequence > 0 ? maxSequence + 1 : 1,
  };
}

function normalizeLogSummaries(type, payload) {
  const moduleMeta = getModuleByApiType(type);
  const items = Array.isArray(payload) ? payload : [];

  return items.map((item) => ({
    id: item.deployId || `${type}-${item.fileName || item.createdTime || Math.random()}`,
    deployId: item.deployId || '',
    moduleId: moduleMeta?.id || type,
    moduleName: moduleMeta?.name || type,
    moduleTag: moduleMeta?.tag || type,
    version: item.version || item.fileName || item.deployId || '待偵測',
    operator: 'Deploy API',
    timestamp: formatTimestamp(item.createdTime || item.detectedAt),
    createdAt: item.createdTime || item.detectedAt || '',
    status: '成功',
    details: [],
    nextSequence: 1,
  }));
}

function normalizeVersionEntries(payload) {
  return Array.isArray(payload) ? payload : [];
}

function normalizeRuntimeMap(payload) {
  return {
    QT_APP: payload?.qtApp || null,
    BACKEND_JAR: payload?.backendJar || null,
  };
}

function buildModules(previousModules, versionEntries, runtimeMap, logs, activeStreams) {
  return MODULE_CATALOG.map((moduleMeta) => {
    const previous = previousModules.find((module) => module.id === moduleMeta.id) || {};
    const latestVersion = versionEntries.find((item) => item.type === moduleMeta.apiType);
    const latestLog = logs.find((log) => log.moduleId === moduleMeta.id);
    const runtimeEntry = runtimeMap[moduleMeta.apiType];
    const isDeploying = Object.values(activeStreams).some((stream) => stream.moduleId === moduleMeta.id);

    let status = 'queued';
    let progress = 0;
    let statusMessage = '尚未偵測到部署資訊';

    if (isDeploying) {
      status = 'deploying';
      progress = 45;
      statusMessage = '部署進行中，持續同步 console';
    } else if (latestLog?.status === '失敗') {
      status = 'failed';
      progress = 100;
      statusMessage = '最近一次部署失敗';
    } else if (latestVersion || runtimeEntry?.available || latestLog) {
      status = 'completed';
      progress = 100;
      if (runtimeEntry?.available) {
        statusMessage = `Runtime 已同步${runtimeEntry.version ? ` (${runtimeEntry.version})` : ''}`;
      } else if (latestVersion?.version) {
        statusMessage = `已偵測版本 ${latestVersion.version}`;
      } else {
        statusMessage = '已取得部署紀錄';
      }
    }

    return {
      ...previous,
      id: moduleMeta.id,
      name: moduleMeta.name,
      tag: moduleMeta.tag,
      apiType: moduleMeta.apiType,
      iconName: moduleMeta.iconName,
      version: latestVersion?.version || runtimeEntry?.version || previous.version || '待偵測',
      deployId: runtimeEntry?.deployId || latestVersion?.deployId || latestLog?.deployId || previous.deployId || '',
      status,
      progress,
      statusMessage,
      runtimeAvailable: Boolean(runtimeEntry?.available),
      runtimeError: runtimeEntry?.error || '',
    };
  });
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modules, setModules] = useState(() =>
    MODULE_CATALOG.map((module) => ({
      ...module,
      version: '待偵測',
      progress: 0,
      status: 'queued',
      statusMessage: '等待與部署伺服器同步',
      deployId: '',
    }))
  );
  const [logs, setLogs] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState('');
  const [creatingTaskModuleId, setCreatingTaskModuleId] = useState('');
  const [activeDeployTask, setActiveDeployTask] = useState(null);
  const [isSubmittingDeploy, setIsSubmittingDeploy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qtActionModuleId, setQtActionModuleId] = useState('');
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });
  const [activeStreams, setActiveStreams] = useState({});

  const logsRef = useRef(logs);
  const modulesRef = useRef(modules);
  const activeStreamsRef = useRef(activeStreams);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);

  useEffect(() => {
    activeStreamsRef.current = activeStreams;
  }, [activeStreams]);

  const showToast = useCallback((title, message, type = 'success') => {
    setToast({
      visible: true,
      title,
      message,
      type,
    });
  }, []);

  const refreshDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsRefreshing(true);
    }

    try {
      const [versionsPayload, runtimePayload, ...logPayloads] = await Promise.all([
        listVersions(),
        getRuntimeVersions(),
        ...API_LOG_TYPES.map((type) => listDeployLogs(type).catch(() => [])),
      ]);

      const versionEntries = normalizeVersionEntries(versionsPayload).sort(
        (a, b) => new Date(b.detectedAt || 0).getTime() - new Date(a.detectedAt || 0).getTime()
      );
      const runtimeMap = normalizeRuntimeMap(runtimePayload);

      const remoteLogs = API_LOG_TYPES.flatMap((type, index) => normalizeLogSummaries(type, logPayloads[index]))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      let mergedLogsSnapshot = [];
      setLogs((previousLogs) => {
        const previousMap = new Map(previousLogs.map((log) => [log.deployId || log.id, log]));
        const mergedLogs = remoteLogs.map((log) => {
          const previous = previousMap.get(log.deployId || log.id);
          const stream = activeStreamsRef.current[log.deployId];
          return {
            ...log,
            details: previous?.details || [],
            nextSequence: previous?.nextSequence || 1,
            status: stream ? '進行中' : previous?.status || log.status,
            version: previous?.version && previous.version !== '待偵測' ? previous.version : log.version,
          };
        });

        const localOnlyLogs = previousLogs.filter(
          (log) => !mergedLogs.some((remoteLog) => remoteLog.deployId && remoteLog.deployId === log.deployId)
        );

        mergedLogsSnapshot = [...localOnlyLogs, ...mergedLogs].sort(
          (a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime()
        );
        return mergedLogsSnapshot;
      });

      setModules((previousModules) =>
        buildModules(previousModules, versionEntries, runtimeMap, mergedLogsSnapshot, activeStreamsRef.current)
      );
    } catch (error) {
      showToast('同步失敗', error.message || '無法讀取部署伺服器資料', 'error');
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    refreshDashboard();
    const timer = setInterval(() => {
      refreshDashboard(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [refreshDashboard]);

  useEffect(() => {
    const deployIds = Object.keys(activeStreams);
    if (deployIds.length === 0) return undefined;

    const timer = setInterval(async () => {
      const streamEntries = Object.entries(activeStreamsRef.current);
      if (streamEntries.length === 0) return;

      const results = await Promise.all(
        streamEntries.map(async ([deployId, stream]) => {
          try {
            const payload = await getDeployConsole(deployId, stream.nextSequence);
            return { deployId, stream, ...normalizeConsoleLines(payload) };
          } catch (error) {
            return { deployId, error };
          }
        })
      );

      setLogs((previousLogs) =>
        previousLogs.map((log) => {
          const result = results.find((item) => item.deployId === log.deployId);
          if (!result || result.error || result.details.length === 0) return log;
          return {
            ...log,
            details: [...log.details, ...result.details],
            nextSequence: result.nextSequence,
            status: '進行中',
          };
        })
      );

      setActiveStreams((previousStreams) => {
        const nextStreams = { ...previousStreams };

        results.forEach((result) => {
          const currentStream = nextStreams[result.deployId];
          if (!currentStream) return;

          if (result.error) {
            delete nextStreams[result.deployId];
            setLogs((previousLogs) =>
              previousLogs.map((log) =>
                log.deployId === result.deployId ? { ...log, status: '失敗' } : log
              )
            );
            return;
          }

          if (result.details.length > 0) {
            nextStreams[result.deployId] = {
              ...currentStream,
              nextSequence: result.nextSequence,
              idleCount: 0,
            };
            return;
          }

          const idleCount = (currentStream.idleCount || 0) + 1;
          if (idleCount >= 3) {
            delete nextStreams[result.deployId];
            setLogs((previousLogs) =>
              previousLogs.map((log) =>
                log.deployId === result.deployId && log.status === '進行中'
                  ? { ...log, status: '成功' }
                  : log
              )
            );
          } else {
            nextStreams[result.deployId] = {
              ...currentStream,
              idleCount,
            };
          }
        });

        return nextStreams;
      });

      await refreshDashboard(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeStreams, refreshDashboard]);

  const handleOpenUploadFor = async (moduleId) => {
    const moduleItem = modulesRef.current.find((module) => module.id === moduleId);
    if (!moduleItem) return;

    setCreatingTaskModuleId(moduleId);
    try {
      const task = await createDeployTask(moduleItem.apiType);
      setActiveDeployTask({
        deployId: task.deployId,
        moduleId,
        type: moduleItem.apiType,
      });
      setUploadTargetId(moduleId);
      setIsUploadOpen(true);
    } catch (error) {
      showToast('建立任務失敗', error.message || '無法建立部署任務', 'error');
    } finally {
      setCreatingTaskModuleId('');
    }
  };

  const handleSubmitDeploy = async ({ moduleId, deployId, type, file, fields }) => {
    const moduleItem = modulesRef.current.find((module) => module.id === moduleId);
    if (!moduleItem) {
      throw new Error('找不到部署模組');
    }

    setIsSubmittingDeploy(true);

    try {
      await startDeploy(deployId, file, fields);

      const localLog = {
        id: deployId,
        deployId,
        moduleId,
        moduleName: moduleItem.name,
        moduleTag: moduleItem.tag,
        version: deployId,
        operator: 'Deploy API',
        timestamp: formatTimestamp(new Date().toISOString()),
        createdAt: new Date().toISOString(),
        status: '進行中',
        details: [],
        nextSequence: 1,
      };

      setLogs((previousLogs) => [localLog, ...previousLogs.filter((log) => log.deployId !== deployId)]);
      setActiveStreams((previousStreams) => ({
        ...previousStreams,
        [deployId]: {
          moduleId,
          type,
          nextSequence: 1,
          idleCount: 0,
        },
      }));

      setModules((previousModules) =>
        previousModules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                deployId,
                status: 'deploying',
                progress: 35,
                statusMessage: '已送出部署，等待 console 回傳',
              }
            : module
        )
      );

      try {
        const versionInfo = await getVersionByDeployId(deployId);
        if (versionInfo?.version) {
          setLogs((previousLogs) =>
            previousLogs.map((log) =>
              log.deployId === deployId ? { ...log, version: versionInfo.version } : log
            )
          );
        }
      } catch (error) {
        // Some deploy types return 400 before the backend detects version info.
      }

      showToast('部署已啟動', `${moduleItem.name} 任務 ${deployId} 已開始`, 'success');
      await refreshDashboard(false);
    } catch (error) {
      showToast('部署失敗', error.message || '無法啟動部署', 'error');
      throw error;
    } finally {
      setIsSubmittingDeploy(false);
      setActiveDeployTask(null);
    }
  };

  const handleToggleLog = async (log) => {
    if (!log.deployId) return;
    try {
      const payload = await getDeployConsole(log.deployId);
      const normalized = normalizeConsoleLines(payload);
      setLogs((previousLogs) =>
        previousLogs.map((item) =>
          item.deployId === log.deployId
            ? {
                ...item,
                details: normalized.details,
                nextSequence: normalized.nextSequence,
              }
            : item
        )
      );
    } catch (error) {
      showToast('讀取 Console 失敗', error.message || `無法讀取 ${log.deployId}`, 'error');
    }
  };

  const handleQtControl = async (module, action) => {
    if (!module.deployId) {
      showToast('操作失敗', '目前沒有可操作的 deployId', 'error');
      return;
    }

    setQtActionModuleId(module.id);
    try {
      const response = action === 'start' ? await startQtApp(module.deployId) : await stopQtApp(module.deployId);
      showToast(action === 'start' ? 'Qt 已啟動' : 'Qt 已關閉', response.message || module.deployId, 'success');
      await refreshDashboard(false);
    } catch (error) {
      showToast('Qt 操作失敗', error.message || '無法更新 Qt 執行狀態', 'error');
    } finally {
      setQtActionModuleId('');
    }
  };

  const exportLogs = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(logs, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devops_deployment_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('日誌匯出完成', '已下載目前部署日誌 JSON', 'success');
  };

  const visibleModules = useMemo(
    () =>
      modules.filter(
        (module) =>
          module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.tag.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [modules, searchQuery]
  );

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="版本部屬中心" />

        <main className="ml-[260px] p-8 flex-1">
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-blue-600 font-bold mb-1">
                  Overview
                </p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">系統模組狀態</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => refreshDashboard()}
                  disabled={isRefreshing}
                  className={`flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    isRefreshing ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  重新整理
                </button>
                <button
                  onClick={exportLogs}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-200/60 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出日誌
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onUploadClick={handleOpenUploadFor}
                  isCreatingTask={creatingTaskModuleId === module.id}
                  onQtStart={(item) => handleQtControl(item, 'start')}
                  onQtStop={(item) => handleQtControl(item, 'stop')}
                  isQtActionLoading={qtActionModuleId === module.id}
                />
              ))}
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-12 flex flex-col">
                <DeploymentLogSection logs={logs} filterQuery={searchQuery} onToggleLog={handleToggleLog} />
              </div>
            </section>
          </div>
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setActiveDeployTask(null);
        }}
        modules={modules}
        initialModuleId={uploadTargetId}
        deployTask={activeDeployTask}
        onDeploy={handleSubmitDeploy}
        isSubmitting={isSubmittingDeploy}
      />

      <Toast
        isVisible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((previous) => ({ ...previous, visible: false }))}
      />
    </div>
  );
}
