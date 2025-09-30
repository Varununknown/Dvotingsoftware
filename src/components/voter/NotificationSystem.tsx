import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Bell, Check, X, Calendar, Vote, BarChart3 } from 'lucide-react';
import { Election } from '../../contexts/VotingContext';

// Types
export type NotificationType = 'upcoming' | 'active' | 'ending' | 'results';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  electionId?: string;
  date: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
  showNotifications: boolean;
  toggleNotifications: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Context value
  const value = {
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    unreadCount,
    showNotifications,
    toggleNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Auto-generate notifications for elections
export const useElectionNotifications = (elections: Election[]) => {
  const { addNotification, notifications } = useNotifications();
  
  useEffect(() => {
    const checkForNotifications = () => {
      const now = new Date();
      const notifiedIds = new Set(notifications.map(n => n.electionId));
      
      // Upcoming elections starting in 24 hours
      elections
        .filter(election => {
          const startDate = new Date(election.startDate);
          const diff = startDate.getTime() - now.getTime();
          const diffHours = diff / (1000 * 60 * 60);
          return election.status === 'upcoming' && diffHours <= 24 && diffHours > 0;
        })
        .forEach(election => {
          const key = `upcoming-${election.id}`;
          if (!notifiedIds.has(key)) {
            addNotification({
              type: 'upcoming',
              message: `${election.title} will start in less than 24 hours!`,
              electionId: key,
            });
          }
        });
      
      // Active elections ending in 24 hours
      elections
        .filter(election => {
          const endDate = new Date(election.endDate);
          const diff = endDate.getTime() - now.getTime();
          const diffHours = diff / (1000 * 60 * 60);
          return election.status === 'active' && diffHours <= 24 && diffHours > 0;
        })
        .forEach(election => {
          const key = `ending-${election.id}`;
          if (!notifiedIds.has(key)) {
            addNotification({
              type: 'ending',
              message: `${election.title} is ending in less than 24 hours! Cast your vote now.`,
              electionId: key,
            });
          }
        });
      
      // Newly closed elections
      elections
        .filter(election => {
          const endDate = new Date(election.endDate);
          const diff = now.getTime() - endDate.getTime();
          const diffHours = diff / (1000 * 60 * 60);
          return election.status === 'closed' && diffHours <= 24;
        })
        .forEach(election => {
          const key = `results-${election.id}`;
          if (!notifiedIds.has(key)) {
            addNotification({
              type: 'results',
              message: `${election.title} has concluded. Results will be available soon.`,
              electionId: key,
            });
          }
        });

      // Results released notifications (NEW - dynamic admin releases)
      elections
        .filter(election => {
          return election.status === 'closed' && election.resultsReleased;
        })
        .forEach(election => {
          const key = `released-${election.id}`;
          if (!notifiedIds.has(key)) {
            addNotification({
              type: 'results',
              message: election.resultReleaseMessage || `Results for ${election.title} have been officially released!`,
              electionId: key,
            });
          }
        });
    };
    
    // Check when component mounts
    checkForNotifications();
    
    // Set up interval to check periodically
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [elections, addNotification, notifications]);
};

// Notification Bell component
interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, toggleNotifications } = useNotifications();
  
  return (
    <button 
      onClick={toggleNotifications}
      className={`relative p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 ${className}`}
    >
      <Bell className="h-6 w-6 text-slate-500" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Notification Panel component
export const NotificationPanel: React.FC = () => {
  const { notifications, showNotifications, toggleNotifications, markAsRead, clearNotifications } = useNotifications();
  
  if (!showNotifications) return null;
  
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'upcoming':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'active':
        return <Vote className="h-5 w-5 text-green-500" />;
      case 'ending':
        return <Calendar className="h-5 w-5 text-red-500" />;
      case 'results':
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };
  
  return (
    <div className="fixed right-4 top-16 w-80 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg z-50 animate-fadeIn overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Notifications</h3>
        <div className="flex items-center space-x-1">
          <button 
            onClick={clearNotifications}
            className="p-1 text-slate-500 hover:text-slate-700"
            title="Clear all"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={toggleNotifications}
            className="p-1 text-slate-500 hover:text-slate-700"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications at this time.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getIcon(notification.type)}
                </div>
                <div>
                  <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(notification.date).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};