import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ModuleCard } from './components/ModuleCard';
import { ServerStatsSection } from './components/ServerStatsSection';
import { DeploymentLogSection } from './components/DeploymentLogSection';
import { UploadModal } from './components/UploadModal';
import { Toast } from './components/Toast';
import { Download, RefreshCw } from 'lucide-react';

// Pre-packaged realistic deployment logs
const INITIAL_LOGS = [
  {
    id: 'log_api_current',
    moduleId: 'api',
    moduleName: '後臺主程式',
    moduleTag: 'API',
    version: 'v1.8.4',
    operator: 'Auto-CI',
    timestamp: '2023/10/24 15:12',
    status: '進行中',
    details: [
      '[15:12:01] INFO  Auto-CI trigger received for branch "release/v1.8.4"',
      '[15:12:05] INFO  Validating commit checksum SHA: aa345fb21c...',
      '[15:12:12] INFO  Preparing secure Docker runtime sandbox...',
      '[15:12:20] INFO  Downloading external dependencies with npm ci...',
      '[15:12:35] INFO  Compiling fast TypeScript modules to target ESNext...',
      '[15:12:48] INFO  Injecting database configuration endpoints URL...'
    ]
  },
  {
    id: 'log_core_success',
    moduleId: 'core',
    moduleName: '系統主程式',
    moduleTag: 'CORE',
    version: 'v2.1.0',
    operator: 'Admin',
    timestamp: '2023/10/24 14:30',
    status: '成功',
    details: [
      '[14:28:01] INFO  Manual dashboard artifact upload: core-v2.1.0.tar.gz',
      '[14:28:05] INFO  Verifying checksum signature code: SUCCESS',
      '[14:28:15] INFO  Launching production environment environment tests...',
      '[14:28:45] SUCCESS Automated pipeline: 412 system tests compiled and successful.',
      '[14:29:12] INFO  Bundling source package to production image code...',
      '[14:29:45] INFO  Tearing down redundant nodes. Routing traffic to container core-02...',
      '[14:30:00] SUCCESS Rolling health check satisfied (HTTP 200). v2.1.0 in stable state!'
    ]
  },
  {
    id: 'log_core_fail',
    moduleId: 'core_legacy',
    moduleName: '系統主程式',
    moduleTag: 'CORE',
    version: 'v2.0.9',
    operator: 'Admin',
    timestamp: '2023/10/24 10:15',
    status: '失敗',
    details: [
      '[10:12:15] INFO  Manual artifact upload: core-v2.0.9.war',
      '[10:12:30] INFO  Unpacking application package content...',
      '[10:13:02] ERROR [SyntaxError] Unexpected EOF inside config.ts at line 52:12',
      '[10:13:05] ERROR Compiler finished with non-zero exit status -1. Compilation aborted.',
      '[10:13:45] WARNING Rolling back application cluster configurations immediately...',
      '[10:14:12] SUCCESS Microservice restore: legacy image core-v2.0.8 operational.',
      '[10:15:00] FATAL Dashboard flagged this upload execution as FAILED.'
    ]
  }
];

