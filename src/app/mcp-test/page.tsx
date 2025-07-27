'use client';

import { useState } from 'react';
import { mcpClient } from '@/utils/mcp-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MCPTestPage() {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testQueries] = useState([
    "What's the weather today in Mumbai?",
    "My tomato plants have yellow leaves, what's wrong?",
    "What are the current market prices for wheat?",
    "Tell me about government schemes for farmers",
    "Get weather data for Pune"
  ]);

  const getServerInfo = async () => {
    setLoading(true);
    try {
      const info = await mcpClient.getServerInfo();
      setServerInfo(info);
    } catch (error) {
      console.error('Error getting server info:', error);
    } finally {
      setLoading(false);
    }
  };

  const callFlow = async () => {
    if (!selectedFlow || !input) return;
    
    setLoading(true);
    try {
      const parsedInput = JSON.parse(input);
      const response = await mcpClient.callFlow(selectedFlow, parsedInput);
      const parsedResponse = mcpClient.parseResponse(response);
      setResult({ raw: response, parsed: parsedResponse });
    } catch (error) {
      console.error('Error calling flow:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const callTool = async () => {
    if (!selectedTool || !input) return;
    
    setLoading(true);
    try {
      const parsedInput = JSON.parse(input);
      const response = await mcpClient.callTool(selectedTool, parsedInput);
      const parsedResponse = mcpClient.parseResponse(response);
      setResult({ raw: response, parsed: parsedResponse });
    } catch (error) {
      console.error('Error calling tool:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async (query: string) => {
    setInput(JSON.stringify({ text: query }));
    setSelectedFlow('askAnything');
    await callFlow();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">KrushiMitra MCP Server Test</h1>
      
      {/* Server Info */}
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={getServerInfo} disabled={loading}>
            {loading ? 'Loading...' : 'Get Server Info'}
          </Button>
          {serverInfo && (
            <div className="mt-4">
              <h3 className="font-semibold">Available Flows:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {serverInfo.flows?.map((flow: string) => (
                  <Badge key={flow} variant="secondary">{flow}</Badge>
                ))}
              </div>
              <h3 className="font-semibold mt-4">Available Tools:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {serverInfo.tools?.map((tool: string) => (
                  <Badge key={tool} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Test Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => testQuery(query)}
                disabled={loading}
              >
                {query.substring(0, 30)}...
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test Flows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="flow-select">Select Flow:</Label>
            <select
              id="flow-select"
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="">Choose a flow...</option>
              {serverInfo?.flows?.map((flow: string) => (
                <option key={flow} value={flow}>{flow}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="flow-input">Input (JSON):</Label>
            <Textarea
              id="flow-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"text": "What is the weather today?"}'
              className="mt-1"
            />
          </div>
          
          <Button onClick={callFlow} disabled={!selectedFlow || !input || loading}>
            {loading ? 'Calling...' : 'Call Flow'}
          </Button>
        </CardContent>
      </Card>

      {/* Tool Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tool-select">Select Tool:</Label>
            <select
              id="tool-select"
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="">Choose a tool...</option>
              {serverInfo?.tools?.map((tool: string) => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="tool-input">Input (JSON):</Label>
            <Textarea
              id="tool-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"location": "Mumbai"}'
              className="mt-1"
            />
          </div>
          
          <Button onClick={callTool} disabled={!selectedTool || !input || loading}>
            {loading ? 'Calling...' : 'Call Tool'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h4 className="font-semibold text-red-800">Error:</h4>
                <p className="text-red-700">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Formatted Response:</h4>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({children}) => <h2 className="text-lg font-semibold mt-4 mb-2 text-blue-600">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-semibold mt-3 mb-1 text-green-600">{children}</h3>,
                          ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                          li: ({children}) => <li className="text-sm">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                          code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</pre>
                        }}
                      >
                        {result.parsed}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Raw Response:</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 