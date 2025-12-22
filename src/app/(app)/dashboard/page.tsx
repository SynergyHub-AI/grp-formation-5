"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Loader2, BrainCircuit, Send, Clock, CheckCircle, XCircle, Inbox, Check, X, Search, Activity, Users, Layout, Zap } from 'lucide-react';
import { demoUser } from '@/lib/data';
import Link from 'next/link';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ... NoMatchSuggestions Component ...
const NoMatchSuggestions = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-lg font-semibold mb-1">No Projects Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Be the first to post a project or wait for others to join!
            </p>
            <Button asChild className="gap-2">
                <Link href="/projects/new"><Zap className="w-4 h-4" /> Create a Project</Link>
            </Button>
        </div>
    );
}

// Mock Data for Sparklines
const dataSmall = [
    { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 45 }, { value: 35 }, { value: 60 }
];

const MetricCard = ({ title, value, subtext, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5, boxShadow: `0 10px 30px -10px ${color}40` }}
        className="relative overflow-hidden rounded-2xl border border-border/50 dark:border-white/5 bg-card/80 dark:bg-white/5 p-6 backdrop-blur-xl transition-all shadow-sm dark:shadow-none"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 dark:opacity-20`} style={{ color }}>
            <Icon className="h-16 w-16 -mr-4 -mt-4 rotate-12" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg bg-secondary/50 dark:bg-white/5`} style={{ color }}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h3 className="font-headline text-3xl font-bold tracking-tight">{value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
                </div>
                <div className="h-10 w-24 opacity-50">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataSmall}>
                            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Glow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/40 dark:to-white/5 pointer-events-none" />
    </motion.div>
);

