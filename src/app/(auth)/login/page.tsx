"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Login Failed", {
          description: "Invalid email or password.",
        });
      } else {
        toast.success("Login successful!", {
          description: "Welcome back to SynergyHub.",
        });

        router.push("/dashboard");
        router.refresh();
      }

    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Connection Error", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Mesh Gradients - Luminous Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-border/50 bg-white/80 dark:bg-black/40 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <CardHeader className="text-center space-y-2 pb-6 pt-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-secondary/50 dark:bg-white/5 border border-border/50 dark:border-white/10 shadow-lg shadow-primary/10">
                <Logo />
              </div>
            </div>
            <CardTitle className="font-headline text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-white/60">Welcome Back</CardTitle>
            <CardDescription className="text-lg font-light text-muted-foreground">Enter your credentials to access your workspace.</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 disabled:opacity-50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary/70 hover:text-primary transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-5 pt-2 pb-8">
              <Button className="w-full h-11 font-medium text-base bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--primary)] transition-all hover:scale-[1.02]" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  <>
                    Sign In with Email <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
                  </>
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
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline">
                  Sign up for free
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer info/legal small text could go here */}
        <p className="text-center text-xs text-muted-foreground/30 mt-8">
          &copy; {new Date().getFullYear()} SynergyHub AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}