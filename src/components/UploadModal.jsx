import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

export function UploadModal({ isOpen, onClose, modules, initialModuleId = '', onDeploy }) {
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId || (modules[0]?.id || ''));
  const [newVersion, setNewVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Set default version string when module selection changes
  React.useEffect(() => {
    if (isOpen) {
      const selected = modules.find(m => m.id === selectedModuleId);
      if (selected) {
        // Suggest increment
        const parts = selected.version.replace('v', '').split('.');
        if (parts.length === 3) {
          const patch = parseInt(parts[2], 10);
          if (!isNaN(patch)) {
            parts[2] = String(patch + 1);
            setNewVersion(`v${parts.join('.')}`);
          } else {
            setNewVersion(selected.version + '-patch');
          }
        } else {
          setNewVersion(selected.version + '.1');
        }
      }
      setErrorMsg('');
      setUploadedFile(null);
      setChangelog('');
    }
  }, [selectedModuleId, isOpen, modules]);

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
    }
  };

  // Handle Manual Selection
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newVersion.trim()) {
      setErrorMsg('請輸入版本號');
      return;
    }
    if (!newVersion.startsWith('v')) {
      setErrorMsg('版本號格式不正確（必須以 v 開頭，例如 v2.1.1）');
      return;
    }
    if (!uploadedFile) {
      setErrorMsg('請上傳部署包 (.zip, .tar.gz, .war)');
      return;
    }

    onDeploy(selectedModuleId, newVersion, changelog || '無說明', uploadedFile.name);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-xs"
          ></motion.div>

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[540px] bg-white rounded-xl shadow-2xl z-50 border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-sans font-bold text-slate-800 text-lg">
                部署新程式版本
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-xs text-rose-700 font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Module selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                  選擇模組標的
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-sans text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tag}) - 目前: {m.version}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version & Changelog row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                    新版本號碼 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="例如 v2.1.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">請遵循 Semantic Version 建議</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                    部署修訂說明
                  </label>
                  <input
                    type="text"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="例如 修正 REST API 路由效能"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Custom File dropper conforming strictly to our guidelines */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                  上傳版本包 (.zip, .war, .tar.gz) <span className="text-rose-500">*</span>
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/40' 
                      : uploadedFile 
                        ? 'border-emerald-500 bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-blue-400 bg-slate-50'
                  }`}
                  onClick={onButtonClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".zip,.war,.gz,.tar"
                    onChange={handleChange}
                  />

                  {uploadedFile ? (
                    <motion.div 
                      initial={{ scale: 0.9 }} 
                      animate={{ scale: 1 }} 
                      className="text-center"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[320px] mb-1">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Math.round(uploadedFile.size / 1024)} KB - 拖曳或點選以覆蓋
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        拖曳檔案到此處，或點選上傳
                      </p>
                      <p className="text-xs text-slate-400">
                        支援 ZIP, WAR 格式，大小限制 100MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-sans font-medium hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-sm font-sans font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-blue-200"
                >
                  <FileCode className="w-4 h-4" />
                  開始部屬
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
