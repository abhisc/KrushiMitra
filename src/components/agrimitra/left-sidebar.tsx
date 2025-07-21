'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { MessageSquare, Wheat } from 'lucide-react';

const pastChats = [
  { id: 1, title: 'Tomato price in Delhi', icon: <MessageSquare /> },
  { id: 2, 'title': 'Paddy disease symptoms', icon: <MessageSquare /> },
  { id: 3, 'title': 'Weather for next week', icon: <MessageSquare /> },
  { id: 4, 'title': 'PM Kisan scheme details', icon: <MessageSquare /> },
];

export default function LeftSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center justify-center text-center">
        <Wheat className="w-8 h-8 text-primary" />
        <h2 className="font-bold text-xl font-headline group-data-[collapsible=icon]:hidden">
          Agrimitra
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {pastChats.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton tooltip={chat.title} isActive={false}>
                {chat.icon}
                <span>{chat.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