export default function DashboardPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const [user, setUser] = useState(demoUser);
    const [projects, setProjects] = useState<any[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper
    const getShortDescription = (fullDesc: string) => {
        if (!fullDesc) return "No description provided.";
        const [mainText] = fullDesc.split('---');
        return mainText.trim();
    };

    // ✅ SEARCH FUNCTION
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query === "") {
            setFilteredProjects(projects);
        } else {
            const filtered = projects.filter(project =>
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query) ||
                project.techStack?.some((tech: string) => tech.toLowerCase().includes(query))
            );
            setFilteredProjects(filtered);
        }
    };

    useEffect(() => {
        let currentUserId: string | null = null;
        let currentUserData: any = null;

        if (session?.user) {
            currentUserData = {
                // @ts-ignore
                id: session.user.id || session.user._id,
                name: session.user.name,
                email: session.user.email,
                avatarUrl: session.user.image,
                // @ts-ignore
                experienceLevel: session.user.experienceLevel || "Beginner",
                // @ts-ignore
                hasCompletedOnboarding: session.user.hasCompletedOnboarding
            };
        } else {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                currentUserData = JSON.parse(storedUser);
            }
        }

        if (currentUserData) {
            if (currentUserData.hasCompletedOnboarding === false) {
                router.push("/onboarding");
                return;
            }
            localStorage.setItem("user", JSON.stringify(currentUserData));
            setUser({ ...demoUser, ...currentUserData });
            currentUserId = currentUserData.id || currentUserData._id;
        } else if (session === null) {
            router.push("/login");
            return;
        }

        const fetchAIProjects = async (id: string) => {
            try {
                const res = await fetch("/api/ai/match", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: id }),
                });
                const data = await res.json();
                if (data.projects) {
                    setProjects(data.projects);
                    setFilteredProjects(data.projects);
                }
            } catch (error) { console.error(error); }
        };

        const fetchMyRequests = async (id: string) => {
            try {
                const res = await fetch("/api/requests/user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: id }),
                });
                const data = await res.json();
                if (data.requests) setMyRequests(data.requests);
            } catch (error) { console.error(error); }
        };

        const fetchIncomingRequests = async (id: string) => {
            try {
                const res = await fetch("/api/requests/owner", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: id }),
                });
                const data = await res.json();
                if (data.requests) setIncomingRequests(data.requests);
            } catch (error) { console.error(error); }
        };

        if (currentUserId) {
            Promise.all([
                fetchAIProjects(currentUserId),
                fetchMyRequests(currentUserId),
                fetchIncomingRequests(currentUserId)
            ]).finally(() => setLoading(false));
        }
    }, [router, session]);

    const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            const res = await fetch("/api/requests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status }),
            });

            if (res.ok) {
                setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
                toast.success(`Request ${status}`);
            } else {
                toast.error("Failed to update request");
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error("Connection error");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'accepted': return <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-0"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
            case 'rejected': return <Badge variant="destructive" className="bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-0"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 border-0"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="text-lg font-medium">Loading Dashboard...</span>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* HEADER */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="font-headline text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60">Overview</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Welcome back, {user.name?.split(' ')[0] || 'User'}. Here's what's happening.</p>
                </div>
                <Button asChild className="hidden sm:flex h-11 px-6 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--primary)] transition-all hover:scale-105">
                    <Link href="/projects/new"><Sparkles className="mr-2 h-4 w-4" /> Post New Project</Link>
                </Button>
            </motion.div>

            {/* HERO METRICS GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Matches"
                    value={projects.length}
                    subtext="AI-recommended projects"
                    icon={BrainCircuit}
                    color="#8b5cf6"
                    delay={0.1}
                />
                <MetricCard
                    title="Pending Requests"
                    value={myRequests.filter(r => r.status === 'pending').length}
                    subtext="Applications sent by you"
                    icon={Clock}
                    color="#eab308"
                    delay={0.2}
                />
                <MetricCard
                    title="Inbox"
                    value={incomingRequests.length}
                    subtext="Incoming applications"
                    icon={Inbox}
                    color="#3b82f6"
                    delay={0.3}
                />
                <MetricCard
                    title="Active Projects"
                    value="0"
                    subtext="Projects managed by you"
                    icon={Layout}
                    color="#22c55e"
                    delay={0.4}
                />
            </div>

            <Tabs defaultValue="projects" className="space-y-8">

                {/* TAB LIST + SEARCH */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/40 pb-6">
                    <TabsList className="bg-secondary/40 dark:bg-white/5 p-1 h-auto rounded-full border border-border/40 dark:border-white/5 backdrop-blur-md">
                        <TabsTrigger value="projects" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><BrainCircuit className="h-4 w-4 mr-2" /> Recommended</TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><Send className="h-4 w-4 mr-2" /> Applications ({myRequests.length})</TabsTrigger>
                        <TabsTrigger value="inbox" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all relative">
                            Inbox
                            {incomingRequests.length > 0 && <span className="ml-2 bg-red-500 text-white rounded-full text-[10px] h-5 w-5 flex items-center justify-center">{incomingRequests.length}</span>}
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-80 group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full pointer-events-none" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <Input
                            type="search"
                            placeholder="Search projects..."
                            className="pl-11 h-11 bg-card/80 dark:bg-black/20 border-border/50 dark:border-white/10 focus:border-primary/50 transition-all rounded-full relative z-0 placeholder:text-muted-foreground/50"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                {/* === AI PROJECTS TAB === */}
                <TabsContent value="projects" className="space-y-6">
                    {filteredProjects.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={project._id || index}
                                >
                                    <Card className="flex flex-col h-full border-border/50 dark:border-white/5 bg-card/80 dark:bg-white/5 hover:bg-card/100 dark:hover:bg-white/10 backdrop-blur-md transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative shadow-sm dark:shadow-none">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <CardHeader className="pb-3 relative z-10">
                                            <div className="flex justify-between items-start gap-4">
                                                <CardTitle className="font-headline text-xl line-clamp-1 group-hover:text-primary transition-colors">{project.title}</CardTitle>
                                                <Badge variant="outline" className="shrink-0 border-border/40 dark:border-white/10 bg-secondary/50 dark:bg-black/20 backdrop-blur-md">{project.techStack?.[0] || "Tech"}</Badge>
                                            </div>
                                            <CardDescription>by <span className="font-medium text-foreground">{project.owner?.name}</span></CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-grow pb-4 relative z-10">
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-6 min-h-[60px] leading-relaxed">
                                                {getShortDescription(project.description)}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.techStack?.slice(0, 3).map((t: any, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-xs font-normal bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {t}
                                                    </Badge>
                                                ))}
                                                {(project.techStack?.length || 0) > 3 && <Badge variant="secondary" className="text-xs font-normal bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">+{project.techStack.length - 3}</Badge>}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0 relative z-10">
                                            <Button className="w-full bg-secondary/80 dark:bg-white/5 hover:bg-primary hover:text-white border border-border/50 dark:border-white/10 transition-all font-medium" asChild>
                                                <Link href={`/projects/${project._id}/collaborate`}>View Project</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        searchQuery ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <p className="text-lg">No projects match <span className="font-medium text-foreground">"{searchQuery}"</span></p>
                                <Button variant="link" onClick={() => { setSearchQuery(""); setFilteredProjects(projects) }} className="mt-2 text-primary">Clear Search</Button>
                            </div>
                        ) : <NoMatchSuggestions />
                    )}
                </TabsContent>

                {/* ... other tabs (Requests/Inbox) ... */}

                <TabsContent value="requests" className="mt-4">
                    <Card className="border-border/50 dark:border-white/5 bg-card/80 dark:bg-white/5 backdrop-blur-xl shadow-sm dark:shadow-none">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Send className="h-5 w-5 text-yellow-500" /> Sent Applications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {myRequests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>You haven't applied to any projects yet.</p>
                                    <Button variant="link" asChild className="text-primary"><Link href="/projects/new">Find a project</Link></Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-slate-100/50 dark:hover:bg-white/5 border-slate-200 dark:border-white/5">
                                            <TableHead className="text-muted-foreground">Project</TableHead>
                                            <TableHead className="text-muted-foreground">Date Sent</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myRequests.map((req) => (
                                            <TableRow key={req._id} className="hover:bg-muted/50 dark:hover:bg-white/5 border-border/50 dark:border-white/5 transition-colors">
                                                <TableCell className="font-medium text-foreground">{req.project?.title}</TableCell>
                                                <TableCell className="text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inbox" className="mt-4">
                    <Card className="border-border/50 dark:border-white/5 bg-card/80 dark:bg-white/5 backdrop-blur-xl shadow-sm dark:shadow-none">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Inbox className="h-5 w-5 text-blue-500" /> Incoming Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {incomingRequests.length > 0 ? (
                                <div className="space-y-4">
                                    {incomingRequests.map((req) => (
                                        <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 dark:border-white/10 bg-secondary/30 dark:bg-black/20 hover:border-primary/30 transition-all gap-4 group">
                                            <div className="flex items-start gap-4">
                                                <Link href={`/users/${req.applicant?._id}`}>
                                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-[0_0_15px_-5px_var(--primary)] cursor-pointer hover:scale-110 transition-transform">
                                                        {req.applicant?.name?.charAt(0) || "U"}
                                                    </div>
                                                </Link>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/users/${req.applicant?._id}`} className="hover:underline">
                                                            <h4 className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{req.applicant?.name || "Unknown User"}</h4>
                                                        </Link>
                                                        <Badge variant="outline" className="text-[10px] h-5 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-muted-foreground">{req.applicant?.experienceLevel || "N/A"}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-0.5">wants to join <span className="font-medium text-foreground">{req.project?.title}</span></p>
                                                    {req.message && <p className="text-xs text-muted-foreground mt-2 bg-card/50 dark:bg-white/5 p-2 rounded border border-border/50 dark:border-white/5 italic">"{req.message}"</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9" onClick={() => handleRequestAction(req._id, 'rejected')}>
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                                <Button size="sm" className="h-9 bg-primary/20 text-primary hover:bg-primary hover:text-white border-0" onClick={() => handleRequestAction(req._id, 'accepted')}>
                                                    <Check className="h-4 w-4 mr-1" /> Accept
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Inbox className="h-6 w-6 opacity-30" />
                                    </div>
                                    <p>No pending requests.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}