'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  FolderKanban,
  FilePlus2,
  Settings,
  UserCircle,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { demoUser } from '@/lib/data';

// ✅ 1. Import the new Notification Component
import NotificationBell from '@/components/ui/NotificationBell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => pathname === path;
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'My Projects', icon: FolderKanban },
    { href: '/projects/new', label: 'Create Project', icon: FilePlus2 }, 
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // ✅ Define pages where the "Back" button is NOT needed
  const rootPages = ['/dashboard', '/projects', '/settings', '/profile'];
  const showBackButton = !rootPages.includes(pathname);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader><Logo /></SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton isActive={isActive(item.href)} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/login">
                <SidebarMenuButton tooltip="Logout"><LogOut /><span>Logout</span></SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          
          {showBackButton ? (
            <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 pl-2 text-muted-foreground hover:text-foreground"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
            </Button>
          ) : (
             <div className="md:hidden">
                <Logo />
             </div>
          )}

          <div className="ml-auto flex items-center gap-4">
             {/* ✅ 2. Replaced static Bell button with new Component */}
             <NotificationBell />
            
            {isMounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={demoUser.avatarUrl} alt={demoUser.name} />
                      <AvatarFallback>{demoUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/login"><LogOut className="mr-2 h-4 w-4" />Logout</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8"><AvatarFallback>{demoUser.name.charAt(0)}</AvatarFallback></Avatar>
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}