'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  FolderKanban,
  FilePlus2,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  User,
  ChevronsUpDown,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import NotificationBell from '@/components/ui/NotificationBell';
import SynergyHelp from '@/components/SynergyHelp';

// Fallback data
import { demoUser } from '@/lib/data';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => pathname === path;

  const { data: session } = useSession();

  // Normalize user data
  const user = {
    name: session?.user?.name || demoUser.name,
    email: session?.user?.email || demoUser.email,
    avatar: session?.user?.image || demoUser.avatarUrl,
  };

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    // Redirect to onboarding if not completed
    if (session?.user && (session.user as any).hasCompletedOnboarding === false) {
      router.push("/onboarding");
    }
  }, [session, router]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    await signOut({ callbackUrl: "/" });
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/search', label: 'Search Profiles', icon: Search },
    { href: '/projects', label: 'My Projects', icon: FolderKanban },
    { href: '/projects/new', label: 'Create Project', icon: FilePlus2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const rootPages = ['/dashboard', '/projects', '/settings', '/profile', '/search'];
  const showBackButton = !rootPages.includes(pathname);

  return (
    <SidebarProvider>
      {/* Global Mesh Gradient Background */}
      {/* Global Mesh Gradient Background */}
      <div className="fixed inset-0 bg-background -z-50" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-slate-900 dark:via-[#0a0a0f] dark:to-black -z-50" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-40" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none -z-40 animate-pulse-slow" />

      <Sidebar className="border-r border-border/50 dark:border-white/5 bg-sidebar/30 backdrop-blur-2xl">
        <SidebarHeader className="border-b border-border/50 dark:border-white/5 px-4 py-4">
          <Logo />
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href} className="mb-1">
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                        className={`transition-all duration-300 px-4 py-3 h-auto group relative overflow-hidden ${isActive(item.href)
                          ? 'bg-primary/10 text-primary font-medium shadow-[0_0_20px_-10px_var(--primary)] border-r-2 border-primary'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                          }`}
                      >
                        {isActive(item.href) && (
                          <div className="absolute inset-0 bg-primary/5 blur-md" />
                        )}
                        <item.icon className={`h-5 w-5 relative z-10 ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`} />
                        <span className="text-sm relative z-10">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50 dark:border-white/5">
          <SidebarMenu>
            <SidebarMenuItem>
              {isMounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white/5 transition-colors border border-transparent hover:border-border/20 dark:hover:border-white/5"
                    >
                      <Avatar className="h-9 w-9 rounded-lg border border-border/50 dark:border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                        <span className="truncate font-semibold">{user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-border/50 dark:border-white/10 bg-popover/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
                          <AvatarFallback className="rounded-lg">
                            {user.name ? user.name.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50 dark:bg-white/10" />
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10 focus:text-primary">
                      <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10 focus:text-primary">
                      <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50 dark:bg-white/10" />

                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <SidebarMenuButton size="lg" className="animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-white/5" />
                  <div className="grid flex-1 gap-1 ml-2">
                    <div className="h-3 w-16 rounded bg-white/5" />
                    <div className="h-3 w-24 rounded bg-white/5" />
                  </div>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <header className="flex h-16 items-center gap-4 border-b border-border/50 dark:border-white/5 bg-background/40 backdrop-blur-md px-4 md:px-6 sticky top-0 z-30 transition-all">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

          <div className="flex-1" />

          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 pl-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}

          <div className="flex items-center gap-3">
            <ModeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in-0 duration-700 slide-in-from-bottom-4">
          {children}
        </main>
      </SidebarInset>

      {/* AI Chatbot - Available on all pages */}
      <SynergyHelp />
    </SidebarProvider>
  );
}
