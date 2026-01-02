import React, { createContext, useContext, useEffect } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Notification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  // Subscribe to real-time complaint status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-complaint-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `reporter_firebase_uid=eq.${user.uid}`,
        },
        (payload) => {
          const updated = payload.new as { 
            complaint_status: string; 
            complaint_id: string; 
            address?: string;
            area_name?: string;
          };
          const oldStatus = (payload.old as { complaint_status: string })?.complaint_status;

          // Only notify if status changed to resolved
          if (updated.complaint_status === 'resolved' && oldStatus !== 'resolved') {
            const location = updated.address || updated.area_name || 'Unknown location';
            
            // Add to notification system
            addNotification({
              title: "Complaint Resolved! 🎉",
              message: `Your complaint #${updated.complaint_id.slice(0, 12)} at ${location} has been resolved.`,
              type: 'success',
              complaintId: updated.complaint_id,
            });

            // Also show a toast for immediate feedback
            toast({
              title: "Complaint Resolved! 🎉",
              description: `Your complaint at ${location} has been successfully resolved.`,
            });
          } else if (updated.complaint_status === 'in_progress' && oldStatus === 'pending') {
            const location = updated.address || updated.area_name || 'Unknown location';
            
            addNotification({
              title: "Complaint In Progress",
              message: `Your complaint #${updated.complaint_id.slice(0, 12)} at ${location} is now being worked on.`,
              type: 'info',
              complaintId: updated.complaint_id,
            });

            toast({
              title: "Complaint In Progress",
              description: `Your complaint at ${location} is now being worked on.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
