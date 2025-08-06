"use client";

import React, { useState } from "react";
import {
	Home,
	MessageCircle,
	TrendingUp,
	Cloud,
	FileText,
	Calendar,
	Leaf,
	Activity,
	Zap,
	BookOpen,
	Calculator,
	ShoppingCart,
	Users,
	BarChart3,
	Menu,
	Settings,
	ChevronDown,
	Bot,
	ArrowLeft,
	Sprout,
	User as UserIcon,
	ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import RightSidebar from "./right-sidebar";
import { toast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/auth/user-menu";
import { useChat } from "@/hooks/use-chat";
import { ChatType } from "@/firebaseStore/services/chat-service";
import { LanguageMenu } from "@/components/ui/language-menu";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/hooks/use-translation";

import { useNavigationHistory } from "@/hooks/use-navigation-history";

interface AppLayoutProps {
	children: React.ReactNode;
	showBackButton?: boolean;
	title?: React.ReactNode;
	subtitle?: React.ReactNode;
	handleHistoryChatClick?: (text: string) => void;
	onBack?: () => void;
}

export default function AppLayout({
	children,
	showBackButton = false,
	title,
	subtitle,
	handleHistoryChatClick,
	onBack,
}: AppLayoutProps) {
	// Toggle between basic and advanced UI mode
	const [isAdvanced, setIsAdvanced] = useState(false);
	// Toggle sidebar visibility
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const { getPreviousPath } = useNavigationHistory();
	const { currentLanguage } = useLanguage();
	const { t } = useTranslation();

	// Chat hook for recent chats
	const { recentChats, loading: chatsLoading } = useChat();

	// Sidebar quick navigation links
	const quickLinks = [
		{ icon: Home, label: "Home", href: "/", active: pathname === "/" },
		{
			icon: Activity,
			label: t("diagnose"),
			href: "/diagnose",
			active: pathname === "/diagnose",
		},
		{
			icon: TrendingUp,
			label: t("market"),
			href: "/market",
			active: pathname === "/market",
		},
		{
			icon: ShoppingCart,
			label: "Marketplace",
			href: "/marketplace",
			active: pathname === "/marketplace",
		},
		{
			icon: FileText,
			label: t("schemes"),
			href: "/schemes",
			active: pathname === "/schemes",
		},
		{
			icon: Cloud,
			label: t("weather"),
			href: "/weather",
			active: pathname === "/weather",
		},
		{
			icon: ClipboardList,
			label: "Plan",
			href: "/plan",
			active: pathname === "/plan",
		},
		{
			icon: BookOpen,
			label: "My Journal",
			href: "/journal",
			active: pathname === "/journal",
		},
		{
			icon: Calculator,
			label: "CropCashFlow",
			href: "/crop-cash-flow",
			active: pathname === "/crop-cash-flow",
		},
		{
			icon: Users, // or MessageCircle
			label: "Expert Connect",
			href: "/expert-connect",
			active: pathname === "/expert-connect",
		},
		{
			icon: Bot,
			label: "General Chat MCP",
			href: "/general-mcp-chat",
			active: pathname === "/general-mcp-chat",
		},
		{
			icon: Sprout,
			label: "Plantation Flows",
			href: "/plantationFlow",
			active: pathname === "/plantationFlow",
		},
	];

	// List of recent user chat prompts
	const pastChats = [
		"Check price of tomato",
		"My wheat crop looks yellow",
		"Show fertilizer subsidies",
		"Weather forecast for crops",
		"Pest control for rice",
	];

	const handleBack = () => {
		if (onBack) {
			// Use custom onBack function if provided
			onBack();
		} else {
			// Get the previous path from our navigation history
			const previousPath = getPreviousPath();

			if (previousPath && previousPath !== pathname) {
				// Navigate to the previous path
				router.push(previousPath);
			} else {
				// Fallback to home page if no previous path or same page
				router.push("/");
			}
		}
	};

	return (
		<div className="h-screen bg-gray-50 flex">
			{/* Left Sidebar */}
			<div
				onMouseEnter={() => setSidebarOpen(true)}
				onMouseLeave={() => setSidebarOpen(false)}
				className={`${sidebarOpen ? "w-64" : "w-16"} bg-card border-r border-border transition-all duration-300 flex flex-col`}
			>
				{/* Logo and App Name */}
				<div className="p-4 border-b border-border flex items-center">
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<Leaf className="w-5 h-5 text-primary-foreground" />
					</div>
					{sidebarOpen && (
						<span className="ml-3 font-bold text-lg text-foreground">
							Agrimitra
						</span>
					)}
				</div>

				{/* Sidebar Navigation */}
				<div className="flex-1">
					<div className="p-4">
						{sidebarOpen && (
							<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
								Navigation
							</h3>
						)}
						<nav className="space-y-2">
							{/* List of quick links */}
							{quickLinks.map((link, index) => (
								<Link
									key={index}
									href={link.href}
									className={`w-full flex items-center ${sidebarOpen ? "px-3 py-2" : "p-1.5"} rounded-lg text-sm font-medium transition-colors ${
										link.active
											? "bg-primary/10 text-primary border border-primary/20"
											: "text-muted-foreground hover:bg-accent"
									}`}
								>
									<link.icon className="w-5 h-5" />
									{sidebarOpen && <span className="ml-3">{link.label}</span>}
								</Link>
							))}
						</nav>
					</div>

					{/* Recently used chat prompts */}
					{sidebarOpen && (
						<div className="p-4 border-t border-border">
							<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
								Recent Chats
							</h3>
							<div className="space-y-2">
								{chatsLoading ? (
									<div className="text-xs text-muted-foreground">
										Loading chats...
									</div>
								) : recentChats.length > 0 ? (
									recentChats.map((chat) => (
										<button
											key={chat.id}
											onClick={() => {
												if (handleHistoryChatClick) {
													handleHistoryChatClick(chat.lastMessage);
												} else {
													toast({
														title: "Action unavailable",
														description:
															"Cannot handle chat history click at this time.",
														variant: "destructive",
													});
												}
											}}
											className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors line-clamp-2"
										>
											<MessageCircle className="w-4 h-4 inline mr-2 text-muted-foreground" />
											<div className="text-xs">
												<div className="font-medium text-foreground">
													{chat.title}
												</div>
												<div className="text-muted-foreground line-clamp-1">
													{chat.lastMessage}
												</div>
											</div>
										</button>
									))
								) : (
									<div className="text-xs text-muted-foreground">
										No recent chats
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Toggle for Basic / Advanced mode */}
				<div className="p-4 border-t border-border">
					<button
						onClick={() => setIsAdvanced(!isAdvanced)}
						className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
							isAdvanced
								? "bg-primary/10 text-primary border border-primary/20"
								: "bg-muted text-muted-foreground border border-border"
						}`}
					>
						<Settings className="w-4 h-4" />
						{sidebarOpen && (
							<span className="ml-2">{isAdvanced ? "Advanced" : "Basic"}</span>
						)}
					</button>
				</div>
			</div>

			{/* Right side: Main content area */}
			<div className="flex-1 flex flex-col">
				{/* Top Header Bar */}
				<header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
					<div className="flex items-center">
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="p-2 hover:bg-accent rounded-lg transition-colors"
						>
							<Menu className="w-5 h-5 text-muted-foreground" />
						</button>

						{showBackButton && (
							<button
								onClick={onBack ? onBack : handleBack}
								className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<ArrowLeft className="w-5 h-5 text-muted-foreground" />
							</button>
						)}

						<div className="ml-4 top-0 static">
							<h1 className="text-xl font-semibold text-primary">
								{title ? title : "Agrimitra"}
							</h1>
							{subtitle && (
								<p className="text-sm text-muted-foreground">{subtitle}</p>
							)}
						</div>
					</div>

					{/* User Menu, Language Menu, and Settings */}
					<div className="flex items-center space-x-4">
						{/* User Menu */}
						<UserMenu />

						{/* Language Menu */}
						<LanguageMenu 
							onLanguageChange={(language) => {
								console.log("Language changed to:", language);
								// Language change is handled by the context
							}}
						/>

						{/* Settings Button */}
						<RightSidebar>
							<button className="p-2 hover:bg-accent rounded-lg transition-colors">
								<Settings className="w-5 h-5 text-muted-foreground" />
							</button>
						</RightSidebar>
					</div>
				</header>

				{/* Main Page Content */}
				<main className="flex-1 overflow-y-auto bg-background">{children}</main>
			</div>
		</div>
	);
}
