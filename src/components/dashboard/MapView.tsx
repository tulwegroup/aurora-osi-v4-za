"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  Layers, 
  Zap, 
  Thermometer, 
  Magnet,
  Activity,
  Eye,
  Crosshair,
  RotateCcw
} from "lucide-react";

interface Anomaly {
  id: string;
  type: 'gravity' | 'magnetic' | 'thermal' | 'spectral';
  confidence: number;
  depth: number;
  volume: number;
  value: number;
  latitude: number;
  longitude: number;
}

interface Campaign {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  resourceType: string;
  geologyContext: string;
}

interface MapViewProps {
  campaign: Campaign | null;
  anomalies: Anomaly[];
  onAnomalySelect: (anomaly: Anomaly) => void;
  onGenerateAnomalies: () => void;
  isGenerating: boolean;
}

export function MapView({ 
  campaign, 
  anomalies, 
  onAnomalySelect, 
  onGenerateAnomalies,
  isGenerating 
}: MapViewProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(2);

  const anomalyTypes = [
    { 
      key: 'all', 
      label: 'All Layers', 
      icon: Layers,
      color: 'bg-gray-500'
    },
    { 
      key: 'gravity', 
      label: 'Gravity', 
      icon: Activity,
      color: 'bg-blue-500'
    },
    { 
      key: 'magnetic', 
      label: 'Magnetic', 
      icon: Magnet,
      color: 'bg-purple-500'
    },
    { 
      key: 'thermal', 
      label: 'Thermal', 
      icon: Thermometer,
      color: 'bg-orange-500'
    },
    { 
      key: 'spectral', 
      label: 'Spectral', 
      icon: Eye,
      color: 'bg-green-500'
    }
  ];

  useEffect(() => {
    if (campaign) {
      setMapCenter({ lat: campaign.latitude, lng: campaign.longitude });
      setZoom(Math.max(6, 10 - Math.log10(campaign.radiusKm)));
    }
  }, [campaign]);

  const filteredAnomalies = selectedLayer === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.type === selectedLayer);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'gravity': return Activity;
      case 'magnetic': return Magnet;
      case 'thermal': return Thermometer;
      case 'spectral': return Eye;
      default: return Zap;
    }
  };

  const getAnomalyColor = (type: string, confidence: number) => {
    const opacity = Math.max(0.3, confidence);
    switch (type) {
      case 'gravity': return `rgba(59, 130, 246, ${opacity})`; // blue
      case 'magnetic': return `rgba(147, 51, 234, ${opacity})`; // purple
      case 'thermal': return `rgba(251, 146, 60, ${opacity})`; // orange
      case 'spectral': return `rgba(34, 197, 94, ${opacity})`; // green
      default: return `rgba(107, 114, 128, ${opacity})`; // gray
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Geospatial Intelligence</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGenerateAnomalies}
              disabled={!campaign || isGenerating}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isGenerating ? 'Analyzing...' : 'Generate Anomalies'}
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Layer Selection */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {anomalyTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.key}
                  variant={selectedLayer === type.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLayer(type.key)}
                  className="flex items-center space-x-1"
                >
                  <Icon className="h-3 w-3" />
                  <span>{type.label}</span>
                  {type.key !== 'all' && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {anomalies.filter(a => a.type === type.key).length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-96 bg-slate-100 rounded-lg overflow-hidden border">
          {campaign ? (
            <div className="relative w-full h-full">
              {/* Simulated Map View */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(10)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full border-t border-slate-400" style={{ top: `${i * 10}%` }} />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full border-l border-slate-400" style={{ left: `${i * 10}%` }} />
                  ))}
                </div>

                {/* Campaign Center */}
                <div 
                  className="absolute w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  style={{ 
                    left: '50%', 
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Crosshair className="h-4 w-4 text-white" />
                </div>

                {/* Search Radius */}
                <div 
                  className="absolute rounded-full border-2 border-red-300 bg-red-100 opacity-30"
                  style={{ 
                    left: '50%', 
                    top: '50%',
                    width: `${Math.min(80, campaign.radiusKm * 2)}%`,
                    height: `${Math.min(80, campaign.radiusKm * 2)}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />

                {/* Anomalies */}
                {filteredAnomalies.map((anomaly, index) => {
                  const Icon = getAnomalyIcon(anomaly.type);
                  // Position anomalies randomly within the radius for demo
                  const angle = (index * 137.5) * Math.PI / 180; // Golden angle
                  const distance = 20 + (index % 3) * 15; // Vary distance
                  const x = 50 + distance * Math.cos(angle);
                  const y = 50 + distance * Math.sin(angle);
                  
                  return (
                    <div
                      key={anomaly.id}
                      className="absolute cursor-pointer transition-all hover:scale-110"
                      style={{ 
                        left: `${x}%`, 
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => onAnomalySelect(anomaly)}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                        style={{ backgroundColor: getAnomalyColor(anomaly.type, anomaly.confidence) }}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      {anomaly.confidence > 0.8 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                <h4 className="text-sm font-medium mb-2">Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <span>Campaign Center</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-red-300 bg-red-100 opacity-50 rounded-full" />
                    <span>Search Area</span>
                  </div>
                  {anomalyTypes.slice(1).map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.key} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 ${type.color} rounded-full`} />
                        <Icon className="h-3 w-3" />
                        <span>{type.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coordinates Display */}
              <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-mono">
                  <div>Lat: {campaign.latitude.toFixed(4)}°</div>
                  <div>Lon: {campaign.longitude.toFixed(4)}°</div>
                  <div>Radius: {campaign.radiusKm} km</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
                <p className="text-muted-foreground">
                  Select or create a campaign to view geospatial analysis
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Anomaly Statistics */}
        {campaign && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {anomalies.filter(a => a.type === 'gravity').length}
              </div>
              <div className="text-xs text-muted-foreground">Gravity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {anomalies.filter(a => a.type === 'magnetic').length}
              </div>
              <div className="text-xs text-muted-foreground">Magnetic</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {anomalies.filter(a => a.type === 'thermal').length}
              </div>
              <div className="text-xs text-muted-foreground">Thermal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {anomalies.filter(a => a.type === 'spectral').length}
              </div>
              <div className="text-xs text-muted-foreground">Spectral</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}