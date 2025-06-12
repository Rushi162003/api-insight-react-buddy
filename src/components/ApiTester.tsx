import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface ApiResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing: number;
}

const ApiTester = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [headers, setHeaders] = useState('{"Content-Type": "application/json"}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const makeRequest = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        parsedHeaders = {};
      }

      // Use CORS proxy if enabled
      const requestUrl = useCorsProxy 
        ? `https://cors-anywhere.herokuapp.com/${url}`
        : url;

      const requestOptions: RequestInit = {
        method,
        headers: parsedHeaders,
        mode: useCorsProxy ? 'cors' : 'cors',
      };

      if (method !== 'GET' && method !== 'HEAD' && requestBody.trim()) {
        requestOptions.body = requestBody;
      }

      console.log('Making request to:', requestUrl);
      console.log('Request options:', requestOptions);

      const res = await fetch(requestUrl, requestOptions);
      const endTime = performance.now();
      const timing = Math.round(endTime - startTime);

      let responseData;
      const contentType = res.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await res.json();
        } catch {
          responseData = await res.text();
        }
      } else {
        responseData = await res.text();
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        data: responseData,
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        timing
      });

      toast({
        title: "Request Completed",
        description: `Response received in ${timing}ms`,
      });

    } catch (err) {
      const endTime = performance.now();
      const timing = Math.round(endTime - startTime);
      
      let errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Check if it's a CORS error
      if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
        errorMessage = `CORS Error: ${errorMessage}. Try enabling CORS proxy or configure the server to allow cross-origin requests.`;
      }
      
      console.error('Request failed:', err);
      setError(errorMessage);
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">API Tester</h1>
        <p className="text-muted-foreground">Test your backend APIs with CORS handling</p>
      </div>

      {/* CORS Warning */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800 mb-2">CORS Issues?</h3>
              <p className="text-sm text-orange-700 mb-3">
                If you get CORS errors, try enabling the CORS proxy below or ask the API server owner to add CORS headers.
              </p>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cors-proxy"
                  checked={useCorsProxy}
                  onCheckedChange={setUseCorsProxy}
                />
                <Label htmlFor="cors-proxy" className="text-sm font-medium text-orange-800">
                  Use CORS Proxy (for testing only)
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL and Method */}
            <div className="flex gap-2">
              <div className="w-32">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Enter API URL (e.g., https://jsonplaceholder.typicode.com/posts/1)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <Label htmlFor="headers" className="text-sm font-medium">
                Headers (JSON)
              </Label>
              <Textarea
                id="headers"
                placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="font-mono text-sm mt-1"
                rows={3}
              />
            </div>

            {/* Request Body */}
            {method !== 'GET' && method !== 'HEAD' && (
              <div>
                <Label htmlFor="body" className="text-sm font-medium">
                  Request Body (JSON)
                </Label>
                <Textarea
                  id="body"
                  placeholder='{"key": "value"}'
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="font-mono text-sm mt-1"
                  rows={6}
                />
              </div>
            )}

            {/* Send Button */}
            <Button 
              onClick={makeRequest} 
              disabled={loading || !url.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {response ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : error ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5" />
                )}
                Response
              </div>
              {response && (
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(response.status)} text-white`}>
                    {response.status} {response.statusText}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {response.timing}ms
                  </Badge>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Making request...</span>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Request Failed
                </div>
                <pre className="text-sm text-destructive whitespace-pre-wrap">{error}</pre>
                {error.includes('CORS') && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    <p className="font-medium mb-1">CORS Solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Enable the CORS proxy toggle above (for testing only)</li>
                      <li>Ask the API server owner to add proper CORS headers</li>
                      <li>Use a browser extension like "CORS Unblock" for development</li>
                      <li>Make requests from your own backend server instead</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {response && !loading && !error && (
              <Tabs defaultValue="body" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="body">Response Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="body" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {formatJson(response.data)}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="headers" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {formatJson(response.headers)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!response && !loading && !error && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-4">🚀</div>
                <p>Enter a URL and click "Send Request" to test your API</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiTester;
