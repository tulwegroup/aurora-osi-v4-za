"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapView } from "@/components/dashboard/MapView";
import { EnhancedMapView } from "@/components/dashboard/EnhancedMapView";
import { PredictionView } from "@/components/dashboard/PredictionView";
import { ConsensusView } from "@/components/dashboard/ConsensusView";
import { 
  MapPin, 
  Satellite, 
  TrendingUp, 
  Layers, 
  Zap,
  Globe,
  Radar,
  Activity,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  resourceType: string;
  geologyContext?: string;
  status: string;
  createdBy: string;
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

interface Prediction {
  id: string;
  campaignId: string;
  targetYear: number;
  resourceType: string;
  volumeM3?: number;
  tonnage?: number;
  confidence: number;
  uncertainty?: number;
  scenario: string;
  modelVersion: string;
  createdAt: string;
}

export default function AuroraOSI() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeneratingAnomalies, setIsGeneratingAnomalies] = useState(false);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const router = useRouter();
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radiusKm: '',
    resourceType: '',
    geologyContext: ''
  });

  const resourceTypes = [
    { value: "oil", label: "Oil & Gas", color: "bg-blue-500" },
    { value: "minerals", label: "Minerals", color: "bg-purple-500" },
    { value: "water", label: "Water Resources", color: "bg-cyan-500" },
    { value: "geothermal", label: "Geothermal", color: "bg-orange-500" }
  ];

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch anomalies and predictions when campaign changes
  useEffect(() => {
    if (activeCampaign) {
      fetchAnomalies(activeCampaign.id);
      fetchPredictions(activeCampaign.id);
    }
  }, [activeCampaign]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchAnomalies = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/anomalies?campaignId=${campaignId}`);
      const data = await response.json();
      setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const fetchPredictions = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/predictions?campaignId=${campaignId}`);
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const createCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCampaign,
          latitude: parseFloat(newCampaign.latitude),
          longitude: parseFloat(newCampaign.longitude),
          radiusKm: parseFloat(newCampaign.radiusKm),
          createdBy: 'demo-user' // In production, this would come from auth
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(prev => [data.campaign, ...prev]);
        setActiveCampaign(data.campaign);
        setNewCampaign({
          name: '',
          description: '',
          latitude: '',
          longitude: '',
          radiusKm: '',
          resourceType: '',
          geologyContext: ''
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const generateAnomalies = async () => {
    if (!activeCampaign) return;
    
    setIsGeneratingAnomalies(true);
    try {
      const response = await fetch('/api/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          anomalyCount: 15
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnomalies(prev => [...prev, ...data.anomalies]);
      }
    } catch (error) {
      console.error('Error generating anomalies:', error);
    } finally {
      setIsGeneratingAnomalies(false);
    }
  };

  const generatePredictions = async () => {
    if (!activeCampaign) return;
    
    setIsGeneratingPredictions(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          timeHorizon: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(prev => [...prev, ...data.predictions]);
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  const handleAnomalySelect = (anomaly: Anomaly) => {
    console.log('Selected anomaly:', anomaly);
    // In a real app, this would show detailed anomaly information
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Satellite className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Aurora OSI v4.5</h1>
                  <p className="text-sm text-muted-foreground">Multi-Agent Consensus Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>System Active</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Campaign Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Campaign Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>New Campaign</span>
                </CardTitle>
                <CardDescription>
                  Configure exploration parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input 
                      id="campaign-name" 
                      placeholder="Enter campaign name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-description">Description</Label>
                    <Input 
                      id="campaign-description" 
                      placeholder="Campaign description (optional)"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input 
                      id="latitude" 
                      placeholder="32.4" 
                      type="number" 
                      step="0.1"
                      value={newCampaign.latitude}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input 
                      id="longitude" 
                      placeholder="-101.5" 
                      type="number" 
                      step="0.1"
                      value={newCampaign.longitude}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, longitude: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Search Radius (km)</Label>
                  <Input 
                    id="radius" 
                    placeholder="50" 
                    type="number"
                    value={newCampaign.radiusKm}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, radiusKm: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-type">Resource Type</Label>
                    <Select value={newCampaign.resourceType} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, resourceType: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="geology">Geology Context</Label>
                    <Select value={newCampaign.geologyContext} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, geologyContext: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select geological context" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basin">Sedimentary Basin</SelectItem>
                        <SelectItem value="craton">Craton</SelectItem>
                        <SelectItem value="orogen">Orogenic Belt</SelectItem>
                        <SelectItem value="shield">Shield</SelectItem>
                        <SelectItem value="platform">Platform</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full sm:w-auto"
                  onClick={createCampaign}
                  disabled={!newCampaign.name || !newCampaign.latitude || !newCampaign.longitude || !newCampaign.radiusKm || !newCampaign.resourceType}
                >
                  <Radar className="h-4 w-4 mr-2" />
                  Initialize Campaign
                </Button>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                        activeCampaign?.id === campaign.id ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => setActiveCampaign(campaign)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge variant="secondary">{campaign.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{campaign.latitude.toFixed(1)}°, {campaign.longitude.toFixed(1)}°</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{campaign.resourceType}</span>
                          <span>{campaign.radiusKm} km radius</span>
                        </div>
                        {campaign._count && (
                          <div className="flex justify-between text-xs">
                            <span>{campaign._count.anomalies} anomalies</span>
                            <span>{campaign._count.predictions} predictions</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Mission Control */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="map">Geospatial</TabsTrigger>
                <TabsTrigger value="consensus">Consensus</TabsTrigger>
                <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="map" className="mt-4">
                <EnhancedMapView
                  campaign={activeCampaign}
                  anomalies={anomalies}
                  onAnomalySelect={handleAnomalySelect}
                  onGenerateAnomalies={generateAnomalies}
                  isGenerating={isGeneratingAnomalies}
                />
              </TabsContent>

              <TabsContent value="consensus" className="mt-4">
                <ConsensusView
                  campaign={activeCampaign}
                  onEvaluate={(coordinates, targetResource, geologyContext) => {
                    console.log('Consensus evaluation requested:', coordinates, targetResource, geologyContext);
                  }}
                />
              </TabsContent>

              <TabsContent value="anomalies" className="mt-4">
                <div className="space-y-4">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium capitalize">{anomaly.anomalyType} Anomaly</span>
                        </div>
                        <Badge>{(anomaly.confidence * 100).toFixed(1)}% confidence</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Depth:</span>
                          <p className="font-medium">{anomaly.depthM?.toLocaleString()}m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume:</span>
                          <p className="font-medium">{anomaly.volumeM3?.toLocaleString()} m³</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium text-green-600">Validated</p>
                        </div>
                      </div>
                      <Progress value={anomaly.confidence * 100} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="predictions" className="mt-4">
                <PredictionView
                  campaignId={activeCampaign?.id || null}
                  predictions={predictions}
                  onGeneratePredictions={generatePredictions}
                  isGenerating={isGeneratingPredictions}
                />
              </TabsContent>
            </Tabs>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Data Layers</span>
                  </div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Active sensors</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                  <p className="text-2xl font-bold">98.2%</p>
                  <p className="text-xs text-muted-foreground">Efficiency rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Anomalies</span>
                  </div>
                  <p className="text-2xl font-bold">{anomalies.length}</p>
                  <p className="text-xs text-muted-foreground">Total detected</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}