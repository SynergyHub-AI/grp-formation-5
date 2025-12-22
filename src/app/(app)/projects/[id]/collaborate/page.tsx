"use client";

import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Reply, Edit2, X, Code, FileUp, Image as ImageIcon, Github, Sparkles
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
            toast.error("Failed to send message");
        } finally {
            isSendingRef.current = false;
            setIsSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm("Delete this message?")) return;
        try {
            await fetch(`/api/projects/${project._id}/messages`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId })
            });
            setMessages(prev => prev.filter(m => m._id !== messageId));
            toast.success("Message deleted");
        } catch (e) {
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
                return <pre key={i} className="bg-muted/50 p-3 rounded-lg my-2 overflow-x-auto text-xs border border-border/50"><code className="font-mono text-foreground">{part.slice(3, -3)}</code></pre>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs mx-0.5 border border-border/50">{part.slice(1, -1)}</code>;
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
            toast.error("Failed to create task");
        }
    };

    const handleUpdateTask = async (taskId: string, updates: any) => { setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t)); if (activeTask?._id === taskId) setActiveTask(prev => prev ? { ...prev, ...updates } : null); try { const res = await fetch(`/api/projects/${project._id}/tasks`, { method: "PUT", body: JSON.stringify({ taskId, ...updates }) }); if (updates.assignedTo) { const data = await res.json(); if (data.task) setTasks(prev => prev.map(t => t._id === taskId ? data.task : t)); } } catch (e) { fetchTasks(project._id); } };

    const handleDeleteTask = async (taskId: string) => { if (!confirm("Delete task?")) return; setTasks(prev => prev.filter(t => t._id !== taskId)); setIsSheetOpen(false); await fetch(`/api/projects/${project._id}/tasks`, { method: "DELETE", body: JSON.stringify({ taskId }) }); };

    const handleDragStart = (e: React.DragEvent, taskId: string) => { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = "move"; };

    const handleDrop = (e: React.DragEvent, status: 'todo' | 'in-progress' | 'done') => { e.preventDefault(); if (draggedTaskId) { handleUpdateTask(draggedTaskId, { status }); setDraggedTaskId(null); } };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleJoin = async () => {
        try {
            const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project._id, userId: currentUser.id || currentUser._id, ownerId: project.owner?._id || project.owner }) });
            if (res.ok) {
                setRole('pending');
                toast.success("Request Sent");
            }
        } catch (e) {
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
                toast.success(`Request ${status}`);
                setIncomingRequests(prev => prev.filter(r => r._id !== requestId));

                if (status === 'accepted') window.location.reload();
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Update failed:", errorData);
                toast.error("Update failed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Connection error");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="text-lg font-medium">Loading Workspace...</span></div>;
    if (!project) return <div className="p-20 text-center text-muted-foreground">Project not found</div>;
    const isAccessGranted = role === 'owner' || role === 'member';

    const KanbanColumn = ({ title, status, color }: { title: string, status: 'todo' | 'in-progress' | 'done', color: string }) => {
        const columnTasks = tasks.filter(t => t.status === status);
        return (
            <div className="flex flex-col h-full min-h-[500px] rounded-xl bg-muted/20 border border-border/50 backdrop-blur-sm" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                <div className="p-4 flex items-center justify-between border-b border-border/40 bg-muted/20 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-opacity-20", color.replace('bg-', 'bg-').replace('500', '500 ring-'))} />
                        <span className="font-semibold text-sm">{title}</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-[10px]">{columnTasks.length}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background/80" onClick={() => handleCreateTask(status)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="p-3 flex-grow space-y-3 overflow-y-auto custom-scrollbar">
                    {columnTasks.map(task => {
                        const colorClass = task.color === 'red' ? 'border-l-red-500' : task.color === 'green' ? 'border-l-green-500' : task.color === 'yellow' ? 'border-l-yellow-500' : task.color === 'purple' ? 'border-l-purple-500' : 'border-l-blue-500';
                        return (
                            <div key={task._id} draggable onDragStart={(e) => handleDragStart(e, task._id)} onClick={() => { setActiveTask(task); setIsSheetOpen(true); }} className={cn("bg-card/90 p-3.5 rounded-lg border border-border/50 shadow-sm cursor-grab hover:shadow-lg hover:border-primary/30 transition-all active:cursor-grabbing active:scale-[0.98] group border-l-4", colorClass)}>
                                <div className="flex justify-between items-start mb-2"><span className="text-sm font-medium line-clamp-2 leading-snug">{task.title}</span></div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {task.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 rounded-md">High</Badge>}
                                    {task.dueDate && (<Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-md flex items-center gap-1 text-muted-foreground bg-background/50"><CalendarIcon className="w-3 h-3" />{format(new Date(task.dueDate), "MMM d")}</Badge>)}
                                    {task.assignedTo && (<div className="ml-auto"><Avatar className="h-5 w-5 border-2 border-background ring-1 ring-border"><AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{task.assignedTo.name?.charAt(0)}</AvatarFallback></Avatar></div>)}
                                </div>
                            </div>
                        )
                    })}
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground justify-start h-8 hover:text-primary hover:bg-primary/5 dashed-border" onClick={() => handleCreateTask(status)}><Plus className="h-3 w-3 mr-1" /> Add Task</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6 shrink-0">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight mb-1">{project.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span className={cn("w-2 h-2 rounded-full", isAccessGranted ? "bg-green-500" : "bg-zinc-500")}></span>
                        {isAccessGranted ? "Workspace Active" : "Public Overview"}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {role === 'owner' && <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 py-1.5 px-3">Owner</Badge>}
                    {role === 'member' && <Badge variant="secondary" className="py-1.5 px-3">Team Member</Badge>}
                    {role === 'pending' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 py-1.5 px-3"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Request Pending</Badge>}
                    {role === 'guest' && <Button onClick={handleJoin} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">Join Project</Button>}
                </div>
            </div>

            {!isAccessGranted ? (
                // === PUBLIC VIEW ===
                <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto w-full flex-grow overflow-auto py-4">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                            <CardHeader><CardTitle className="font-headline text-xl">About this Project</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                                    <p className="leading-relaxed whitespace-pre-line text-foreground/90">{project.description}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Tech Stack</h3>
                                    <div className="flex flex-wrap gap-2">{project.techStack?.map((t: string, i: number) => <Badge key={i} variant="secondary" className="px-3 py-1 bg-secondary/50">{t}</Badge>)}</div>
                                </div>
                                {project.githubLink && (
                                    <div>
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Repository</h3>
                                        <Button variant="outline" size="sm" className="gap-2" asChild>
                                            <Link href={project.githubLink} target="_blank">
                                                <Github className="h-4 w-4" /> View on GitHub
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-fit">
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2 text-xl"><Users className="w-5 h-5 text-primary" /> Team</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Link href={`/users/${project.owner?._id || project.owner}`} className="block">
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors group cursor-pointer">
                                        <Avatar className="w-10 h-10 border-2 border-background ring-2 ring-primary/10 group-hover:scale-105 transition-transform"><AvatarFallback className="bg-primary/20 text-primary font-bold">{project.owner?.name?.charAt(0) || "O"}</AvatarFallback></Avatar>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{project.owner?.name || "Owner"}</p>
                                            <p className="text-xs text-muted-foreground">{project.owner?.email}</p>
                                        </div>
                                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Owner</Badge>
                                    </div>
                                </Link>
                                {project.team?.map((member: any, index: number) => {
                                    const userData = member.user || member;
                                    if (!userData) return null;
                                    return (
                                        <Link href={`/users/${userData._id}`} key={index} className="block">
                                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-border/30 group cursor-pointer">
                                                <Avatar className="w-10 h-10 border border-border group-hover:scale-105 transition-transform">
                                                    <AvatarImage src={userData.avatarUrl} />
                                                    <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{userData.name}</p>
                                                    <p className="text-xs text-muted-foreground">{userData.email || "Member"}</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground">Member</Badge>
                                            </div>
                                        </Link>
                                    )
                                })}
                                {!project.team?.length && <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2"><Users className="w-8 h-8 opacity-20" /><p>No other members yet.</p></div>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (

                // === WORKSPACE VIEW ===
                <div className="flex-grow flex flex-col overflow-hidden w-full max-w-[1600px] mx-auto">
                    <Tabs defaultValue="chat" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground hover:text-foreground transition-all gap-2"><MessageSquare className="w-4 h-4" /> Chat</TabsTrigger>
                            <TabsTrigger value="board" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground hover:text-foreground transition-all gap-2"><Layout className="w-4 h-4" /> Task Board</TabsTrigger>
                            {role === 'owner' && <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground hover:text-foreground transition-all gap-2"><Users className="w-4 h-4" /> Requests {incomingRequests.length > 0 && <Badge className="ml-1 h-5 px-1.5">{incomingRequests.length}</Badge>}</TabsTrigger>}
                        </TabsList>

                        <TabsContent value="chat" className="flex-grow mt-0 overflow-hidden pt-4">
                            <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                                <CardContent className="flex-grow overflow-hidden p-0 relative">
                                    {/* Chat Background Pattern */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground to-transparent [background-size:20px_20px] pointer-events-none"></div>

                                    <ScrollArea className="h-full px-4 py-6">
                                        <div className="space-y-6 max-w-4xl mx-auto">
                                            {messages.length === 0 && (
                                                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground opacity-70">
                                                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 rotate-3">
                                                        <MessageSquare className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-lg font-medium">No messages yet</p>
                                                    <p className="text-sm">Start the conversation with your team!</p>
                                                </div>
                                            )}
                                            {messages.map((msg, i) => {
                                                const isMe = msg.sender?._id === (currentUser.id || currentUser._id);
                                                const time = msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : format(new Date(), "h:mm a");
                                                return (
                                                    <div key={i} className={cn("flex w-full group/msg animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
                                                        <div className={cn("flex max-w-[85%] md:max-w-[70%] gap-3 items-end", isMe ? "flex-row-reverse" : "flex-row")}>
                                                            <Avatar className="h-8 w-8 mb-1 border-2 border-background shadow-sm ring-1 ring-border/50"><AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-bold">{msg.sender?.name?.charAt(0)}</AvatarFallback></Avatar>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                {!isMe && <span className="text-[11px] text-muted-foreground ml-1">{msg.sender?.name}</span>}
                                                                <div className={cn("relative p-3.5 shadow-sm text-sm break-words", isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-sm")}>
                                                                    {msg.replyTo && (<div className={cn("mb-2 p-2 rounded-lg text-xs border-l-2 opacity-90 truncate", isMe ? "bg-white/10 border-white/50" : "bg-muted/50 border-primary/50")}><span className="font-bold block mb-0.5">{msg.replyTo.sender?.name || 'Unknown'}</span><span className="truncate block opacity-80">{msg.replyTo.content}</span></div>)}
                                                                    <div className="leading-relaxed whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                                                                    <div className={cn("flex items-center justify-end gap-1 mt-1 select-none opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}><span className="text-[9px] font-medium">{time}</span>{msg.isEdited && <span className="text-[9px] italic">(edited)</span>}{isMe && <CheckCheck className="w-3 h-3" />}</div>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/msg:opacity-100 transition-opacity rounded-full self-center hover:bg-muted"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40"><DropdownMenuItem onClick={() => setReplyingTo(msg)}><Reply className="w-3 h-3 mr-2" /> Reply</DropdownMenuItem>{isMe && (<><DropdownMenuItem onClick={() => initiateEdit(msg)}><Edit2 className="w-3 h-3 mr-2" /> Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteMessage(msg._id)} className="text-destructive focus:text-destructive"><Trash2 className="w-3 h-3 mr-2" /> Delete</DropdownMenuItem></>)}</DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div ref={scrollRef} />
                                        </div>
                                    </ScrollArea>
                                </CardContent>

                                {/* INPUT AREA */}
                                <div className="bg-background/80 backdrop-blur-md border-t p-4">
                                    <div className="max-w-4xl mx-auto flex flex-col gap-2">
                                        {replyingTo && (<div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg border border-border/50 mb-2 animate-in slide-in-from-bottom-2"><div className="flex items-center gap-3 text-muted-foreground border-l-2 border-primary pl-2"><Reply className="w-3.5 h-3.5" /><div className="flex flex-col"><span className="font-bold text-xs text-foreground">Replying to {replyingTo.sender?.name || 'Unknown'}</span><span className="text-xs truncate max-w-[300px] opacity-80">{replyingTo.content}</span></div></div><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background" onClick={() => setReplyingTo(null)}><X className="w-3 h-3" /></Button></div>)}
                                        {editingMessageId && (<div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mb-2"><span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2 text-sm"><Edit2 className="w-3.5 h-3.5" /> Editing message</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelInput}><X className="w-3 h-3" /></Button></div>)}

                                        <div className="flex gap-3 items-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="text-muted-foreground rounded-full h-11 w-11 shrink-0 bg-background hover:bg-muted hover:text-foreground transition-colors"><Plus className="w-5 h-5" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48"><DropdownMenuItem onClick={insertCodeBlock}><Code className="w-4 h-4 mr-2" /> Code Block</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled className="opacity-50"><FileUp className="w-4 h-4 mr-2" /> Upload File</DropdownMenuItem><DropdownMenuItem disabled className="opacity-50"><ImageIcon className="w-4 h-4 mr-2" /> Upload Image</DropdownMenuItem></DropdownMenuContent>
                                            </DropdownMenu>
                                            <div className="relative flex-grow">
                                                <Textarea
                                                    ref={textareaRef}
                                                    placeholder={replyingTo ? "Type a reply..." : "Message your team..."}
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            if (!isSendingRef.current) handleSendMessage();
                                                        }
                                                    }}
                                                    className="min-h-[44px] max-h-[150px] rounded-2xl border-border/50 bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/50 resize-none py-3 px-4 pr-12 shadow-inner"
                                                />
                                                <Button
                                                    onClick={handleSendMessage}
                                                    size="icon"
                                                    className={cn("absolute right-1.5 bottom-1.5 rounded-full shrink-0 h-8 w-8 transition-all duration-200", newMessage.trim() ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                                                    disabled={!newMessage.trim() || isSending}
                                                >
                                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="board" className="flex-grow overflow-hidden mt-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                                <KanbanColumn title="To Do" status="todo" color="bg-zinc-500" />
                                <KanbanColumn title="In Progress" status="in-progress" color="bg-blue-500" />
                                <KanbanColumn title="Done" status="done" color="bg-green-500" />
                            </div>
                        </TabsContent>

                        {role === 'owner' && <TabsContent value="requests" className="mt-4 pt-2">
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Pending Applications</CardTitle>
                                    <CardDescription>Review developers who want to join.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {incomingRequests.length === 0 ?
                                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl"><Users className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No pending requests.</p></div>
                                        : (
                                            <div className="space-y-4">
                                                {incomingRequests.map(req => (
                                                    <div key={req._id} className="flex flex-col sm:flex-row justify-between items-center p-4 border border-border/50 rounded-lg bg-card hover:border-primary/30 transition-all gap-4">
                                                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                                            <Link href={`/users/${req.applicant?._id || req.applicant}`} className="flex items-center gap-4 group cursor-pointer min-w-0">
                                                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/10 group-hover:scale-105 transition-transform"><AvatarFallback>{req.applicant.name?.charAt(0)}</AvatarFallback></Avatar>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">{req.applicant.name}</p>
                                                                        <Badge variant="outline" className="text-[10px] h-5 hidden sm:flex">Applicant</Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground truncate">{req.applicant.email}</p>
                                                                    {req.message && <div className="mt-2 text-xs bg-muted/50 p-2 rounded italic line-clamp-2">"{req.message}"</div>}
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleDecision(req._id, 'rejected')}>Reject</Button>
                                                            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleDecision(req._id, 'accepted')}>Accept</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </TabsContent>}
                    </Tabs>
                </div>
            )}

            {/* TASK SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[550px] overflow-y-auto border-l-border/50 backdrop-blur-xl bg-background/95">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-headline">Task Details</SheetTitle>
                        <SheetDescription>Manage task status, priority, and assignment.</SheetDescription>
                    </SheetHeader>
                    {activeTask && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="task-title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</Label>
                                <Input
                                    id="task-title"
                                    className="text-lg font-medium border-border/50 bg-muted/30 h-12"
                                    value={activeTask.title}
                                    onChange={(e) => handleUpdateTask(activeTask._id, { title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                                    <Select value={activeTask.status} onValueChange={(val) => handleUpdateTask(activeTask._id, { status: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</Label>
                                    <Select value={activeTask.priority || 'medium'} onValueChange={(val) => handleUpdateTask(activeTask._id, { priority: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assignee</Label>
                                    <Select value={activeTask.assignedTo?._id || "unassigned"} onValueChange={(val) => handleUpdateTask(activeTask._id, { assignedTo: val })}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            <SelectItem value={project.owner?._id}>{project.owner?.name} (Owner)</SelectItem>
                                            {project.team?.map((m: any) => (<SelectItem key={m.user?._id} value={m.user?._id}>{m.user?.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Date</Label>
                                    <Input type="date" value={activeTask.dueDate ? new Date(activeTask.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => handleUpdateTask(activeTask._id, { dueDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color Label</Label>
                                <div className="flex gap-2">
                                    {['blue', 'red', 'green', 'yellow', 'purple'].map(c => (
                                        <button
                                            key={c}
                                            className={cn("w-6 h-6 rounded-full border-2 transition-all", activeTask.color === c ? "border-foreground scale-110" : "border-transparent opacity-50 hover:opacity-100", `bg-${c}-500`)}
                                            onClick={() => handleUpdateTask(activeTask._id, { color: c })}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
                                <Textarea
                                    placeholder="Add more details about this task..."
                                    className="min-h-[150px] resize-none focus-visible:ring-1 bg-muted/30"
                                    value={activeTask.description || ""}
                                    onChange={(e) => handleUpdateTask(activeTask._id, { description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-between pt-6 border-t border-border/50">
                                <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTask(activeTask._id)}><Trash2 className="w-4 h-4 mr-2" /> Delete Task</Button>
                                <Button onClick={() => setIsSheetOpen(false)}>Save & Close</Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}