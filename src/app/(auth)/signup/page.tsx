"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, PlusCircle, Loader2, Sparkles, User, Mail, Lock, Briefcase, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';
import { toast } from "sonner";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    experienceLevel: '',
    bio: ''
  });

  const [skills, setSkills] = useState<{ name: string, level: string, mode: string }[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const addSkill = () => {
    if (currentSkill && !skills.find(s => s.name.toLowerCase() === currentSkill.toLowerCase())) {
      setSkills([...skills, { name: currentSkill, level: 'Beginner', mode: 'Learner' }]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillName: string) => {
    setSkills(skills.filter(s => s.name !== skillName));
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData, skills };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account Created! 🎉", {
          description: "Redirecting to login...",
          action: {
            label: "Login Now",
            onClick: () => router.push("/login"),
          },
        });

        setTimeout(() => {
          router.push("/login");
        }, 1500);

      } else {
        toast.error("Signup Failed", {
          description: data.error || "Please try again."
        });
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error("Connection Error", {
        description: "Something went wrong. Please check your connection."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12 relative overflow-hidden bg-background">
      {/* Luminous Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="shadow-2xl border-border/50 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <CardHeader className="text-center space-y-2 pt-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-secondary/50 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-lg shadow-primary/10">
                <Logo />
              </div>
            </div>
            <CardTitle className="font-headline text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-white/60">Create Your Account</CardTitle>
            <CardDescription className="text-lg font-light text-muted-foreground">Join the SynergyHub community today.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSignup}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2 group">
                  <Label htmlFor="name" className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      placeholder="Alex Doe"
                      required
                      className="pl-10 h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="email" className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="pl-10 h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="password" className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      required
                      className="pl-10 h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="experience" className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Experience Level</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                    <SelectTrigger className="h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-black/90 border-border/50 dark:border-white/10 backdrop-blur-xl">
                      <SelectItem value="Beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="Intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="Advanced">Advanced (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className="space-y-2 group">
                <Label htmlFor="bio" className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself... (e.g. Full-stack developer passionate about AI)"
                  className="min-h-[100px] border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg resize-y"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label className="ml-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Skills</Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g., React, Figma (Press Enter to add)"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    className="h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="outline" size="icon" className="shrink-0 h-11 w-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 hover:bg-muted/80 hover:text-primary transition-colors">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-secondary/30 dark:bg-black/20 border border-dashed border-border/50 dark:border-white/10">
                  {skills.length === 0 && <span className="text-sm text-muted-foreground w-full text-center py-1 opacity-50">Type a skill and press Enter</span>}
                  {skills.map(skill => (
                    <Badge key={skill.name} variant="secondary" className="pl-3 pr-1.5 py-1.5 h-8 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm">
                      {skill.name}
                      <button type="button" onClick={() => removeSkill(skill.name)} className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col gap-6 pt-4 pb-8">
              <Button className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--primary)] transition-all hover:scale-[1.02] group" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>Create Account <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" /></>
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-white/80 dark:bg-black/40 px-3 text-muted-foreground rounded-full backdrop-blur-xl">Or continue with</span>
                </div>
              </div>

              <GoogleLoginButton />

              <div className="mt-4 text-center text-sm text-muted-foreground/60">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline">
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}