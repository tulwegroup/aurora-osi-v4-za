"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Activity,
  Target,
  Zap,
  Globe,
  Clock,
  TrendingUp
} from "lucide-react";

interface ConsensusResult {
  detection: boolean;
  confidence: number;
  consensus: number;
  agentAgreement: number;
  vetoStatus?: {
    vetoed: boolean;
    vetoingAgent?: string;
    vetoReason?: string;
  };
  agentResults: Record<string, any>;
  falsePositiveCheck?: {
    isKnownFP: boolean;
    matchDetails?: any;
  };
  qualityReport?: {
    overallQualityScore: number;
    issues: string[];
    recommendations: string[];
    pass: boolean;
  };
  timestamp: string;
}

interface ConsensusViewProps {
  campaign: any;
  onEvaluate: (coordinates: any, targetResource: string, geologyContext: string) => void;
}

export function ConsensusView({ campaign, onEvaluate }: ConsensusViewProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<ConsensusResult | null>(null);
  const [consensusStatus, setConsensusStatus] = useState<any>(null);
  const [evaluationParams, setEvaluationParams] = useState({
    latitude: '',
    longitude: '',
    targetResource: '',
    geologyContext: '',
    radius: 25
  });

  const resourceTypes = [
    { value: "gold", label: "Gold", color: "bg-yellow-500" },
    { value: "copper", label: "Copper", color: "bg-orange-500" },
    { value: "nickel", label: "Nickel", color: "bg-green-500" },
    { value: "uranium", label: "Uranium", color: "bg-purple-500" },
    { value: "lithium", label: "Lithium", color: "bg-cyan-500" },
    { value: "hydrocarbon", label: "Hydrocarbon", color: "bg-blue-500" }
  ];

  const geologyTypes = [
    { value: "sedimentary", label: "Sedimentary" },
    { value: "igneous", label: "Igneous" },
    { value: "metamorphic", label: "Metamorphic" },
    { value: "basin", label: "Sedimentary Basin" },
    { value: "craton", label: "Craton" },
    { value: "orogen", label: "Orogenic Belt" },
    { value: "shield", label: "Shield" },
    { value: "platform", label: "Platform" }
  ];

  const fetchConsensusStatus = async () => {
    try {
      const response = await fetch('/api/consensus');
      const data = await response.json();
      setConsensusStatus(data);
    } catch (error) {
      console.error('Error fetching consensus status:', error);
    }
  };

  const runConsensusEvaluation = async () => {
    if (!evaluationParams.latitude || !evaluationParams.longitude || !evaluationParams.targetResource || !evaluationParams.geologyContext) {
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/consensus/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: {
            latitude: parseFloat(evaluationParams.latitude),
            longitude: parseFloat(evaluationParams.longitude)
          },
          targetResource: evaluationParams.targetResource,
          geologicalContext: evaluationParams.geologyContext,
          radius: evaluationParams.radius * 1000, // Convert km to meters
          timeRange: {
            start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastResult(data.result);
      }
    } catch (error) {
      console.error('Consensus evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsensusIcon = (result: ConsensusResult) => {
    if (result.vetoStatus?.vetoed) return XCircle;
    if (result.falsePositiveCheck?.isKnownFP) return AlertTriangle;
    if (result.detection) return CheckCircle;
    return XCircle;
  };

  const formatConsensusScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  // Fetch status on component mount
  useState(() => {
    fetchConsensusStatus();
  });

  return (
    <div className="space-y-6">
      {/* Consensus Engine Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Multi-Agent Consensus Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consensusStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {consensusStatus.agents.length}
                </div>
                <div className="text-xs text-muted-foreground">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {consensusStatus.config.consensusThreshold * 100}%
                </div>
                <div className="text-xs text-muted-foreground">Consensus Threshold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {consensusStatus.config.vetoEnabled ? 'ON' : 'OFF'}
                </div>
                <div className="text-xs text-muted-foreground">Veto Power</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {consensusStatus.statistics?.totalEvaluations || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Evaluations</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Loading consensus engine status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consensus Evaluation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Consensus Evaluation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input 
                id="latitude" 
                placeholder="32.4" 
                type="number" 
                step="0.000001"
                value={evaluationParams.latitude}
                onChange={(e) => setEvaluationParams(prev => ({ ...prev, latitude: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input 
                id="longitude" 
                placeholder="-101.5" 
                type="number" 
                step="0.000001"
                value={evaluationParams.longitude}
                onChange={(e) => setEvaluationParams(prev => ({ ...prev, longitude: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target-resource">Target Resource</Label>
              <Select value={evaluationParams.targetResource} onValueChange={(value) => setEvaluationParams(prev => ({ ...prev, targetResource: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target resource" />
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
              <Label htmlFor="geology-context">Geological Context</Label>
              <Select value={evaluationParams.geologyContext} onValueChange={(value) => setEvaluationParams(prev => ({ ...prev, geologyContext: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select geological context" />
                </SelectTrigger>
                <SelectContent>
                  {geologyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="radius">Search Radius (km)</Label>
            <Input 
              id="radius" 
              type="number"
              min="1"
              max="100"
              value={evaluationParams.radius}
              onChange={(e) => setEvaluationParams(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <Button 
            className="w-full sm:w-auto"
            onClick={runConsensusEvaluation}
            disabled={!evaluationParams.latitude || !evaluationParams.longitude || !evaluationParams.targetResource || !evaluationParams.geologyContext || isEvaluating}
          >
            {isEvaluating ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Evaluating Consensus...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Multi-Agent Consensus
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Consensus Results */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                {(() => {
                  const Icon = getConsensusIcon(lastResult);
                  return <Icon className={`h-5 w-5 ${lastResult.detection ? 'text-green-600' : 'text-red-600'}`} />;
                })()}
                <span>Consensus Results</span>
              </span>
              <Badge variant={lastResult.detection ? "default" : "destructive"}>
                {lastResult.detection ? 'DETECTION' : 'NO DETECTION'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="agents">Agent Results</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConfidenceColor(lastResult.confidence)}`}>
                      {(lastResult.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatConsensusScore(lastResult.consensus)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Consensus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatConsensusScore(lastResult.agentAgreement)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Agent Agreement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.keys(lastResult.agentResults).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Agents</div>
                  </div>
                </div>

                {/* Veto Status */}
                {lastResult.vetoStatus?.vetoed && (
                  <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Veto Applied</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Agent:</strong> {lastResult.vetoStatus.vetoingAgent}
                    </p>
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {lastResult.vetoStatus.vetoReason}
                    </p>
                  </div>
                )}

                {/* False Positive Check */}
                {lastResult.falsePositiveCheck?.isKnownFP && (
                  <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Known False Positive Pattern</span>
                    </div>
                    <p className="text-sm text-orange-700 mt-2">
                      This detection matches a known false positive pattern and has been rejected.
                    </p>
                  </div>
                )}

                {/* Quality Report */}
                {lastResult.qualityReport && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Data Quality Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overall Quality Score:</span>
                        <Badge variant={lastResult.qualityReport.pass ? "default" : "destructive"}>
                          {(lastResult.qualityReport.overallQualityScore * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      {lastResult.qualityReport.issues.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-red-600">Issues:</span>
                          <ul className="text-sm text-red-600 ml-4">
                            {lastResult.qualityReport.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agents" className="mt-4">
                <div className="space-y-3">
                  {Object.entries(lastResult.agentResults).map(([agentName, result]) => (
                    <div key={agentName} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{agentName}</h5>
                        <Badge variant={result.detection ? "default" : "secondary"}>
                          {result.detection ? 'DETECTION' : 'NO DETECTION'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <div className="font-medium">{(result.confidence * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Uncertainty:</span>
                          <div className="font-medium">{(result.uncertainty * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processing Time:</span>
                          <div className="font-medium">{result.metadata?.processingTime || 0}ms</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <div className="font-medium text-xs">{result.metadata?.method || 'Unknown'}</div>
                        </div>
                      </div>
                      {result.data && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div>Anomalies detected: {result.data.anomalies?.length || 0}</div>
                          {result.physicsValidation && (
                            <div className={`mt-1 ${result.physicsValidation.passesPhysics ? 'text-green-600' : 'text-red-600'}`}>
                              Physics: {result.physicsValidation.passesPhysics ? 'PASS' : 'FAIL'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="validation" className="mt-4">
                <div className="space-y-4">
                  {/* Data Quality Validation */}
                  {lastResult.qualityReport && (
                    <div>
                      <h4 className="font-medium mb-2">Data Quality Validation</h4>
                      <div className="space-y-2">
                        <Progress value={lastResult.qualityReport.overallQualityScore * 100} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          Score: {(lastResult.qualityReport.overallQualityScore * 100).toFixed(1)}%
                        </div>
                        {lastResult.qualityReport.recommendations.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Recommendations:</span>
                            <ul className="text-sm ml-4">
                              {lastResult.qualityReport.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Physics Validation */}
                  {Object.values(lastResult.agentResults).some((result: any) => result.physicsValidation) && (
                    <div>
                      <h4 className="font-medium mb-2">Physics Validation</h4>
                      <div className="space-y-2">
                        {Object.entries(lastResult.agentResults).map(([agentName, result]: [string, any]) => (
                          result.physicsValidation && (
                            <div key={agentName} className="p-2 border rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{agentName}</span>
                                <Badge variant={result.physicsValidation.passesPhysics ? "default" : "destructive"}>
                                  {result.physicsValidation.passesPhysics ? 'PASS' : 'FAIL'}
                                </Badge>
                              </div>
                              {result.physicsValidation.violations.length > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  Violations: {result.physicsValidation.violations.join(', ')}
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}