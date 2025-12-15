/**
 * Settings and Configuration Management for Aurora OSI v4.5
 * Handles Google Earth Engine credentials and data source configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Cloud, 
  Settings, 
  Key, 
  Globe, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Satellite
} from 'lucide-react';

interface GEEConfig {
  serviceAccountKey: string;
  projectId: string;
  isEnabled: boolean;
  lastValidated?: string;
}

interface DataSourceConfig {
  primary: 'mock' | 'gee' | 'hybrid';
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  cacheDuration: number; // hours
}

interface SystemSettings {
  geeConfig: GEEConfig;
  dataSource: DataSourceConfig;
  consensusThreshold: number;
  enableVeto: boolean;
  processingTimeout: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    geeConfig: {
      serviceAccountKey: '',
      projectId: '',
      isEnabled: false,
      lastValidated: undefined
    },
    dataSource: {
      primary: 'mock',
      fallbackEnabled: true,
      cacheEnabled: true,
      cacheDuration: 24
    },
    consensusThreshold: 0.85,
    enableVeto: true,
    processingTimeout: 300000
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aurora-osi-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('aurora-osi-settings', JSON.stringify(newSettings));
  };

  // Handle file upload for service account key
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        saveSettings({
          ...settings,
          geeConfig: {
            ...settings.geeConfig,
            serviceAccountKey: content,
            lastValidated: undefined
          }
        });
      };
      reader.readAsText(file);
    }
  };

  // Test GEE connection
  const testGEEConnection = async () => {
    if (!settings.geeConfig.serviceAccountKey || !settings.geeConfig.projectId) {
      setTestResult({
        success: false,
        message: 'Please provide both service account key and project ID'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings/test-gee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceAccountKey: settings.geeConfig.serviceAccountKey,
          projectId: settings.geeConfig.projectId
        })
      });

      const result = await response.json();

      setTestResult({
        success: result.success,
        message: result.message,
        details: result.details
      });

      if (result.success) {
        saveSettings({
          ...settings,
          geeConfig: {
            ...settings.geeConfig,
            isEnabled: true,
            lastValidated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply settings to server
  const applySettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({
          success: true,
          message: 'Settings applied successfully! Real satellite data will be used for new campaigns.'
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Failed to apply settings'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to apply settings: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dataSourceStatus = settings.dataSource.primary === 'gee' && settings.geeConfig.isEnabled 
    ? { color: 'bg-green-500', text: 'Real Data Active', icon: CheckCircle }
    : { color: 'bg-orange-500', text: 'Mock Data Active', icon: AlertTriangle };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings & Configuration</h1>
          <p className="text-muted-foreground">
            Configure Google Earth Engine integration and data sources
          </p>
        </div>
        <Badge className={`${dataSourceStatus.color} text-white`}>
          <div className="flex items-center gap-2">
            <dataSourceStatus.icon className="h-4 w-4" />
            {dataSourceStatus.text}
          </div>
        </Badge>
      </div>

      <Tabs defaultValue="gee" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gee" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Google Earth Engine
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gee" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Google Earth Engine Authentication
              </CardTitle>
              <CardDescription>
                Configure your GEE service account to access real satellite data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  placeholder="your-gee-project-id"
                  value={settings.geeConfig.projectId}
                  onChange={(e) => saveSettings({
                    ...settings,
                    geeConfig: {
                      ...settings.geeConfig,
                      projectId: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
                <Textarea
                  id="serviceAccountKey"
                  placeholder="Paste your service account key JSON here or upload file below..."
                  value={settings.geeConfig.serviceAccountKey}
                  onChange={(e) => saveSettings({
                    ...settings,
                    geeConfig: {
                      ...settings.geeConfig,
                      serviceAccountKey: e.target.value
                    }
                  })}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUpload">Or Upload Service Account Key File</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              {settings.geeConfig.lastValidated && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Last validated: {new Date(settings.geeConfig.lastValidated).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={testGEEConnection}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Test GEE Connection
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {testResult.message}
                    {testResult.details && (
                      <div className="mt-2 text-sm">
                        <strong>Details:</strong> {JSON.stringify(testResult.details, null, 2)}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source Configuration
              </CardTitle>
              <CardDescription>
                Choose between mock data, real GEE data, or hybrid approach
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Data Source</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.dataSource.primary}
                    onChange={(e) => saveSettings({
                      ...settings,
                      dataSource: {
                        ...settings.dataSource,
                        primary: e.target.value as 'mock' | 'gee' | 'hybrid'
                      }
                    })}
                  >
                    <option value="mock">Mock Data (Synthetic)</option>
                    <option value="gee">Real GEE Data</option>
                    <option value="hybrid">Hybrid (GEE with Mock Fallback)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="fallbackEnabled">Enable Mock Fallback</Label>
                  <Switch
                    id="fallbackEnabled"
                    checked={settings.dataSource.fallbackEnabled}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      dataSource: {
                        ...settings.dataSource,
                        fallbackEnabled: checked
                      }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cacheEnabled">Enable Data Caching</Label>
                  <Switch
                    id="cacheEnabled"
                    checked={settings.dataSource.cacheEnabled}
                    onCheckedChange={(checked) => saveSettings({
                      ...settings,
                      dataSource: {
                        ...settings.dataSource,
                        cacheEnabled: checked
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cacheDuration">Cache Duration (hours)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.dataSource.cacheDuration}
                    onChange={(e) => saveSettings({
                      ...settings,
                      dataSource: {
                        ...settings.dataSource,
                        cacheDuration: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5" />
                Available Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Mock Data</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Synthetic data for testing and demonstration
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>✓ Instant response</div>
                    <div>✓ No API limits</div>
                    <div>✓ Always available</div>
                    <div>✗ Not real satellite data</div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Google Earth Engine</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Real satellite data from multiple sources
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>✓ Real Sentinel-2 data</div>
                    <div>✓ Real Landsat 8 data</div>
                    <div>✓ Real gravity data</div>
                    <div>✓ Real elevation data</div>
                    <div>⚠ Requires authentication</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure consensus engine and processing parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="consensusThreshold">Consensus Threshold ({(settings.consensusThreshold * 100).toFixed(0)}%)</Label>
                <input
                  id="consensusThreshold"
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.consensusThreshold}
                  onChange={(e) => saveSettings({
                    ...settings,
                    consensusThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableVeto">Enable Agent Veto Power</Label>
                <Switch
                  id="enableVeto"
                  checked={settings.enableVeto}
                  onCheckedChange={(checked) => saveSettings({
                    ...settings,
                    enableVeto: checked
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processingTimeout">Processing Timeout (seconds)</Label>
                <Input
                  id="processingTimeout"
                  type="number"
                  min="30"
                  max="600"
                  value={settings.processingTimeout / 1000}
                  onChange={(e) => saveSettings({
                    ...settings,
                    processingTimeout: parseInt(e.target.value) * 1000
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={applySettings}
          disabled={isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Applying Settings...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Apply Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}