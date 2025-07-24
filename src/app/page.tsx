'use client';

import AppLayout from '@/components/agrimitra/app-layout';
import { 
  Activity, TrendingUp, FileText, Cloud, Bot, Send, Mic
} from 'lucide-react';

export default function Home() {
  const quickPrompts = [
    'Check price of tomato',
    'My wheat crop looks yellow',
    'Show fertilizer subsidies',
    'Weather forecast for crops',
    'Pest control for rice'
  ];

  return (
    <AppLayout title="KrushiMitra" subtitle="AI-Powered Agricultural Assistant">
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Agricultural Assistant</h2>
            <p className="text-lg text-gray-600">Smart farming solutions for modern agriculture</p>
          </div>

                  {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <Bot className="w-8 h-8 text-green-600 mr-3" />
            <span className="text-2xl font-semibold text-green-700">Talk to KrushiMitra</span>
          </div>
          
          <p className="text-gray-600 text-center mb-6">
            Get instant answers, advice, and support for your farming needs.
          </p>

          <div className="max-w-2xl mx-auto">
            <textarea
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Ask me anything about farming - crop diseases, market prices, weather, subsidies..."
            />
            <div className="flex justify-between items-center mt-4">
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Send
              </button>
              <button className="flex items-center px-6 py-3 bg-gray-100 hover:bg-green-100 text-green-700 rounded-xl font-medium transition-colors">
                <Mic className="w-4 h-4 mr-2" />
                Speak
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-3 text-center">Quick prompts to get started:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="text-sm text-green-600 hover:text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg border border-green-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Crop Management Tools */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center text-green-700">
              Crop Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Activity,
                  title: 'Crop Growth Process Advisor',
                  subtitle: 'Track crop lifecycle and get intelligent farming suggestions'
                },
                {
                  icon: Activity,
                  title: 'Instant Crop Disease Diagnosis',
                  subtitle: 'Detect diseases from crop images using AI'
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
                  icon: TrendingUp,
                  title: 'Profitability Calculator & Finance Manager',
                  subtitle: 'Analyze costs and profits for your farm operations'
                },
                {
                  icon: TrendingUp,
                  title: 'Farming Marketplace',
                  subtitle: 'Buy and sell farming products from verified vendors'
                },
                {
                  icon: TrendingUp,
                  title: 'Community Commerce (P2P Trading)',
                  subtitle: 'Trade tools and produce with nearby farmers'
                },
                {
                  icon: TrendingUp,
                  title: 'Real-Time Market Insights',
                  subtitle: 'Get live market prices and future price forecasts'
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
        </div>
      </div>
    </AppLayout>
  );
}
