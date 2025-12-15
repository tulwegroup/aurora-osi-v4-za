"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface Prediction {
  id: string;
  targetYear: number;
  resourceType: string;
  volumeM3: number;
  tonnage?: number;
  confidence: number;
  uncertainty: number;
  scenario: 'base' | 'optimistic' | 'pessimistic';
  modelVersion: string;
}

interface PredictionViewProps {
  campaignId: string | null;
  predictions: Prediction[];
  onGeneratePredictions: () => void;
  isGenerating: boolean;
}

export function PredictionView({ 
  campaignId, 
  predictions, 
  onGeneratePredictions,
  isGenerating 
}: PredictionViewProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('all');

  const scenarios = [
    { key: 'all', label: 'All Scenarios', color: 'bg-gray-500' },
    { key: 'base', label: 'Base Case', color: 'bg-blue-500' },
    { key: 'optimistic', label: 'Optimistic', color: 'bg-green-500' },
    { key: 'pessimistic', label: 'Pessimistic', color: 'bg-red-500' }
  ];

  const filteredPredictions = selectedScenario === 'all' 
    ? predictions 
    : predictions.filter(p => p.scenario === selectedScenario);

  // Group predictions by year
  const predictionsByYear = filteredPredictions.reduce((acc, prediction) => {
    if (!acc[prediction.targetYear]) {
      acc[prediction.targetYear] = [];
    }
    acc[prediction.targetYear].push(prediction);
    return acc;
  }, {} as Record<number, Prediction[]>);

  const sortedYears = Object.keys(predictionsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertTriangle;
    return AlertTriangle;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M m³`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K m³`;
    }
    return `${volume.toFixed(0)} m³`;
  };

  const formatTonnage = (tonnage?: number) => {
    if (!tonnage) return 'N/A';
    if (tonnage >= 1000000) {
      return `${(tonnage / 1000000).toFixed(2)}M tons`;
    } else if (tonnage >= 1000) {
      return `${(tonnage / 1000).toFixed(1)}K tons`;
    }
    return `${tonnage.toFixed(0)} tons`;
  };

  const getTrend = (currentYear: number, previousYear: number) => {
    const current = predictionsByYear[currentYear]?.find(p => p.scenario === 'base');
    const previous = predictionsByYear[previousYear]?.find(p => p.scenario === 'base');
    
    if (!current || !previous) return null;
    
    const trend = ((current.volumeM3 - previous.volumeM3) / previous.volumeM3) * 100;
    return trend;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Temporal Predictions</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGeneratePredictions}
              disabled={!campaignId || isGenerating}
            >
              <Brain className="h-4 w-4 mr-2" />
              {isGenerating ? 'Predicting...' : 'Generate AI Predictions'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {campaignId ? (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              <TabsTrigger value="scenarios">Scenario Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              {/* Scenario Selection */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {scenarios.map((scenario) => (
                    <Button
                      key={scenario.key}
                      variant={selectedScenario === scenario.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedScenario(scenario.key)}
                      className="flex items-center space-x-1"
                    >
                      <div className={`w-3 h-3 rounded-full ${scenario.color}`} />
                      <span>{scenario.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {sortedYears.map((year, index) => {
                  const yearPredictions = predictionsByYear[year];
                  const basePrediction = yearPredictions.find(p => p.scenario === 'base');
                  const trend = index > 0 ? getTrend(year, sortedYears[index - 1]) : null;
                  const ConfidenceIcon = getConfidenceIcon(basePrediction?.confidence || 0);

                  return (
                    <div key={year} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{year}</h3>
                          <Badge variant="outline">
                            {new Date().getFullYear() + (year - new Date().getFullYear())} years from now
                          </Badge>
                        </div>
                        {trend !== null && (
                          <div className={`flex items-center space-x-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {basePrediction && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">
                              {formatVolume(basePrediction.volumeM3)}
                            </div>
                            <div className="text-xs text-muted-foreground">Volume</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">
                              {formatTonnage(basePrediction.tonnage)}
                            </div>
                            <div className="text-xs text-muted-foreground">Tonnage</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className={`flex items-center justify-center space-x-1 ${getConfidenceColor(basePrediction.confidence)}`}>
                              <ConfidenceIcon className="h-4 w-4" />
                              <span className="text-2xl font-bold">
                                {(basePrediction.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                      )}

                      {/* Progress bars for each scenario */}
                      <div className="mt-3 space-y-2">
                        {yearPredictions.map((prediction) => (
                          <div key={prediction.id} className="flex items-center space-x-3">
                            <div className="w-16 text-sm">{prediction.scenario}</div>
                            <div className="flex-1">
                              <Progress 
                                value={prediction.confidence * 100} 
                                className="h-2"
                              />
                            </div>
                            <div className="w-20 text-right text-sm">
                              {formatVolume(prediction.volumeM3)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="scenarios" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.slice(1).map((scenario) => {
                  const scenarioPredictions = predictions.filter(p => p.scenario === scenario.key);
                  const totalVolume = scenarioPredictions.reduce((sum, p) => sum + p.volumeM3, 0);
                  const avgConfidence = scenarioPredictions.reduce((sum, p) => sum + p.confidence, 0) / scenarioPredictions.length;

                  return (
                    <Card key={scenario.key}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-base">
                          <div className={`w-3 h-3 rounded-full ${scenario.color}`} />
                          <span>{scenario.label}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {formatVolume(totalVolume)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Volume</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {(avgConfidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Confidence</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {scenarioPredictions.length}
                            </div>
                            <div className="text-xs text-muted-foreground">Predictions</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Model Information */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Model Information</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Model Version: Aurora OSI v4.0 Neural Engine</div>
                  <div>Training Data: Multi-sensor satellite + geological surveys</div>
                  <div>Update Frequency: Real-time with new data ingestion</div>
                  <div>Validation: Cross-validated against historical drilling results</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
              <p className="text-muted-foreground">
                Select a campaign to generate temporal predictions
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}