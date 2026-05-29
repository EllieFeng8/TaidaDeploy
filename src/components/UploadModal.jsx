import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

const DEFAULT_QT_FORM = {
  exeName: 'TaidaApp.exe',
  startupExeName: 'TaidaApp.exe',
};

const DEFAULT_BACKEND_FORM = {
  serviceName: 'FanProj',
  port: '8079',
};

export function UploadModal({
  isOpen,
  onClose,
  modules,
  initialModuleId = '',
  deployTask,
  onDeploy,
  isSubmitting = false,
}) {
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId || (modules[0]?.id || ''));
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [qtForm, setQtForm] = useState(DEFAULT_QT_FORM);
  const [backendForm, setBackendForm] = useState(DEFAULT_BACKEND_FORM);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedModuleId(initialModuleId || (modules[0]?.id || ''));
      setErrorMsg('');
      setUploadedFile(null);
      setQtForm(DEFAULT_QT_FORM);
      setBackendForm(DEFAULT_BACKEND_FORM);
    }
  }, [initialModuleId, isOpen, modules]);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const selectedType = deployTask?.type || selectedModule?.apiType;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getSubmitFields = () => {
    if (selectedType === 'QT_APP') {
      return qtForm;
    }
    if (selectedType === 'BACKEND_JAR') {
      return backendForm;
    }
    return {};
  };

  const validate = () => {
    if (!uploadedFile) {
      return '請上傳部署包 (.zip, .tar.gz, .war)';
    }
    if (!selectedModule || !deployTask?.deployId) {
      return '部署任務尚未建立完成';
    }
    if (selectedType === 'QT_APP' && (!qtForm.exeName.trim() || !qtForm.startupExeName.trim())) {
      return '請填寫 Qt 執行檔名稱';
    }
    if (selectedType === 'BACKEND_JAR' && (!backendForm.serviceName.trim() || !backendForm.port.trim())) {
      return '請填寫服務名稱與埠號';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setErrorMsg('');
      await onDeploy({
        moduleId: selectedModuleId,
        deployId: deployTask.deployId,
        type: selectedType,
        file: uploadedFile,
        fields: getSubmitFields(),
      });
      onClose();
    } catch (error) {
      setErrorMsg(error.message || '部署失敗');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-x-4 top-[8%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] bg-white rounded-xl shadow-2xl z-50 border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-sans font-bold text-slate-800 text-lg">部署新程式版本</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-xs text-rose-700 font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                    模組標的
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700">
                    {selectedModule ? `${selectedModule.name} (${selectedModule.tag})` : '未指定模組'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                    Deploy ID
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-700">
                    {deployTask?.deployId || '建立中'}
                  </div>
                </div>
              </div>

              {selectedType === 'QT_APP' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                      EXE Name
                    </label>
                    <input
                      type="text"
                      value={qtForm.exeName}
                      onChange={(e) => setQtForm((prev) => ({ ...prev, exeName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                      Startup EXE Name
                    </label>
                    <input
                      type="text"
                      value={qtForm.startupExeName}
                      onChange={(e) => setQtForm((prev) => ({ ...prev, startupExeName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'BACKEND_JAR' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                      Service Name
                    </label>
                    <input
                      type="text"
                      value={backendForm.serviceName}
                      onChange={(e) => setBackendForm((prev) => ({ ...prev, serviceName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">
                      Port
                    </label>
                    <input
                      type="text"
                      value={backendForm.port}
                      onChange={(e) => setBackendForm((prev) => ({ ...prev, port: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

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
                    accept=".zip,.war,.gz,.tar,.jar"
                    onChange={handleFileChange}
                  />

                  {uploadedFile ? (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
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
                      <p className="text-sm font-semibold text-slate-700 mb-1">拖曳檔案到此處，或點選上傳</p>
                      <p className="text-xs text-slate-400">支援 ZIP, WAR, JAR, TAR.GZ 格式</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-blue-200 ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  {isSubmitting ? '部署中' : '開始部屬'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