// Helper to compile terminal logs dynamically
function generateLogLines(
  name,
  tag,
  progress,
  version,
  fileName,
  isSuccess = true
) {
  const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
  const lines = [
    `[${timestamp}] INFO  Sandbox container successfully starting compilation for: ${name} (${tag})`,
    `[${timestamp}] INFO  Reading configuration from uploaded target package: ${fileName}`,
    `[${timestamp}] INFO  Running SHA-256 signature verification... OK.`,
  ];

  if (progress >= 20) {
    lines.push(
      `[${timestamp}] INFO  Initializing compiler engine under Node 19-prod sandbox.`,
      `[${timestamp}] INFO  Parsing and reading modular import lines...`
    );
  }
  if (progress >= 50) {
    lines.push(
      `[${timestamp}] INFO  Syntax structural validation complete. Translating components to ES2022...`,
      `[${timestamp}] SUCCESS Minification accomplished. Code Bundle size: 1.62 MB (Compressed: 341 KB)`
    );
  }
  if (progress >= 75) {
    lines.push(
      `[${timestamp}] INFO  Mapping cluster ingress bounds... Assigning static reverse proxy port 3000.`,
      `[${timestamp}] INFO  Triggering automatic pod upgrade: taking down stale containers...`
    );
  }
  if (progress >= 100) {
    if (isSuccess) {
      lines.push(
        `[${timestamp}] SUCCESS DevOps Cluster deployment updated. Current version is now ${version}.`,
        `[${timestamp}] SUCCESS Container rolling microservices healthy. Ingress traffic has been switched.`
      );
    } else {
      lines.push(
        `[${timestamp}] ERROR Fatal compiler issue: ParseException in ModuleController.ts at line 42:15.`,
        `[${timestamp}] ERROR Aborting pipeline. Rolling back deployment cluster to stable configuration legacy image...`,
        `[${timestamp}] SUCCESS Core cluster fallback accomplished. Legacy safe build operational.`
      );
    }
  }

  return lines;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  // Sandbox DevOps States
  const [modules, setModules] = useState(() => {
    const saved = localStorage.getItem('devops_modules');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'core',
        name: '系統主程式',
        tag: 'CORE',
        version: 'v2.1.0',
        status: 'completed',
        progress: 100,
        statusMessage: '已部署完成',
        iconName: 'terminal'
      },
      {
        id: 'api',
        name: '後臺主程式',
        tag: 'API',
        version: 'v1.8.4',
        status: 'deploying',
        progress: 80,
        statusMessage: '編譯解析代碼 (80%)',
        timeRemaining: 45,
        iconName: 'settings_ethernet'
      },
      {
        id: 'frontend',
        name: '後臺介面',
        tag: 'FRONTEND',
        version: 'v1.2.0-beta',
        status: 'queued',
        progress: 45,
        statusMessage: '等待編譯完成',
        iconName: 'dashboard_customize'
      }
    ];
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('devops_logs');
    if (saved) return JSON.parse(saved);
    return INITIAL_LOGS;
  });

  const [stats, setStats] = useState({
    monthlyDeployCount: 1248,
    cpuUsage: 24,
    ramUsage: 68
  });

  // Settings sandbox controls
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('devops_settings');
    if (saved) return JSON.parse(saved);
    return {
      buildSpeed: 'normal',
      errorRate: 10, // 10%
      autoCiMins: 45, // every 45s
      logRetention: 15
    };
  });

  // Dialog / Upload triggers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState('');

  // Notification Toast state
  const [toast, setToast] = useState({
    visible: true,
    title: '執行完畢',
    message: '系統主程式上傳完成',
    type: 'success'
  });

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('devops_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('devops_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('devops_settings', JSON.stringify(settings));
  }, [settings]);

  // Main active deployment scheduler (runs ticks every 1 second to update compiled indicators)
  useEffect(() => {
    const timer = setInterval(() => {
      setModules((prevModules) => {
        let stateChanged = false;

        const next = prevModules.map((m) => {
          if (m.status !== 'deploying') return m;
          stateChanged = true;

          // Compute progress additions by speed settings
          let progressAdd = 8;
          let timeCountDecrease = 2;
          
          if (settings.buildSpeed === 'fast') {
            progressAdd = 20;
            timeCountDecrease = 4;
          } else if (settings.buildSpeed === 'thorough') {
            progressAdd = 3;
            timeCountDecrease = 1;
          }

          const calculatedProgress = Math.min(m.progress + progressAdd, 100);
          const calculatedTimeRemaining = Math.max((m.timeRemaining || 10) - timeCountDecrease, 0);

          if (calculatedProgress >= 100) {
            // Deploy finished! Compares against simulated Error Rate to see if it qualifies
            const rollProbability = Math.random() * 100;
            const isSucc = rollProbability >= settings.errorRate;

            // Update terminal log status to completed or failed
            setLogs((prevLogs) => {
              return prevLogs.map((log) => {
                if (log.moduleId === m.id && log.status === '進行中') {
                  const finalLines = generateLogLines(
                    m.name,
                    m.tag,
                    100,
                    m.version,
                    'build-package-archive.zip',
                    isSucc
                  );
                  return {
                    ...log,
                    status: isSucc ? '成功' : '失敗',
                    details: finalLines
                  };
                }
                return log;
              });
            });

            // Trigger complete/fail toast
            setToast({
              visible: true,
              title: isSucc ? '執行完畢' : '部屬異常',
              message: isSucc ? `${m.name} 最新版本 ${m.version} 部署完成` : `${m.name} 宣告編譯報錯`,
              type: isSucc ? 'success' : 'error'
            });

            // Add success stats count
            if (isSucc) {
              setStats(prev => ({ ...prev, monthlyDeployCount: prev.monthlyDeployCount + 1 }));
            }

            return {
              ...m,
              progress: isSucc ? 100 : 70,
              status: isSucc ? 'completed' : 'failed',
              statusMessage: isSucc ? '已部署完成' : '部署失敗：編譯代碼報警',
              timeRemaining: undefined
            };
          }

          // In-progress: Continuously update active log lines in background log inspector
          setLogs((prevLogs) => {
            return prevLogs.map((log) => {
              if (log.moduleId === m.id && log.status === '進行中') {
                return {
                  ...log,
                  details: generateLogLines(
                    m.name,
                    m.tag,
                    calculatedProgress,
                    m.version,
                    'build-package-archive.zip',
                    true
                  )
                };
              }
              return log;
            });
          });

          return {
            ...m,
            progress: calculatedProgress,
            statusMessage: `編譯解析代碼 (${calculatedProgress}%)`,
            timeRemaining: calculatedTimeRemaining
          };
        });

        return next;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [settings]);

  // Automated Background Auto-CI Scheduler
  useEffect(() => {
    const ciTimer = setInterval(() => {
      // Pick a non-deploying module to automatically simulate a background trigger
      const availableModules = modules.filter(m => m.status !== 'deploying');
      if (availableModules.length === 0) return;

      const randomModule = availableModules[Math.floor(Math.random() * availableModules.length)];
      
      // Upgrade semantic patch
      const parts = randomModule.version.replace('v', '').split('.');
      let nextVer = randomModule.version + '.1';
      if (parts.length === 3) {
        const patchNum = parseInt(parts[2], 10);
        if (!isNaN(patchNum)) {
          parts[2] = String(patchNum + 1);
          nextVer = `v${parts.join('.')}`;
        }
      }

      triggerDeploy(randomModule.id, nextVer, 'CI Trigger automatic build', 'auto-ci-pipeline-artifact.zip');
    }, settings.autoCiMins * 1000);

    return () => clearInterval(ciTimer);
  }, [modules, settings.autoCiMins]);

  // Handle new manual trigger deployment
  const triggerDeploy = (moduleId, newVersion, changelog, fileName) => {
    const moduleItem = modules.find(m => m.id === moduleId);
    if (!moduleItem) return;

    // Create a new Deploy Log and put inside deployment log lists, marked "進行中"
    const timestampStr = new Date().toLocaleDateString('zh-TW') + ' ' + new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newLogId = `log_${Date.now()}`;
    const newLog = {
      id: newLogId,
      moduleId,
      moduleName: moduleItem.name,
      moduleTag: moduleItem.tag,
      version: newVersion,
      operator: 'Admin',
      timestamp: timestampStr,
      status: '進行中',
      details: generateLogLines(moduleItem.name, moduleItem.tag, 5, newVersion, fileName, true)
    };

    setLogs(prev => [newLog, ...prev.slice(0, settings.logRetention - 1)]);

    // Update targeting state status
    setModules(prev => prev.map((m) => {
      if (m.id === moduleId) {
        return {
          ...m,
          version: newVersion,
          status: 'deploying',
          progress: 5,
          statusMessage: '初始化容器編譯 (5%)',
          timeRemaining: settings.buildSpeed === 'fast' ? 12 : settings.buildSpeed === 'thorough' ? 90 : 45
        };
      }
      return m;
    }));

    // Alert info
    setToast({
      visible: true,
      title: '部署排程觸發',
      message: `${moduleItem.name} ${newVersion} 正與編譯隔離區建立連線`,
      type: 'info'
    });
  };

  const handleOpenUploadFor = (moduleId) => {
    setUploadTargetId(moduleId);
    setIsUploadOpen(true);
  };

  const handleOpenGeneralNewVersion = () => {
    setUploadTargetId('');
    setIsUploadOpen(true);
  };

  // Direct export JSON configurations in audit-ready compliant form
  const exportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devops_deployment_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToast({
      visible: true,
      title: '日誌匯出完成',
      message: '系統已自動封包並下載 JSON 歷史部署日誌',
      type: 'success'
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex">
      {/* Structural Sidebar Panel */}
      <Sidebar
        onNewVersionClick={handleOpenGeneralNewVersion}
      />

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          title="版本部屬中心"
        />

        <main className="ml-[260px] p-8 flex-1">
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-blue-600 font-bold mb-1">
                  Overview
                </p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  系統模組狀態
                </h3>
              </div>
              <div className="flex gap-2">

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
              {modules
                .filter((m) =>
                  m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onUploadClick={handleOpenUploadFor}
                  />
                ))}
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-12 flex flex-col">
                <DeploymentLogSection
                  logs={logs}
                  filterQuery={searchQuery}
                />
              </div>

            </section>
          </div>
        </main>
      </div>

      {/* Interactive Upload packages drawer */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        modules={modules}
        initialModuleId={uploadTargetId}
        onDeploy={triggerDeploy}
      />

      {/* Shared alert popups with standard animation triggers */}
      <Toast
        isVisible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
