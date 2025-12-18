"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Loader2, BrainCircuit, Send, Clock, CheckCircle, XCircle, Users, ArrowRight, Inbox, Check, X } from 'lucide-react';
import { demoUser } from '@/lib/data'; 
import Link from 'next/link';
import { toast } from "sonner"; // Optional: for toast notifications

// ... NoMatchSuggestions Component (Same as before) ...
const NoMatchSuggestions = () => {
    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="text-primary w-5 h-5"/>
                    No Projects Found
                </CardTitle>
                <CardDescription>
                    Be the first to post a project or wait for others to join!
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
                <Button asChild>
                    <Link href="/projects/new">Create a Project</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(demoUser);
  const [projects, setProjects] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]); // Outgoing
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]); // ✅ Incoming
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check LocalStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    const currentUserId = parsedUser.id || parsedUser._id;
    setUser({ ...demoUser, ...parsedUser });

    // 2. Fetch Latest Profile
    const fetchLatestProfile = async () => { /* ... existing code ... */ };

    // 3. Fetch AI Matches
    const fetchAIProjects = async () => {
        try {
            const res = await fetch("/api/ai/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId }),
            });
            const data = await res.json();
            if (data.projects) setProjects(data.projects);
        } catch (error) { console.error(error); }
    };

    // 4. Fetch My Sent Requests
    const fetchMyRequests = async () => {
        try {
            const res = await fetch("/api/requests/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId }),
            });
            const data = await res.json();
            if (data.requests) setMyRequests(data.requests);
        } catch (error) { console.error(error); }
    };

    // ✅ 5. Fetch Incoming Requests (Inbox)
    const fetchIncomingRequests = async () => {
        try {
            const res = await fetch("/api/requests/owner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId }),
            });
            const data = await res.json();
            if (data.requests) setIncomingRequests(data.requests);
        } catch (error) { console.error(error); }
    };

    if (currentUserId) {
        Promise.all([
            fetchAIProjects(),
            fetchMyRequests(),
            fetchIncomingRequests() // Add this to the list
        ]).finally(() => setLoading(false));
    }
  }, [router]);

  // ✅ Handle Accept / Reject Action
  // ✅ FIXED: Points to correct API "/api/requests"
  const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
      try {
          // 👇 CHANGE THIS URL
          const res = await fetch("/api/requests", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId, status }),
          });
          
          if (res.ok) {
              // Remove from list immediately (Optimistic UI)
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
    switch(status.toLowerCase()) {
        case 'accepted': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1"/> Accepted</Badge>;
        case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
        default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center gap-2"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="text-lg font-medium">Loading Dashboard...</span></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground">Manage your projects and applications.</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 sm:w-auto">
          <TabsTrigger value="projects" className="gap-2"><BrainCircuit className="h-4 w-4" /> Recommended</TabsTrigger>
          <TabsTrigger value="requests" className="gap-2"><Send className="h-4 w-4"/> Applications</TabsTrigger>
          {/* ✅ New Inbox Tab Trigger */}
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4"/> Inbox 
            {incomingRequests.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">{incomingRequests.length}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        {/* === AI PROJECTS TAB === */}
        <TabsContent value="projects" className="space-y-6 mt-6">
            {projects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* ... (Keep your existing project card code exactly as is) ... */}
                    {projects.map((project, index) => (
                         // ... your Project Card JSX ...
                         <Card key={project._id || index} className="flex flex-col border-l-4 border-l-primary/50">
                             <CardHeader>
                                <CardTitle className="font-headline line-clamp-1">{project.title}</CardTitle>
                                <CardDescription>by {project.owner?.name}</CardDescription>
                             </CardHeader>
                             <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{project.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {project.techStack?.slice(0,3).map((t:any, i:number)=><Badge key={i} variant="secondary">{t}</Badge>)}
                                </div>
                             </CardContent>
                             <CardFooter>
                                <Button className="w-full" asChild><Link href={`/projects/${project._id}/collaborate`}>View Project</Link></Button>
                             </CardFooter>
                         </Card>
                    ))}
                </div>
            ) : <NoMatchSuggestions />}
        </TabsContent>

        {/* === OUTGOING REQUESTS TAB (Applications) === */}
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Send className="h-5 w-5"/> Sent Applications</CardTitle>
            </CardHeader>
            <CardContent>
               {/* ... (Keep your existing table code exactly as is) ... */}
               <Table>
                 <TableBody>
                   {myRequests.map((req) => (
                     <TableRow key={req._id}>
                        <TableCell>{req.project?.title}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ === NEW INBOX TAB (Incoming) === */}
        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Inbox className="h-5 w-5"/> Incoming Requests
              </CardTitle>
              <CardDescription>People waiting to join your projects.</CardDescription>
            </CardHeader>
            <CardContent>
              {incomingRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingRequests.map((req) => (
                          <TableRow key={req._id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {req.applicant?.name?.charAt(0) || "U"}
                                    </div>
                                    {req.applicant?.name || "Unknown User"}
                                </div>
                            </TableCell>
                            <TableCell>{req.project?.title}</TableCell>
                            <TableCell><Badge variant="outline">{req.applicant?.experienceLevel || "N/A"}</Badge></TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRequestAction(req._id, 'rejected')}>
                                        <X className="h-4 w-4 mr-1"/> Reject
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req._id, 'accepted')}>
                                        <Check className="h-4 w-4 mr-1"/> Accept
                                    </Button>
                                </div>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-8 text-muted-foreground">
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