import React, { useState } from 'react';
import { Search, Bell, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Header({ searchQuery, setSearchQuery, title }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [notifications, setNotifications] = useState([
    { id: '1', title: '後臺主程式 v1.8.4 部署作業已觸發', time: '剛剛', read: false },
    { id: '2', title: '系統主程式 v2.1.0 已完成部署', time: '10 分鐘前', read: false },
    { id: '3', title: '檢測到 1 個模組有可用更新', time: '1 小時前', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <header className="ml-[260px] sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 px-8 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h2 className="font-sans text-lg font-bold text-blue-600">{title}</h2>
      </div>
    </header>
  );
}
