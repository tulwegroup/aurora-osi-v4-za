/**
 * Interactive Anomaly Marker Component
 * Shows detailed information on hover and click
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Layers, 
  TrendingUp, 
  Activity,
  Info,
  AlertTriangle,
  CheckCircle,
  Eye,
  Database,
  Calendar,
  Thermometer,
  Mountain
} from 'lucide-react';

interface AnomalyMarkerProps {
  anomaly: {
    id: string;
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
  };
  isSelected?: boolean;
  onClick?: (anomaly: any) => void;
}

export function AnomalyMarker({ anomaly, isSelected, onClick }: AnomalyMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getSeverityColor = (probability: number) => {
    if (probability >= 0.8) return 'bg-red-500';
    if (probability >= 0.6) return 'bg-orange-500';
    if (probability >= 0.4) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatVolume = (volumeM3?: number) => {
    if (!volumeM3) return 'Unknown';
    if (volumeM3 >= 1000000000) return `${(volumeM3 / 1000000000).toFixed(1)}B m³`;
    if (volumeM3 >= 1000000) return `${(volumeM3 / 1000000).toFixed(1)}M m³`;
    if (volumeM3 >= 1000) return `${(volumeM3 / 1000).toFixed(1)}K m³`;
    return `${volumeM3.toFixed(0)} m³`;
  };

  const formatDepth = (depthM?: number) => {
    if (!depthM) return 'Unknown';
    if (depthM >= 1000) return `${(depthM / 1000).toFixed(1)} km`;
    return `${depthM.toFixed(0)} m`;
  };

  return (
    <>
      {/* Map Pin */}
      <div 
        className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 ${
          isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
        }`}
        style={{
          left: '50%',
          top: '100%'
        }}
        onClick={() => onClick?.(anomaly)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`relative ${getSeverityColor(anomaly.probability)} text-white rounded-full p-1 shadow-lg`}>
          <MapPin className="h-4 w-4" />
          {isSelected && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
            </div>
          )}
        </div>
        
        {/* Pulse animation for high probability anomalies */}
        {anomaly.probability >= 0.7 && (
          <div className={`absolute inset-0 ${getSeverityColor(anomaly.probability)} rounded-full animate-ping opacity-75`}></div>
        )}
      </div>

      {/* Hover/Click Details Card */}
      {(isHovered || isSelected) && (
        <div className="absolute z-50 w-80 transform -translate-x-1/2 bottom-full mb-2">
          <Card className="shadow-2xl border-2 border-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Anomaly Details</CardTitle>
                <Badge className={`${getSeverityColor(anomaly.probability)} text-white`}>
                  {(anomaly.probability * 100).toFixed(0)}% Probability
                </Badge>
              </div>
              <CardDescription className="text-xs">
                ID: {anomaly.id} • Type: {anomaly.anomalyType}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Location */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <div className="font-semibold">Location</div>
                  <div className="text-muted-foreground">
                    {anomaly.latitude.toFixed(4)}°, {anomaly.longitude.toFixed(4)}°
                  </div>
                </div>
              </div>

              {/* Depth */}
              {anomaly.depthM && (
                <div className="flex items-center space-x-2">
                  <Mountain className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-semibold">Depth</div>
                    <div className="text-muted-foreground">
                      {formatDepth(anomaly.depthM)} below surface
                    </div>
                  </div>
                </div>
              )}

              {/* Volume */}
              {anomaly.volumeM3 && (
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-semibold">Estimated Volume</div>
                    <div className="text-muted-foreground">
                      {formatVolume(anomaly.volumeM3)}
                    </div>
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-semibold">Confidence</div>
                    <div className={`font-medium ${getConfidenceColor(anomaly.confidence)}`}>
                      {(anomaly.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Badge variant={anomaly.confidence >= 0.7 ? 'default' : 'secondary'}>
                  {anomaly.confidence >= 0.7 ? 'High' : 'Medium'}
                </Badge>
              </div>

              {/* Physics Validation */}
              {anomaly.physicsValidation && (
                <div className="border-t pt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="text-sm font-semibold">Physics Validation</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Consensus Score:</span>
                      <span className="font-medium">
                        {((anomaly.physicsValidation.consensusScore || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Agent Agreement:</span>
                      <span className="font-medium">
                        {((anomaly.physicsValidation.agentAgreement || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {anomaly.physicsValidation.qualityScore && (
                      <div className="flex justify-between text-xs">
                        <span>Data Quality:</span>
                        <span className="font-medium">
                          {((anomaly.physicsValidation.qualityScore || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Estimates */}
              {anomaly.resourceEstimate && (
                <div className="border-t pt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold">Resource Estimates</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Type:</span>
                      <span className="font-medium capitalize">
                        {anomaly.resourceEstimate.type}
                      </span>
                    </div>
                    {anomaly.resourceEstimate.expected && (
                      <div className="flex justify-between text-xs">
                        <span>Expected:</span>
                        <span className="font-medium">
                          {anomaly.resourceEstimate.expected.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {anomaly.resourceEstimate.high && (
                      <div className="flex justify-between text-xs">
                        <span>High Range:</span>
                        <span className="font-medium text-green-600">
                          {anomaly.resourceEstimate.high.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {anomaly.resourceEstimate.low && (
                      <div className="flex justify-between text-xs">
                        <span>Low Range:</span>
                        <span className="font-medium text-orange-600">
                          {anomaly.resourceEstimate.low.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t">
                <button 
                  size="sm"
                  className="flex-1"
                  onClick={() => onClick?.(anomaly)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Analyze
                </button>
                <button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Export anomaly data
                    const data = {
                      ...anomaly,
                      exportDate: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `anomaly-${anomaly.id}.json`;
                    a.click();
                  }}
                >
                  Export
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}