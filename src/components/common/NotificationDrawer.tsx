import React, { useState, useEffect } from 'react';
import { X, CheckCheck, Bell, AlertTriangle, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string, id?: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectPatient,
}) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    const data = await notificationService.getNotifications();
    setNotifications(data);
  };

  const handleNotificationClick = (patientId?: string) => {
    if (!patientId) return;
    if (onNavigate) {
      onNavigate('patient-detail', patientId);
    } else if (onSelectPatient) {
      onSelectPatient(patientId);
    }
    onClose();
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    loadNotifications();
  };

  if (!isOpen) return null;

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'HIGH_RISK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'REVIEW_PENDING':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'LAB_READY':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'FOLLOWUP_DUE':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  {t.nav.notifications}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread clinical alerts` : 'All alerts up to date'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter & Actions Bar */}
          <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'unread' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No notifications in this view.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item.patientId)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    !item.read
                      ? 'bg-blue-50/40 border-blue-100/80 hover:bg-blue-50/70'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5 border border-slate-100">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                      
                      {item.patientName && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-blue-600 hover:underline">
                            Patient: {item.patientName} →
                          </span>
                          {!item.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
