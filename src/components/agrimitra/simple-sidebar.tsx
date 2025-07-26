'use client';

import React, { useState } from 'react';
import { 
  Home, MessageCircle, TrendingUp, Cloud, FileText, Calendar,
  Leaf, Activity, Zap, BookOpen, Calculator, ShoppingCart,
  Users, BarChart3, Menu, Settings, ChevronDown, Bot,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';


export default function SimpleSidebar() {
  // Toggle between basic and advanced UI mode
  const [isAdvanced, setIsAdvanced] = useState(false);
  // Toggle sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sidebar quick navigation links
  const quickLinks = [
    { icon: Home, label: 'Home', href: '/', active: true },
    { icon: Activity, label: 'Diagnose', href: '/diagnose' },
    { icon: TrendingUp, label: 'Market', href: '/market' },
    { icon: ShoppingCart, label: 'Marketplace', href: '/marketplace' },
    { icon: FileText, label: 'Schemes', href: '/schemes' },
    { icon: Cloud, label: 'Weather', href: '/weather' },
    { icon: ClipboardList, label: 'Plan', href: '/plan' },
    { icon: Calendar, label: 'History', href: '/history' }
  ];

  // List of recent user chat prompts
  const pastChats = [
    'Check price of tomato',
    'My wheat crop looks yellow',
    'Show fertilizer subsidies',
    'Weather forecast for crops',
    'Pest control for rice'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        
        {/* Logo and App Name */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="ml-3 font-bold text-lg text-gray-900">Agrimitra</span>}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1">
          <div className="p-4">
            {sidebarOpen && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Navigation</h3>}
            <nav className="space-y-2">
              {/* List of quick links */}
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    link.active 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'text-gray-600 hover:bg-gray-100'
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Chats</h3>
              <div className="space-y-2">
                {pastChats.map((chat, index) => (
                  <button
                    key={index}
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
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">{isAdvanced ? 'Advanced' : 'Basic'}</span>}
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
            <h1 className="ml-4 text-xl font-semibold text-green-700">Agrimitra</h1>
          </div>


        </header>

        {/* Main Page Content */}
        <main className="flex-1 px-6 py-8 overflow-y-auto">

          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Agricultural Assistant</h2>
            <p className="text-lg text-gray-600">Smart farming solutions for modern agriculture</p>
          </div>

          {/* Start Chat Button */}
          <div className="flex justify-center mb-12">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl">
              Start Chat / Diagnose Crop Disease
            </button>
          </div>

          {/* Grid of Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: Activity,
                title: 'Diagnose Crop Disease',
                subtitle: 'Upload image or describe symptoms',
                color: 'bg-green-50 border-green-200'
              },
              {
                icon: TrendingUp,
                title: 'Real-Time Market Analysis',
                subtitle: 'Get latest prices and trends',
                color: 'bg-blue-50 border-blue-200'
              },
              {
                icon: FileText,
                title: 'Government Scheme Info',
                subtitle: 'Find relevant schemes & subsidies',
                color: 'bg-purple-50 border-purple-200'
              },
              {
                icon: Cloud,
                title: 'Weather & Irrigation Tips',
                subtitle: 'Forecasts and water management',
                color: 'bg-cyan-50 border-cyan-200'
              }
            ].map((feature, index) => (
              <button
                key={index}
                className={`${feature.color} border-2 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105`}
              >
                <feature.icon className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Quick Chat Prompts */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
            <div className="flex justify-center space-x-8 text-sm">
              <button className="text-green-600 hover:text-green-700 font-medium">Check price of tomato</button>
              <button className="text-green-600 hover:text-green-700 font-medium">My wheat crop looks yellow</button>
              <button className="text-green-600 hover:text-green-700 font-medium">Show fertilizer subsidies</button>
            </div>
          </div>

          {/* Crop Management Tools */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center text-green-700">
              Crop Management & Decision Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Leaf,
                  title: 'Crop Growth Process Advisor',
                  subtitle: 'Track crop lifecycle and get intelligent farming suggestions'
                },
                {
                  icon: Zap,
                  title: 'Instant Crop Disease Diagnosis',
                  subtitle: 'Detect diseases from crop images using AI'
                },
                {
                  icon: BookOpen,
                  title: 'Agricultural Knowledge Hub',
                  subtitle: 'Access articles and guides about farming best practices'
                }
              ].map((tool, index) => (
                <button
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:border-green-300"
                >
                  <tool.icon className="w-8 h-8 text-green-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h4>
                  <p className="text-sm text-gray-600">{tool.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace & Finance Tools */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center text-green-700">
              Marketplace & Financial Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Calculator,
                  title: 'Profitability Calculator',
                  subtitle: 'Analyze costs and profits for different crops'
                },
                {
                  icon: ShoppingCart,
                  title: 'Farming Marketplace',
                  subtitle: 'Buy and sell agricultural products'
                },
                {
                  icon: Users,
                  title: 'Community Commerce',
                  subtitle: 'Trade with nearby farmers'
                },
                {
                  icon: BarChart3,
                  title: 'Real-Time Market Insights',
                  subtitle: 'Get live market prices and future price predictions'
                }
              ].map((tool, index) => (
                <button
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:border-green-300"
                >
                  <tool.icon className="w-8 h-8 text-green-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h4>
                  <p className="text-sm text-gray-600">{tool.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 