"use client";

import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Send, Users, MessageSquare, Layout, Loader2, 
  Plus, MoreVertical, Flag, User as UserIcon,
  Trash2, Calendar as CalendarIcon, Tag, CheckCheck, 
  Reply, Edit2, X, Code, FileUp, Image as ImageIcon, Github
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
// ✅ FIXED: Imported toast from sonner
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from 'next/link';

// --- TYPES ---
type Task = {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: { _id: string; name: string };
  dueDate?: string;
  color?: string;
};

type Message = {
    _id: string;
    content: string;
    sender: { _id: string; name: string };
    createdAt: string;
    replyTo?: { _id: string; content: string; sender: { name: string } };
    isEdited?: boolean;
};

export default function CollaboratePage() {
  const params = useParams();
  const router = useRouter();
  // ❌ REMOVED: const { toast } = useToast();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<'owner' | 'member' | 'guest' | 'pending'>('guest');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  const isSendingRef = useRef(false); 
  const [isSending, setIsSending] = useState(false);
  
  // Kanban States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { router.push("/login"); return; }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    const userId = user.id || user._id;

    const initData = async () => {
      try {
        if (!params?.id) return;
        const res = await fetch(`/api/projects/${params.id}`);
        const data = await res.json();
        
        if (data.project) {
            setProject(data.project);
            const p = data.project;

            const ownerId = p.owner?._id || p.owner;
            const isOwner = String(ownerId) === String(userId);
            const isMember = p.team?.some((m: any) => String(m.user?._id || m.user) === String(userId));

            if (isOwner) { setRole('owner'); fetchIncomingRequests(p._id); } 
            else if (isMember) { setRole('member'); } 
            else { checkMyRequestStatus(userId, p._id); }

            if (isOwner || isMember) {
                fetchMessages(p._id, true);
                fetchTasks(p._id);
                const interval = setInterval(() => fetchMessages(p._id, false), 5000);
                return () => clearInterval(interval);
            }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    initData();
  }, [params.id, router]);

  const checkMyRequestStatus = async (userId: string, projectId: string) => {
      try {
          const res = await fetch("/api/requests/user", { method: "POST", body: JSON.stringify({ userId }) });
          const data = await res.json();
          const myReq = data.requests?.find((r: any) => (r.project._id === projectId || r.project === projectId) && r.status === 'pending');
          setRole(myReq ? 'pending' : 'guest');
      } catch (e) { console.error(e); }
  };

  const fetchIncomingRequests = async (projectId: string) => {
      try {
          const res = await fetch(`/api/projects/${projectId}/requests`);
          
          if (!res.ok) {
            console.error(`API Error ${res.status}:`, res.statusText);
            return;
          }

          const text = await res.text();
          if (!text) {
             console.warn("API returned empty response");
             return;
          }

          const data = JSON.parse(text);
          if (data.requests) setIncomingRequests(data.requests);
      } catch (error) {
          console.error("Failed to fetch requests:", error);
      }
  };
  
  const fetchMessages = async (projectId: string, shouldScroll = false) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`);
        const data = await res.json();
        if (data.messages) {
            if (!editingMessageId) setMessages(data.messages);
            if (shouldScroll) {
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        }
      } catch (e) { console.error("Poll error", e); }
  };

  const scrollToBottom = () => {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || isSendingRef.current) return;
      
      isSendingRef.current = true;
      setIsSending(true);

      const currentUserId = currentUser.id || currentUser._id;
      
      try {
          if (editingMessageId) {
              const res = await fetch(`/api/projects/${project._id}/messages`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ messageId: editingMessageId, content: newMessage })
              });
              const data = await res.json();
              if (data.message) {
                  setMessages(prev => prev.map(m => m._id === editingMessageId ? data.message : m));
                  setEditingMessageId(null);
                  setNewMessage("");
                  // ✅ FIXED: Using toast.success
                  toast.success("Message updated");
              }
          } else {
              const res = await fetch(`/api/projects/${project._id}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                      content: newMessage, 
                      senderId: currentUserId,
                      replyTo: replyingTo?._id 
                  })
              });
              const data = await res.json();
              if (data.message) {
                  setMessages(prev => [...prev, data.message]);
                  setNewMessage("");
                  setReplyingTo(null);
                  scrollToBottom();
              }
          }
      } catch (e) { 
          // ✅ FIXED: Using toast.error
          toast.error("Failed to send message");
      } finally {
          isSendingRef.current = false;
          setIsSending(false);
      }
  };

  const handleDeleteMessage = async (messageId: string) => {
      if(!confirm("Delete this message?")) return;
      try {
          await fetch(`/api/projects/${project._id}/messages`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId })
          });
          setMessages(prev => prev.filter(m => m._id !== messageId));
          // ✅ FIXED: Using toast.success
          toast.success("Message deleted");
      } catch (e) { 
        // ✅ FIXED: Using toast.error
        toast.error("Delete failed"); 
      }
  };

  const initiateEdit = (msg: Message) => {
      setNewMessage(msg.content);
      setEditingMessageId(msg._id);
      setReplyingTo(null);
      setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const cancelInput = () => {
      setNewMessage("");
      setReplyingTo(null);
      setEditingMessageId(null);
  };

  const insertCodeBlock = () => {
      setNewMessage(prev => prev + "\n```\nCode here\n```\n");
      setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const renderMessageContent = (text: string) => {
      const parts = text.split(/(```[^`]+```|`[^`]+`)/g);
      return parts.map((part, i) => {
          if (part.startsWith('```') && part.endsWith('```')) {
              return <pre key={i} className="bg-black/80 text-white p-2 rounded-md my-1 overflow-x-auto text-xs"><code className="font-mono">{part.slice(3, -3)}</code></pre>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={i} className="bg-black/10 dark:bg-white/10 px-1 rounded text-primary font-mono text-xs mx-0.5">{part.slice(1, -1)}</code>;
          }
          return part;
      });
  };

  // --- KANBAN FUNCTIONS ---
  const fetchTasks = async (projectId: string) => { const res = await fetch(`/api/projects/${projectId}/tasks`); const data = await res.json(); if (data.tasks) setTasks(data.tasks); };
  
  const handleCreateTask = async (status: string = 'todo') => { 
    const defaultTitle = "New Task"; 
    try { 
        const res = await fetch(`/api/projects/${project._id}/tasks`, { method: "POST", body: JSON.stringify({ title: defaultTitle, status, color: "blue", createdBy: currentUser.id || currentUser._id }) }); 
        const data = await res.json(); 
        if (data.task) { 
            setTasks([data.task, ...tasks]); 
            setActiveTask(data.task); 
            setIsSheetOpen(true); 
        } 
    } catch (e) { 
        // ✅ FIXED: Using toast.error
        toast.error("Failed to create task"); 
    } 
  };

  const handleUpdateTask = async (taskId: string, updates: any) => { setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t)); if (activeTask?._id === taskId) setActiveTask(prev => prev ? { ...prev, ...updates } : null); try { const res = await fetch(`/api/projects/${project._id}/tasks`, { method: "PUT", body: JSON.stringify({ taskId, ...updates }) }); if(updates.assignedTo) { const data = await res.json(); if(data.task) setTasks(prev => prev.map(t => t._id === taskId ? data.task : t)); } } catch (e) { fetchTasks(project._id); } };
  
  const handleDeleteTask = async (taskId: string) => { if (!confirm("Delete task?")) return; setTasks(prev => prev.filter(t => t._id !== taskId)); setIsSheetOpen(false); await fetch(`/api/projects/${project._id}/tasks`, { method: "DELETE", body: JSON.stringify({ taskId }) }); };
  
  const handleDragStart = (e: React.DragEvent, taskId: string) => { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = "move"; };
  
  const handleDrop = (e: React.DragEvent, status: 'todo' | 'in-progress' | 'done') => { e.preventDefault(); if (draggedTaskId) { handleUpdateTask(draggedTaskId, { status }); setDraggedTaskId(null); }};
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleJoin = async () => { 
    try { 
        const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project._id, userId: currentUser.id || currentUser._id, ownerId: project.owner?._id || project.owner }) }); 
        if (res.ok) { 
            setRole('pending'); 
            // ✅ FIXED: Using toast.success
            toast.success("Request Sent"); 
        } 
    } catch (e) { 
        // ✅ FIXED: Using toast.error
        toast.error("Failed to join project"); 
    } 
  };
  
  const handleDecision = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
        const res = await fetch("/api/requests", { 
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, status }) 
        });

        if (res.ok) {
            // ✅ FIXED: Using toast.success
            toast.success(`Request ${status}`);
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
            
            if (status === 'accepted') window.location.reload(); 
        } else {
            const errorData = await res.json().catch(() => ({}));
            console.error("Update failed:", errorData);
            // ✅ FIXED: Using toast.error
            toast.error("Update failed");
        }
    } catch (e) {
        console.error(e);
        // ✅ FIXED: Using toast.error
        toast.error("Connection error");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!project) return <div className="p-10 text-center">Project not found</div>;
  const isAccessGranted = role === 'owner' || role === 'member';

  const KanbanColumn = ({ title, status, color }: { title: string, status: 'todo' | 'in-progress' | 'done', color: string }) => {
      const columnTasks = tasks.filter(t => t.status === status);
      return (
          <div className="flex flex-col h-full min-h-[500px] rounded-lg bg-muted/30 border" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
              <div className="p-3 flex items-center justify-between border-b bg-muted/40 rounded-t-lg">
                  <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${color}`} /><span className="font-semibold text-sm">{title}</span><span className="text-xs text-muted-foreground ml-1">{columnTasks.length}</span></div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreateTask(status)}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="p-2 flex-grow space-y-2">
                  {columnTasks.map(task => {
                      const colorClass = task.color === 'red' ? 'border-l-red-500' : task.color === 'green' ? 'border-l-green-500' : task.color === 'yellow' ? 'border-l-yellow-500' : task.color === 'purple' ? 'border-l-purple-500' : 'border-l-blue-500';
                      return (
                      <div key={task._id} draggable onDragStart={(e) => handleDragStart(e, task._id)} onClick={() => { setActiveTask(task); setIsSheetOpen(true); }} className={`bg-card p-3 rounded-md border shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95 group border-l-4 ${colorClass}`}>
                          <div className="flex justify-between items-start mb-2"><span className="text-sm font-medium line-clamp-2">{task.title}</span></div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                              {task.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-5 px-1">High</Badge>}
                              {task.dueDate && (<Badge variant="outline" className="text-[10px] h-5 px-1 flex items-center gap-1 text-muted-foreground"><CalendarIcon className="w-3 h-3"/>{format(new Date(task.dueDate), "MMM d")}</Badge>)}
                              {task.assignedTo && (<div className="ml-auto"><Avatar className="h-5 w-5 border-2 border-background"><AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{task.assignedTo.name?.charAt(0)}</AvatarFallback></Avatar></div>)}
                          </div>
                      </div>
                  )})}
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground justify-start h-8" onClick={() => handleCreateTask(status)}><Plus className="h-3 w-3 mr-1" /> New</Button>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 p-6 h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="font-headline text-3xl font-bold">{project.title}</h1><p className="text-muted-foreground">{isAccessGranted ? "Workspace" : "Project Overview"}</p></div>
        <div>{role === 'owner' && <Badge>You are Owner</Badge>}{role === 'member' && <Badge variant="secondary">Team Member</Badge>}{role === 'pending' && <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Request Pending</Badge>}{role === 'guest' && <Button onClick={handleJoin}>Join Project</Button>}</div>
      </div>
      
      {!isAccessGranted ? ( 
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader><CardTitle className="font-headline">About this Project</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">{project.techStack?.map((t:string,i:number)=><Badge key={i} variant="secondary">{t}</Badge>)}</div>
                        </div>
                         {project.githubLink && (
                            <div>
                                <h3 className="font-semibold mb-2">Repository</h3>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={project.githubLink} target="_blank">
                                        <Github className="mr-2 h-4 w-4"/> View on GitHub
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users className="w-5 h-5"/> Team</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center gap-3 p-2">
                             <Avatar><AvatarFallback>{project.owner?.name?.charAt(0) || "O"}</AvatarFallback></Avatar>
                             <div className="flex-grow"><p className="font-semibold text-sm">{project.owner?.name || "Owner"}</p><Badge variant="outline" className="text-[10px]">Owner</Badge></div>
                         </div>
                        {project.team?.map((member: any, index: number) => {
                            const userData = member.user || member;
                            if (!userData) return null;
                            return (
                                <div key={index} className="flex items-center gap-3 p-2">
                                    <Avatar><AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="flex-grow"><p className="font-semibold text-sm">{userData.name}</p><p className="text-xs text-muted-foreground">{member.role || "Member"}</p></div>
                                </div>
                            )
                        })}
                        {!project.team?.length && <p className="text-sm text-muted-foreground text-center italic">No other members yet.</p>}
                    </CardContent>
                </Card>
            </div>
          </div>
      ) : (
      
      <div className="flex-grow flex flex-col overflow-hidden">
           <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList>
                <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2"/>Chat</TabsTrigger>
                <TabsTrigger value="board"><Layout className="w-4 h-4 mr-2"/>Board</TabsTrigger>
                {role === 'owner' && <TabsTrigger value="requests"><Users className="w-4 h-4 mr-2"/>Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="chat" className="flex-grow mt-4 overflow-hidden">
                 <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
                    <CardContent className="flex-grow overflow-hidden p-0 border rounded-t-lg bg-muted/10 relative">
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                        <ScrollArea className="h-full px-4 py-4">
                            <div className="space-y-6">
                                {messages.length === 0 && <div className="text-center text-muted-foreground py-20 opacity-50"><MessageSquare className="w-12 h-12 mx-auto mb-2"/><p>No messages yet. Start the conversation!</p></div>}
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender?._id === (currentUser.id || currentUser._id);
                                    const time = msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : format(new Date(), "h:mm a");
                                    return (
                                        <div key={i} className={cn("flex w-full group/msg", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn("flex max-w-[85%] md:max-w-[70%] gap-2 items-end", isMe ? "flex-row-reverse" : "flex-row")}>
                                                <Avatar className="h-6 w-6 mb-1 border border-background shadow-sm"><AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">{msg.sender?.name?.charAt(0)}</AvatarFallback></Avatar>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <div className={cn("relative p-3 shadow-sm text-sm break-words", isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm" : "bg-white dark:bg-card border text-foreground rounded-2xl rounded-bl-sm")}>
                                                        {msg.replyTo && (<div className={cn("mb-2 p-2 rounded text-xs border-l-2 opacity-90 truncate", isMe ? "bg-white/10 border-white/50" : "bg-muted border-primary/50")}><span className="font-bold block mb-0.5">{msg.replyTo.sender?.name || 'Unknown'}</span><span className="truncate block">{msg.replyTo.content}</span></div>)}
                                                        {!isMe && <p className="text-[10px] font-bold text-primary mb-1 opacity-90">{msg.sender?.name}</p>}
                                                        <div className="leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                                                        <div className={cn("flex items-center justify-end gap-1 mt-1 select-none", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}><span className="text-[9px]">{time}</span>{msg.isEdited && <span className="text-[9px] italic">(edited)</span>}{isMe && <CheckCheck className="w-3 h-3" />}</div>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/msg:opacity-100 transition-opacity rounded-full self-center"><MoreVertical className="h-3 w-3 text-muted-foreground"/></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align={isMe ? "end" : "start"}><DropdownMenuItem onClick={() => setReplyingTo(msg)}><Reply className="w-3 h-3 mr-2"/> Reply</DropdownMenuItem>{isMe && (<><DropdownMenuItem onClick={() => initiateEdit(msg)}><Edit2 className="w-3 h-3 mr-2"/> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteMessage(msg._id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3 h-3 mr-2"/> Delete</DropdownMenuItem></>)}</DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="bg-background border rounded-b-lg">
                        {replyingTo && (<div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-sm"><div className="flex items-center gap-2 text-muted-foreground border-l-2 border-primary pl-2"><Reply className="w-3 h-3"/><div className="flex flex-col"><span className="font-bold text-xs text-foreground">Replying to {replyingTo.sender?.name || 'Unknown'}</span><span className="text-xs truncate max-w-[200px]">{replyingTo.content}</span></div></div><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}><X className="w-3 h-3"/></Button></div>)}
                        {editingMessageId && (<div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b text-sm"><span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2"><Edit2 className="w-3 h-3"/> Editing message</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelInput}><X className="w-3 h-3"/></Button></div>)}
                        <div className="p-3 flex gap-2 items-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground rounded-full hover:bg-muted shrink-0 h-10 w-10"><Plus className="w-5 h-5"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="start"><DropdownMenuItem onClick={insertCodeBlock}><Code className="w-4 h-4 mr-2"/> Code Block</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => toast.info("File Upload", { description: "Storage not configured yet." })}><FileUp className="w-4 h-4 mr-2"/> Upload File</DropdownMenuItem><DropdownMenuItem onClick={() => toast.info("Image Upload", { description: "Storage not configured yet." })}><ImageIcon className="w-4 h-4 mr-2"/> Upload Image</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                            <Textarea 
                                ref={textareaRef} 
                                placeholder={replyingTo ? "Type a reply..." : "Type a message..."} 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)} 
                                onKeyDown={e => { 
                                    if(e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        if(!isSendingRef.current) handleSendMessage(); 
                                    }
                                }} 
                                className="flex-grow min-h-[40px] max-h-[120px] rounded-2xl border-muted-foreground/20 bg-muted/10 focus-visible:ring-1 focus-visible:ring-primary/50 resize-none py-2.5"
                            />
                            <Button 
                                onClick={handleSendMessage} 
                                size="icon" 
                                className="rounded-full shadow-sm bg-primary hover:bg-primary/90 shrink-0 h-10 w-10" 
                                disabled={!newMessage.trim() || isSending}
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                 </Card>
            </TabsContent>
            <TabsContent value="board" className="flex-grow overflow-hidden mt-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full"><KanbanColumn title="To Do" status="todo" color="bg-red-500" /><KanbanColumn title="In Progress" status="in-progress" color="bg-blue-500" /><KanbanColumn title="Done" status="done" color="bg-green-500" /></div></TabsContent>
            {role === 'owner' && <TabsContent value="requests" className="mt-4"><Card><CardHeader><CardTitle>Pending Applications</CardTitle></CardHeader><CardContent>{incomingRequests.length === 0 ? <p className="text-center py-8 text-muted-foreground">No requests.</p> : (<div className="space-y-4">{incomingRequests.map(req => (<div key={req._id} className="flex justify-between items-center p-4 border rounded-lg"><div className="flex items-center gap-4"><Avatar><AvatarFallback>{req.applicant.name?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{req.applicant.name}</p><p className="text-xs text-muted-foreground">{req.applicant.email}</p></div></div><div className="flex gap-2"><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDecision(req._id, 'rejected')}>Reject</Button><Button size="sm" className="bg-green-600" onClick={() => handleDecision(req._id, 'accepted')}>Accept</Button></div></div>))}</div>)}</CardContent></Card></TabsContent>}
           </Tabs>
      </div>
      )}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent className="sm:max-w-[500px] overflow-y-auto"><SheetHeader className="sr-only"><SheetTitle>Edit Task</SheetTitle><SheetDescription>Task Details</SheetDescription></SheetHeader>{activeTask && (<div className="space-y-6 mt-6"><div className="space-y-2"><Input className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0" value={activeTask.title} onChange={(e) => handleUpdateTask(activeTask._id, { title: e.target.value })}/></div><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-muted-foreground flex items-center gap-2 justify-end"><Layout className="w-4 h-4"/> Status</Label><Select value={activeTask.status} onValueChange={(val) => handleUpdateTask(activeTask._id, { status: val })}><SelectTrigger className="col-span-3 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select></div><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-muted-foreground flex items-center gap-2 justify-end"><Flag className="w-4 h-4"/> Priority</Label><Select value={activeTask.priority || 'medium'} onValueChange={(val) => handleUpdateTask(activeTask._id, { priority: val })}><SelectTrigger className="col-span-3 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-muted-foreground flex items-center gap-2 justify-end"><UserIcon className="w-4 h-4"/> Assignee</Label><Select value={activeTask.assignedTo?._id || "unassigned"} onValueChange={(val) => handleUpdateTask(activeTask._id, { assignedTo: val })}><SelectTrigger className="col-span-3 h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem><SelectItem value={project.owner?._id}>{project.owner?.name} (Owner)</SelectItem>{project.team?.map((m: any) => (<SelectItem key={m.user?._id} value={m.user?._id}>{m.user?.name}</SelectItem>))}</SelectContent></Select></div><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-muted-foreground flex items-center gap-2 justify-end"><CalendarIcon className="w-4 h-4"/> Due Date</Label><Input type="date" className="col-span-3 h-8" value={activeTask.dueDate ? new Date(activeTask.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => handleUpdateTask(activeTask._id, { dueDate: e.target.value })}/></div><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-muted-foreground flex items-center gap-2 justify-end"><Tag className="w-4 h-4"/> Label</Label><Select value={activeTask.color || "blue"} onValueChange={(val) => handleUpdateTask(activeTask._id, { color: val })}><SelectTrigger className="col-span-3 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="blue">Blue</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="purple">Purple</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label className="text-muted-foreground">Description</Label><Textarea placeholder="Add more details..." className="min-h-[150px] resize-none focus-visible:ring-0 bg-muted/20" value={activeTask.description || ""} onChange={(e) => handleUpdateTask(activeTask._id, { description: e.target.value })}/></div><div className="flex justify-between pt-4 border-t"><Button variant="destructive" size="sm" onClick={() => handleDeleteTask(activeTask._id)}><Trash2 className="w-4 h-4 mr-2"/> Delete Task</Button><Button variant="ghost" onClick={() => setIsSheetOpen(false)}>Close</Button></div></div>)}</SheetContent></Sheet>
    </div>
  );
}