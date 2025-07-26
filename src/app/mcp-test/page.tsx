'use client';

import { useState } from 'react';
import { mcpClient } from '@/utils/mcp-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function MCPTestPage() {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
      setResult(response);
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
      setResult(response);
    } catch (error) {
      console.error('Error calling tool:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
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
              <ul className="list-disc list-inside mt-2">
                {serverInfo.flows?.map((flow: string) => (
                  <li key={flow}>{flow}</li>
                ))}
              </ul>
              <h3 className="font-semibold mt-4">Available Tools:</h3>
              <ul className="list-disc list-inside mt-2">
                {serverInfo.tools?.map((tool: string) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          )}
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
              placeholder='{"text": "Hello world"}'
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
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 