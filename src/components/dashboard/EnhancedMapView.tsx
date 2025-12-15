/**
 * Enhanced Map View with Interactive Anomaly Markers
 * Shows real-time satellite data processing and detailed anomaly information
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Satellite, 
  Layers, 
  Activity,
  TrendingUp,
  Globe,
  Radar,
  Play,
  RefreshCw,
  Download,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Database,
  Calendar,
  Thermometer,
  BarChart3,
  Settings
} from 'lucide-react';
import { AnomalyMarker } from './AnomalyMarker';

interface Campaign {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  resourceType: string;
  geologyContext?: string;
  status: string;
  createdAt: string;
  _count?: {
    anomalies: number;
    predictions: number;
  };
}

interface Anomaly {
  id: string;
  campaignId: string;
  latitude: number;
  longitude: number;
  depthM?: number;
  probability: number;
  confidence: number;
  anomalyType: string;
  value?: number;
  volumeM3?: number;
  resourceEstimate?: any;
  physicsValidation?: any;
  createdAt: string;
}

interface CampaignMetrics {
  totalAnomalies: number;
  highProbabilityAnomalies: number;
  averageConfidence: number;
  averageDepth: number;
  totalVolume: number;
  processingTime: number;
  dataSource: string;
}

export default function EnhancedMapView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [isProcessingData, setIsProcessingData] = useState(false);
  const [campaignMetrics, setCampaignMetrics] = useState<Map<string, CampaignMetrics>>(new Map());
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(true);
  const [mapView, setMapView] = useState<'2d' | '3d'>('2d');
  const [showGrid, setShowGrid] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'high-probability' | 'recent'>('all');

  // Load campaigns and anomalies
  useEffect(() => {
    loadCampaigns();
    loadAnomalies();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadAnomalies = async () => {
    try {
      const response = await fetch('/api/anomalies');
      const data = await response.json();
      setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    }
  };

  // Process live satellite data for campaign
  const processLiveSatelliteData = async (campaignId: string) => {
    setIsProcessingData(true);
    try {
      const response = await fetch('/api/campaigns/process-live-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload anomalies and metrics
        await loadAnomalies();
        await calculateCampaignMetrics();
        
        // Show success message
        alert('Live satellite data processing completed successfully!');
      } else {
        alert('Failed to process live satellite data: ' + result.message);
      }
    } catch (error) {
      console.error('Failed to process live data:', error);
      alert('Error processing live satellite data: ' + error.message);
    } finally {
      setIsProcessingData(false);
    }
  };

  // Calculate campaign metrics
  const calculateCampaignMetrics = async () => {
    const metrics = new Map<string, CampaignMetrics>();
    
    for (const campaign of campaigns) {
      const campaignAnomalies = anomalies.filter(a => a.campaignId === campaign.id);
      
      if (campaignAnomalies.length > 0) {
        const totalAnomalies = campaignAnomalies.length;
        const highProbabilityAnomalies = campaignAnomalies.filter(a => a.probability >= 0.7).length;
        const averageConfidence = campaignAnomalies.reduce((sum, a) => sum + a.confidence, 0) / totalAnomalies;
        const averageDepth = campaignAnomalies.reduce((sum, a) => sum + (a.depthM || 0), 0) / totalAnomalies;
        const totalVolume = campaignAnomalies.reduce((sum, a) => sum + (a.volumeM3 || 0), 0);
        
        // Check if data source is real or mock
        const dataSource = campaignAnomalies[0]?.physicsValidation?.dataSources?.primary || 'Unknown';
        
        metrics.set(campaign.id, {
          totalAnomalies,
          highProbabilityAnomalies,
          averageConfidence,
          averageDepth,
          totalVolume,
          processingTime: 0, // Would be calculated from real processing
          dataSource
        });
      }
    }
    
    setCampaignMetrics(metrics);
  };

  useEffect(() => {
    calculateCampaignMetrics();
  }, [anomalies, campaigns]);

  // Filter anomalies based on selected filter
  const getFilteredAnomalies = () => {
    switch (filterType) {
      case 'high-probability':
        return anomalies.filter(a => a.probability >= 0.7);
      case 'recent':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return anomalies.filter(a => new Date(a.createdAt) > thirtyDaysAgo);
      default:
        return anomalies;
    }
  };

  const filteredAnomalies = getFilteredAnomalies();

  const handleAnomalyClick = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        campaign: selectedCampaign,
        anomalies: filteredAnomalies,
        metrics: selectedCampaign ? campaignMetrics.get(selectedCampaign.id) : null,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${selectedCampaign?.id || 'all'}-data.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Enhanced Anomaly Map
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {filteredAnomalies.length} Anomalies
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleExportData}
                disabled={!selectedCampaign && filteredAnomalies.length === 0}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
          <CardDescription>
            Interactive map with real-time satellite data processing and detailed anomaly analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            {/* Campaign Selector */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Campaign</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const campaign = campaigns.find(c => c.id === e.target.value);
                  setSelectedCampaign(campaign || null);
                }}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign._count?.anomalies || 0} anomalies)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filter:</label>
                <select 
                  className="p-2 border rounded-md"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">All Anomalies</option>
                  <option value="high-probability">High Probability</option>
                  <option value="recent">Recent (30 days)</option>
                </select>
              </div>
              
              <Button
                size="sm"
                variant={showAnomalyDetails ? 'default' : 'outline'}
                onClick={() => setShowAnomalyDetails(!showAnomalyDetails)}
              >
                {showAnomalyDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Map View Controls */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={mapView === '2d' ? 'default' : 'outline'}
              onClick={() => setMapView('2d')}
            >
              2D View
            </Button>
            <Button
              size="sm"
              variant={mapView === '3d' ? 'default' : 'outline'}
              onClick={() => setMapView('3d')}
            >
              3D View
            </Button>
            <Button
              size="sm"
              variant={showGrid ? 'default' : 'outline'}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Layers className="h-3 w-3 mr-1" />
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Metrics */}
      {selectedCampaign && campaignMetrics.has(selectedCampaign.id) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedCampaign.name} - Campaign Metrics
            </CardTitle>
            <Badge className={
              campaignMetrics.get(selectedCampaign.id)?.dataSource === 'Google Earth Engine (Real)' 
                ? 'bg-green-500' 
                : 'bg-orange-500'
            }>
              {campaignMetrics.get(selectedCampaign.id)?.dataSource || 'Unknown'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Total Anomalies</div>
                <div className="text-2xl font-bold">
                  {campaignMetrics.get(selectedCampaign.id)?.totalAnomalies || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">High Probability</div>
                <div className="text-2xl font-bold text-red-600">
                  {campaignMetrics.get(selectedCampaign.id)?.highProbabilityAnomalies || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Avg Confidence</div>
                <div className="text-2xl font-bold">
                  {((campaignMetrics.get(selectedCampaign.id)?.averageConfidence || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Avg Depth</div>
                <div className="text-2xl font-bold">
                  {Math.round(campaignMetrics.get(selectedCampaign.id)?.averageDepth || 0)}m
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Total Volume</div>
                <div className="text-2xl font-bold">
                  {((campaignMetrics.get(selectedCampaign.id)?.totalVolume || 0) / 1000000).toFixed(1)}M m³
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Data Source</div>
                <div className="text-lg font-semibold">
                  {campaignMetrics.get(selectedCampaign.id)?.dataSource || 'Unknown'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Processing Time</div>
                <div className="text-lg font-semibold">
                  {campaignMetrics.get(selectedCampaign.id)?.processingTime || 0}ms
                </div>
              </div>
            </div>

            {/* Live Data Processing Button */}
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => processLiveSatelliteData(selectedCampaign.id)}
                disabled={isProcessingData}
                className="w-full"
                size="lg"
              >
                {isProcessingData ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing Live Satellite Data...
                  </>
                ) : (
                  <>
                    <Satellite className="mr-2 h-4 w-4" />
                    Process Live Satellite Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Anomaly Locations
            {selectedAnomaly && (
              <Badge variant="outline">
                Selected: {selectedAnomaly.id}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Click on any anomaly marker to view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map Container - would integrate with real map library */}
          <div className="relative w-full h-96 bg-muted rounded-lg border-2 border-dashed">
            {/* Mock map background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="text-lg font-semibold">Interactive Map View</div>
                <div className="text-sm text-muted-foreground">
                  {filteredAnomalies.length} anomaly locations
                </div>
                <div className="text-xs text-muted-foreground">
                  (Integrate with Mapbox, Google Maps, or similar)
                </div>
              </div>
            </div>

            {/* Anomaly Markers */}
            {filteredAnomalies.map((anomaly, index) => (
              <AnomalyMarker
                key={anomaly.id}
                anomaly={anomaly}
                isSelected={selectedAnomaly?.id === anomaly.id}
                onClick={handleAnomalyClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Anomaly Details */}
      {selectedAnomaly && showAnomalyDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Anomaly Details: {selectedAnomaly.id}
            </CardTitle>
            <Badge className={
              selectedAnomaly.probability >= 0.8 ? 'bg-red-500' :
              selectedAnomaly.probability >= 0.6 ? 'bg-orange-500' :
              'bg-blue-500'
            }>
              {(selectedAnomaly.probability * 100).toFixed(0)}% Probability
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Location</div>
                  <div className="text-lg">
                    {selectedAnomaly.latitude.toFixed(4)}°, {selectedAnomaly.longitude.toFixed(4)}°
                  </div>
                </div>
                
                {selectedAnomaly.depthM && (
                  <div>
                    <div className="text-sm font-medium mb-1">Depth</div>
                    <div className="text-lg">
                      {selectedAnomaly.depthM >= 1000 
                        ? `${(selectedAnomaly.depthM / 1000).toFixed(1)} km`
                        : `${selectedAnomaly.depthM.toFixed(0)} m`
                      } below surface
                    </div>
                  </div>
                )}

                {selectedAnomaly.volumeM3 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Estimated Volume</div>
                    <div className="text-lg">
                      {selectedAnomaly.volumeM3 >= 1000000000 
                        ? `${(selectedAnomaly.volumeM3 / 1000000000).toFixed(1)}B m³`
                        : selectedAnomaly.volumeM3 >= 1000000 
                        ? `${(selectedAnomaly.volumeM3 / 1000000).toFixed(1)}M m³`
                        : `${(selectedAnomaly.volumeM3 / 1000).toFixed(0)}K m³`
                      }
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-1">Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg">
                      {(selectedAnomaly.confidence * 100).toFixed(1)}%
                    </div>
                    <Progress 
                      value={selectedAnomaly.confidence * 100} 
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Anomaly Type</div>
                  <div className="text-lg capitalize">
                    {selectedAnomaly.anomalyType.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Detection Date</div>
                  <div className="text-lg">
                    {new Date(selectedAnomaly.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {selectedAnomaly.physicsValidation && (
                  <div>
                    <div className="text-sm font-medium mb-1">Physics Validation</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Consensus Score:</span>
                        <span className="font-medium">
                          {((selectedAnomaly.physicsValidation.consensusScore || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Agent Agreement:</span>
                        <span className="font-medium">
                          {((selectedAnomaly.physicsValidation.agentAgreement || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Data Quality:</span>
                        <span className="font-medium">
                          {((selectedAnomaly.physicsValidation.qualityScore || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAnomaly.resourceEstimate && (
                  <div>
                    <div className="text-sm font-medium mb-1">Resource Estimates</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Type:</span>
                        <span className="font-medium capitalize">
                          {selectedAnomaly.resourceEstimate.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Expected:</span>
                        <span className="font-medium">
                          {selectedAnomaly.resourceEstimate.expected?.toFixed(2)}
                        </span>
                      </div>
                      {selectedAnomaly.resourceEstimate.high && (
                        <div className="flex justify-between text-sm">
                          <span>High Range:</span>
                          <span className="font-medium text-green-600">
                            {selectedAnomaly.resourceEstimate.high?.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedAnomaly.resourceEstimate.low && (
                        <div className="flex justify-between text-sm">
                          <span>Low Range:</span>
                          <span className="font-medium text-orange-600">
                            {selectedAnomaly.resourceEstimate.low?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}