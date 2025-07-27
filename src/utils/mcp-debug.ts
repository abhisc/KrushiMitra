/**
 * MCP Debug utility for troubleshooting issues
 */

export class MCPDebugger {
  private static instance: MCPDebugger;
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = [];

  static getInstance(): MCPDebugger {
    if (!MCPDebugger.instance) {
      MCPDebugger.instance = new MCPDebugger();
    }
    return MCPDebugger.instance;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };
    this.logs.push(logEntry);
    console.log(`[MCP ${level.toUpperCase()}] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // Analyze intent detection
  analyzeIntent(userInput: string, detectedIntent: any) {
    this.info('Intent Analysis', {
      userInput,
      detectedIntent,
      analysis: {
        hasWeatherKeywords: /weather|temperature|climate|rain/.test(userInput.toLowerCase()),
        hasDiseaseKeywords: /disease|sick|problem|crop|plant/.test(userInput.toLowerCase()),
        hasMarketKeywords: /market|price|sell|buy/.test(userInput.toLowerCase()),
        hasSchemeKeywords: /scheme|government|subsidy/.test(userInput.toLowerCase()),
      }
    });
  }

  // Analyze response parsing
  analyzeResponse(originalResponse: any, parsedResponse: string) {
    this.info('Response Analysis', {
      originalResponseType: typeof originalResponse,
      originalResponseKeys: originalResponse && typeof originalResponse === 'object' ? Object.keys(originalResponse) : null,
      parsedResponse,
      hasResponseField: originalResponse && typeof originalResponse === 'object' && 'response' in originalResponse,
      hasResultField: originalResponse && typeof originalResponse === 'object' && 'result' in originalResponse,
    });
  }
}

export const mcpDebugger = MCPDebugger.getInstance(); 