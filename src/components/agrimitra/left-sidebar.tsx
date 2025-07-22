'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger, // Import SidebarTrigger
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Leaf, LineChart, Landmark, Droplets, History, Wheat } from 'lucide-react';

export default function LeftSidebar() {
  return (
    // Set collapsible to "offcanvas" and control open state
    <Sidebar collapsible="offcanvas" side="left">
      <SidebarHeader className="items-center justify-center text-center">
        <Wheat className="w-8 h-8 text-primary" />
        <h2 className="font-bold text-xl font-headline group-data-[collapsible=icon]:hidden">
          Agrimitra
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton tooltip="Home" isActive={false}>
                <Home className="w-5 h-5" />
                <span>Home</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/diagnose">
              <SidebarMenuButton tooltip="Diagnose Crop Disease" isActive={false}>
                <Leaf className="w-5 h-5" />
                <span>Diagnose</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/market">
              <SidebarMenuButton tooltip="Market Analysis" isActive={false}>
                <LineChart className="w-5 h-5" />
                <span>Market</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/schemes">
              <SidebarMenuButton tooltip="Government Schemes" isActive={false}>
                <Landmark className="w-5 h-5" />
                <span>Schemes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/weather">
              <SidebarMenuButton tooltip="Weather & Irrigation" isActive={false}>
                <Droplets className="w-5 h-5" />
                <span>Weather</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/history">
              <SidebarMenuButton tooltip="History" isActive={false}>
                <History className="w-5 h-5" />
                <span>History</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
