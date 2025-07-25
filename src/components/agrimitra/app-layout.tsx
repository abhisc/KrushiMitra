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
	User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import RightSidebar from "./right-sidebar";
import { getRecentInputs } from "@/utils/localStorage";
import { toast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/auth/user-menu";

interface AppLayoutProps {
	children: React.ReactNode;
	showBackButton?: boolean;
	title?: string;
	subtitle?: string;
	handleHistoryChatClick?: (text: string) => void;
}

export default function AppLayout({
	children,
	showBackButton = false,
	title,
	subtitle,
	handleHistoryChatClick,
}: AppLayoutProps) {
	// React state for selected language
	const [selectedLanguage, setSelectedLanguage] = useState("EN");
	// Toggle between basic and advanced UI mode
	const [isAdvanced, setIsAdvanced] = useState(false);
	// Toggle sidebar visibility
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// Supported languages
	const languages = [
		{ code: "EN", name: "English" },
		{ code: "HI", name: "हिन्दी" },
		{ code: "KN", name: "ಕನ್ನಡ" },
		{ code: "TA", name: "தமிழ்" },
	];

	// Sidebar quick navigation links
	const quickLinks = [
		{ icon: Home, label: "Home", href: "/", active: pathname === "/" },
		{
			icon: Activity,
			label: "Diagnose",
			href: "/diagnose",
			active: pathname === "/diagnose",
		},
		{
			icon: TrendingUp,
			label: "Market",
			href: "/market",
			active: pathname === "/market",
		},
		{
			icon: FileText,
			label: "Schemes",
			href: "/schemes",
			active: pathname === "/schemes",
		},
		{
			icon: Cloud,
			label: "Weather",
			href: "/weather",
			active: pathname === "/weather",
		},
		{
			icon: Calendar,
			label: "History",
			href: "/history",
			active: pathname === "/history",
		},
		{
			icon: BookOpen,
			label: "Farm Journal",
			href: "/app-journal",
			active: pathname === "/app-journal",
		},
		{
			icon: UserIcon,
			label: "Profile",
			href: "/profile",
			active: pathname === "/profile",
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
		router.push("/");
	};

	return (
		<div className="max-h-screen bg-gray-50 flex">
			{/* Left Sidebar */}
			<div
				onMouseEnter={() => setSidebarOpen(true)}
				onMouseLeave={() => setSidebarOpen(false)}
				className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
			>
				{/* Logo and App Name */}
				<div className="p-4 border-b border-gray-200 flex items-center">
					<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
						<Leaf className="w-5 h-5 text-white" />
					</div>
					{sidebarOpen && (
						<span className="ml-3 font-bold text-lg text-gray-900">
							Agrimitra
						</span>
					)}
				</div>

				{/* Sidebar Navigation */}
				<div className="flex-1">
					<div className="p-4">
						{sidebarOpen && (
							<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
											? "bg-green-100 text-green-700 border border-green-200"
											: "text-gray-600 hover:bg-gray-100"
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
						<div className="p-4 border-t border-gray-100">
							<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
								Recent Chats
							</h3>
							<div className="space-y-2">
								{getRecentInputs().map((chat, index) => (
									<button
										key={index}
										onClick={() => {
											if (handleHistoryChatClick) {
												handleHistoryChatClick(chat);
											} else {
												toast({
													title: "Action unavailable",
													description:
														"Cannot handle chat history click at this time.",
													variant: "destructive",
												});
											}
										}}
										className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors line-clamp-2"
									>
										<MessageCircle className="w-4 h-4 inline mr-2 text-gray-400" />
										<span className="text-xs">{chat}</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Toggle for Basic / Advanced mode */}
				<div className="p-4 border-t border-gray-200">
					<button
						onClick={() => setIsAdvanced(!isAdvanced)}
						className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
							isAdvanced
								? "bg-blue-100 text-blue-700 border border-blue-200"
								: "bg-gray-100 text-gray-700 border border-gray-200"
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
				<header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
					<div className="flex items-center">
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<Menu className="w-5 h-5 text-gray-600" />
						</button>

						{showBackButton && (
							<button
								onClick={handleBack}
								className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<ArrowLeft className="w-5 h-5 text-gray-600" />
							</button>
						)}

						<div className="ml-4 top-0 static">
							<h1 className="text-xl font-semibold text-green-700">
								{title || "Agrimitra"}
							</h1>
							{subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
						</div>
					</div>

					{/* Language Selector and Settings */}
					<div className="flex items-center space-x-4">
						{/* Language Selector */}
						<div className="relative">
							<select
								value={selectedLanguage}
								onChange={(e) => setSelectedLanguage(e.target.value)}
								className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
							>
								{languages.map((lang) => (
									<option key={lang.code} value={lang.code}>
										{lang.name}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
						</div>

						{/* User Menu */}
						<UserMenu />

						{/* Settings Button */}
						<RightSidebar>
							<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
								<Settings className="w-5 h-5 text-gray-600" />
							</button>
						</RightSidebar>
					</div>
				</header>

				{/* Main Page Content */}
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}
