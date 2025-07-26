'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Globe, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/agrimitra/app-layout';
import ErrorBoundary from '@/components/error-boundary';

export default function ExpertConnectPage() {
  const router = useRouter();
  return (
    <ErrorBoundary>
      <AppLayout
        title="Expert & Community Hub"
        subtitle="Connect with agricultural experts and join farmer communities for personalized advice."
        showBackButton={true}
      >
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Find an Expert Column */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-700 mb-2">Find an Expert</h2>
                <p className="text-gray-600">Connect with agricultural specialists in your region</p>
              </div>
              
              <Link href="/expert-connect/match" className="block">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-green-100 hover:border-green-300">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Browse Experts</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Find agriculture experts by location. Get direct contact information and call them for personalized advice.
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Find Experts
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Additional Expert Features */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">💡 Expert Features</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Location-based expert search</li>
                  <li>• Direct phone contact</li>
                  <li>• Specialized crop advice</li>
                  <li>• Regional expertise</li>
                </ul>
              </div>
            </div>

            {/* Community Forum Column */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-700 mb-2">Community Forum</h2>
                <p className="text-gray-600">Connect with fellow farmers and share knowledge</p>
              </div>
              
              <Link href="/expert-connect/community" className="block">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-green-100 hover:border-green-300">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Globe className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Join Discussions</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Participate in farmer forums, ask questions, and share experiences with the agricultural community.
                  </p>
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Join Forum
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Additional Community Features */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">🌱 Community Features</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• KVK forums</li>
                  <li>• Farmer-scientist discussions</li>
                  <li>• Regional language support</li>
                  <li>• Photo sharing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section - Quick Access */}
          <div className="mt-12 bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <div className="text-2xl mb-2">📞</div>
                <h4 className="font-semibold text-gray-900 mb-1">Kisan Call Center</h4>
                <p className="text-sm text-gray-600 mb-2">Free agricultural helpline</p>
                <a href="tel:18001801551" className="text-green-600 font-medium hover:text-green-700">
                  1800-180-1551
                </a>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow">
                <div className="text-2xl mb-2">🌐</div>
                <h4 className="font-semibold text-gray-900 mb-1">Online Resources</h4>
                <p className="text-sm text-gray-600 mb-2">Government schemes & info</p>
                <a href="https://dackkms.gov.in/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:text-blue-700">
                  Visit Website
                </a>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
} 