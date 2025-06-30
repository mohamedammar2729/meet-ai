'use client';

import Link from '@/components/link';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { BotIcon, StarIcon, VideoIcon } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { DashBoardUserButton } from './dashboard-user-button';


const firstSection = [
  {
    icon: VideoIcon,
    href: '/meeting',
    label: 'Meetings',
  },
  {
    icon: BotIcon,
    href: '/agents',
    label: 'Agents',
  },
];

const secondSection = [
  {
    icon: StarIcon,
    href: '/upgrade',
    label: 'Upgrade',
  },
];

export const SidebarDashboard = () => {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader className='text-sidebar-accent-foreground'>
        <Link href='/' className='flex items-center p-2 gap-2 pt-2'>
          <Image src='/logo.svg' alt='Meet.AI Logo' width={36} height={36} />
          <p className='text-2xl font-semibold'>Meet.AI</p>
        </Link>
        <div className='py-2 px-4'>
          <Separator className='opacity-10 text-[#5D6B68]' />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* first section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'h-10 hover-liner-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50',
                      pathname === item.href &&
                        'bg-linear-to-r/oklch border border-[#5D6B68]/10 '
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className='w-5 h-5 text-sidebar-accent-foreground' />
                      <span className='text-sm font-medium tracking-tight'>
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className='py-2 px-4'>
          <Separator className='opacity-10 text-[#5D6B68]' />
        </div>
        {/* second section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'h-10 hover-liner-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50',
                      pathname === item.href &&
                        'bg-linear-to-r/oklch border border-[#5D6B68]/10 '
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className='w-5 h-5 text-sidebar-accent-foreground' />
                      <span className='text-sm font-medium tracking-tight'>
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='text-white' />
      <DashBoardUserButton />
    </Sidebar>
  );
};
