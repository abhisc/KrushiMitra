'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, TrendingUp, FileText, Cloud, Calendar, 
  Search, Filter, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock history data
  const historyData = [
    {
      id: 1,
      type: 'Diagnose',
      title: 'Crop Disease Diagnosis',
      description: 'Uploaded image of wheat crop with yellow spots',
      status: 'completed',
      timestamp: '2024-01-15T10:30:00Z',
      result: 'Identified: Wheat Rust (Confidence: 85%)',
      icon: Activity
    },
    {
      id: 2,
      type: 'Market',
      title: 'Market Analysis',
      description: 'Checked prices for tomatoes in Mumbai market',
      status: 'completed',
      timestamp: '2024-01-15T09:15:00Z',
      result: 'Current Price: ₹2,500/quintal (↗️ Increasing)',
      icon: TrendingUp
    },
    {
      id: 3,
      type: 'Schemes',
      title: 'Government Schemes',
      description: 'Searched for fertilizer subsidies in Maharashtra',
      status: 'completed',
      timestamp: '2024-01-14T16:45:00Z',
      result: 'Found 5 relevant schemes',
      icon: FileText
    },
    {
      id: 4,
      type: 'Weather',
      title: 'Weather & Irrigation',
      description: 'Weather forecast for rice crop in Bangalore',
      status: 'completed',
      timestamp: '2024-01-14T14:20:00Z',
      result: 'Temperature: 28°C, Humidity: 65%',
      icon: Cloud
    },
    {
      id: 5,
      type: 'Diagnose',
      title: 'Crop Disease Diagnosis',
      description: 'Described symptoms of potato crop disease',
      status: 'failed',
      timestamp: '2024-01-13T11:10:00Z',
      result: 'Unable to process request',
      icon: Activity
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout 
      title="Activity History" 
      subtitle="View your past interactions and AI consultations"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold">{historyData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{historyData.filter(item => item.status === 'completed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold">{historyData.filter(item => item.status === 'failed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">{historyData.filter(item => {
                      const itemDate = new Date(item.timestamp);
                      const now = new Date();
                      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                    }).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="diagnose">Diagnose</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="schemes">Schemes</SelectItem>
                      <SelectItem value="weather">Weather</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(item.timestamp)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {item.result && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Result:</span> {item.result}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activities found matching your filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 