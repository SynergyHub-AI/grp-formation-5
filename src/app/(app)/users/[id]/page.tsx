"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Loader2, Mail, Globe, Github, Linkedin, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await fetch("/api/users/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    console.error("Failed to fetch user");
                }
            } catch (error) {
                console.error("Error fetching user profile", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!user) return (
        <div className="flex flex-col h-screen items-center justify-center gap-4 text-muted-foreground">
            <h2 className="text-xl font-semibold">User not found</h2>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    const hasSocials = user.socialLinks && Object.values(user.socialLinks).some(link => link);

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:bg-transparent hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl shadow-lg">
                <div className="h-32 bg-gradient-to-r from-primary/20 via-violet-500/10 to-blue-500/20" />

                <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-start -mt-12">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                        <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
                        <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2 mt-12 md:mt-14">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                                <p className="text-muted-foreground font-medium text-lg">{user.jobTitle || "Member"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                            {/* Mask email for privacy if viewing public profile, or show if needed. For now showing it. */}
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                            <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-semibold">{user.experienceLevel || "Level 1"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Bio & Skills */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl border-border/40">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {user.bio || "No bio provided."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl border-border/40">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Skills & Expertise</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.skills && user.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {user.skills.map((skill: any, index: number) => {
                                        const skillName = typeof skill === 'string' ? skill : skill.name;
                                        return (
                                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm border-border/50 bg-background/50">
                                                {skillName}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-6 border-2 border-dashed border-border/30 rounded-lg">
                                    <p className="text-muted-foreground">No skills listed.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Reputation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Level</span>
                                <span className="font-bold text-foreground">{user.experienceLevel || "Beginner"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Links Card */}
                    {hasSocials && (
                        <Card className="bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl border-border/40">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /> Connect</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {user.socialLinks?.github && (
                                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md group-hover:scale-105 transition-transform"><Github className="w-4 h-4" /></div>
                                        <span className="text-sm font-medium">GitHub</span>
                                    </a>
                                )}
                                {user.socialLinks?.linkedin && (
                                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md group-hover:scale-105 transition-transform"><Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                                        <span className="text-sm font-medium">LinkedIn</span>
                                    </a>
                                )}
                                {user.socialLinks?.portfolio && (
                                    <a href={user.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-md group-hover:scale-105 transition-transform"><Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                                        <span className="text-sm font-medium">Portfolio</span>
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
