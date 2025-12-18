"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 1. Fetch Notifications
  const fetchNotifications = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    
    const user = JSON.parse(storedUser);
    const userId = user.id || user._id;

    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        // Count how many are unread
        const unread = data.notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Notify Error:", error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, []);

  // 2. Mark as Read Handler
  const markAsRead = async (id: string, relatedId?: string) => {
    // Optimistic UI update (update screen before DB finishes)
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Call API
    await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
    });

    // If there is a linked project, go there
   // If there is a linked project, go specifically to that project's dashboard
if (relatedId) {
    setIsOpen(false);
    // ✅ IMPROVEMENT: Go to the specific project details
    router.push(`/projects/${relatedId}/collaborate`); 
}
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b font-semibold bg-muted/40 flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount} New</Badge>}
        </div>
        <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications yet.
                </div>
            ) : (
                <div className="divide-y">
                    {notifications.map((note) => (
                        <div 
                            key={note._id} 
                            className={`p-4 flex gap-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer ${!note.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => markAsRead(note._id, note.relatedId)}
                        >
                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!note.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <div className="flex-1 space-y-1">
                                <p className="leading-tight">{note.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}