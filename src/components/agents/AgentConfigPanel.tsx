import React, { useState, useEffect } from "react";
import { PlusCircle, X, Save, Trash2, RefreshCw, Play, Pause, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { agentService, AgentCapabilities, AgentTask } from "@/services/agentService";

interface Agent {
  id: string;
  name: string;
  description: string;
  sources: string[];
  topics: string[];
  entities: string[];
  frequency: string;
  status: "active" | "idle" | "error";
  lastUpdate: string;
  articlesCollected: number;
}

interface AgentConfigPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

const AgentConfigPanel = ({
  open = true,
  onOpenChange,
  onClose,
}: AgentConfigPanelProps) => {
  const [activeTab, setActiveTab] = useState("create");
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "1",
      name: "Tech Industry Tracker",
      description: "Monitors technology industry news and trends with AI-powered analysis",
      sources: ["TechCrunch", "Wired", "The Verge"],
      topics: ["AI", "Cloud Computing", "Cybersecurity"],
      entities: ["Google", "Microsoft", "Apple"],
      frequency: "daily",
      status: "active",
      lastUpdate: "10 min ago",
      articlesCollected: 24,
    },
    {
      id: "2",
      name: "Competitor Analysis",
      description: "Tracks news about direct competitors with sentiment analysis",
      sources: ["Bloomberg", "Reuters", "Financial Times"],
      topics: ["Market Share", "Product Launch", "Acquisitions"],
      entities: ["Amazon", "Facebook", "Netflix"],
      frequency: "hourly",
      status: "active",
      lastUpdate: "1 hour ago",
      articlesCollected: 18,
    },
    {
      id: "3",
      name: "Market Trends",
      description: "Monitors overall market conditions with predictive analytics",
      sources: ["Wall Street Journal", "CNBC", "MarketWatch"],
      topics: ["Stock Market", "Economic Indicators", "Industry Reports"],
      entities: ["S&P 500", "NASDAQ", "Federal Reserve"],
      frequency: "daily",
      status: "idle",
      lastUpdate: "3 hours ago",
      articlesCollected: 12,
    },
  ]);

  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    sources: [],
    topics: [],
    entities: [],
    frequency: "daily",
  });

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [agentCapabilities, setAgentCapabilities] = useState<Map<string, AgentCapabilities>>(new Map());
  const [runningTasks, setRunningTasks] = useState<AgentTask[]>([]);
  const [testResults, setTestResults] = useState<any>(null);

  const frequencies = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
  ];

  const popularSources = [
    "Bloomberg",
    "Reuters",
    "CNBC",
    "Financial Times",
    "Wall Street Journal",
    "TechCrunch",
    "Wired",
    "The Verge",
    "Harvard Business Review",
    "Forbes",
    "BBC News",
    "Associated Press",
    "New York Times",
    "Washington Post",
  ];

  const popularTopics = [
    "Artificial Intelligence",
    "Machine Learning",
    "Cybersecurity",
    "Cloud Computing",
    "Market Analysis",
    "Supply Chain",
    "Sustainability",
    "Remote Work",
    "Digital Transformation",
    "Regulatory Changes",
  ];

  useEffect(() => {
    // Load agent capabilities on mount
    agents.forEach(agent => {
      const capabilities = agentService.getAgentCapabilities(agent.id);
      if (capabilities) {
        setAgentCapabilities(prev => new Map(prev.set(agent.id, capabilities)));
      }
    });
    
    // Load running tasks
    setRunningTasks(agentService.getRunningTasks());
  }, [agents]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim()) return;

    const newId = Math.random().toString(36).substring(2, 9);
    const agent: Agent = {
      ...newAgent,
      id: newId,
      status: "idle",
      lastUpdate: "Just created",
      articlesCollected: 0,
    };
    
    // Deploy the agent with functional capabilities
    const deployed = await agentService.deployAgent(agent);
    
    if (deployed) {
      setAgents([...agents, agent]);
      setNewAgent({
        name: "",
        description: "",
        sources: [],
        topics: [],
        entities: [],
        frequency: "daily",
      });
      setActiveTab("manage");
      
      // Load capabilities for the new agent
      const capabilities = agentService.getAgentCapabilities(newId);
      if (capabilities) {
        setAgentCapabilities(prev => new Map(prev.set(newId, capabilities)));
      }
    }
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(agents.filter((agent) => agent.id !== id));
    if (selectedAgent && selectedAgent.id === id) {
      setSelectedAgent(null);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent({ ...agent });
  };

  const handleUpdateAgent = () => {
    if (!selectedAgent) return;

    setAgents(
      agents.map((agent) =>
        agent.id === selectedAgent.id ? selectedAgent : agent,
      ),
    );
    setSelectedAgent(null);
  };

  const handleTestAgent = async (agent: Agent) => {
    setIsTestingAgent(true);
    setTestResults(null);
    
    try {
      const result = await agentService.testAgentCapabilities(agent);
      setTestResults(result);
      
      // Update agent status
      setAgents(agents.map(a => 
        a.id === agent.id 
          ? { ...a, status: "active", lastUpdate: "Just now", articlesCollected: a.articlesCollected + 3 }
          : a
      ));
    } catch (error) {
      console.error("Agent test failed:", error);
    } finally {
      setIsTestingAgent(false);
    }
  };

  const handleRunAgentTask = async (agent: Agent, taskType: 'scrape' | 'analyze' | 'synthesize' | 'monitor') => {
    try {
      const task = await agentService.executeAgentTask(agent, taskType);
      setRunningTasks(prev => [...prev, task]);
      
      // Update agent status
      setAgents(agents.map(a => 
        a.id === agent.id 
          ? { ...a, status: "active", lastUpdate: "Running task..." }
          : a
      ));
    } catch (error) {
      console.error("Failed to run agent task:", error);
    }
  };

  const handleAddItem = (field: string, value: string) => {
    if (!value.trim()) return;

    const currentAgent = selectedAgent || newAgent;
    const updatedAgent = {
      ...currentAgent,
      [field]: [...currentAgent[field], value.trim()],
    };

    if (selectedAgent) {
      setSelectedAgent(updatedAgent);
    } else {
      setNewAgent(updatedAgent);
    }

    // Clear the input field
    const inputElement = document.getElementById(`${field}-input`) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = "";
    }
  };

  const handleRemoveItem = (field: string, index: number) => {
    const currentAgent = selectedAgent || newAgent;
    const updatedItems = [...currentAgent[field]];
    updatedItems.splice(index, 1);
    
    const updatedAgent = {
      ...currentAgent,
      [field]: updatedItems,
    };

    if (selectedAgent) {
      setSelectedAgent(updatedAgent);
    } else {
      setNewAgent(updatedAgent);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-amber-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const renderAgentCapabilities = (agentId: string) => {
    const capabilities = agentCapabilities.get(agentId);
    if (!capabilities) return null;

    return (
      <div className="mt-4 p-3 bg-accent/20 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Agent Capabilities</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center ${capabilities.webScraping ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Web Scraping
          </div>
          <div className={`flex items-center ${capabilities.sentimentAnalysis ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Sentiment Analysis
          </div>
          <div className={`flex items-center ${capabilities.entityExtraction ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Entity Extraction
          </div>
          <div className={`flex items-center ${capabilities.contentSynthesis ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Content Synthesis
          </div>
          <div className={`flex items-center ${capabilities.realTimeMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Real-time Monitoring
          </div>
          <div className={`flex items-center ${capabilities.alertGeneration ? 'text-green-600' : 'text-gray-400'}`}>
            <Activity className="h-3 w-3 mr-1" />
            Alert Generation
          </div>
        </div>
      </div>
    );
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Agent Test Results</h4>
        <div className="space-y-2 text-sm text-green-700">
          {Object.entries(testResults.testResults).map(([key, value]) => (
            <div key={key} className="flex items-start">
              <span className="font-medium mr-2">✓</span>
              <span>{value as string}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgentActions = (agent: Agent) => (
    <div className="mt-3 flex flex-wrap gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRunAgentTask(agent, 'scrape')}
        className="text-xs h-7"
      >
        <Play className="h-3 w-3 mr-1" />
        Scrape
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRunAgentTask(agent, 'analyze')}
        className="text-xs h-7"
      >
        <Activity className="h-3 w-3 mr-1" />
        Analyze
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRunAgentTask(agent, 'synthesize')}
        className="text-xs h-7"
      >
        <Save className="h-3 w-3 mr-1" />
        Synthesize
      </Button>
    </div>
  );

  const renderAgentForm = (agent = newAgent) => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          placeholder="E.g., Tech Industry Tracker"
          value={agent.name}
          onChange={(e) => {
            if (selectedAgent) {
              setSelectedAgent({ ...selectedAgent, name: e.target.value });
            } else {
              setNewAgent({ ...newAgent, name: e.target.value });
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what this agent will track..."
          value={agent.description}
          onChange={(e) => {
            if (selectedAgent) {
              setSelectedAgent({
                ...selectedAgent,
                description: e.target.value,
              });
            } else {
              setNewAgent({ ...newAgent, description: e.target.value });
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>News Sources</Label>
        <div className="flex gap-2">
          <Input id="sources-input" placeholder="Add news source..." />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById("sources-input") as HTMLInputElement;
              handleAddItem("sources", input?.value || "");
            }}
          >
            Add
          </Button>
        </div>
        <div className="mt-2">
          <Label className="text-sm text-muted-foreground">
            Popular Sources
          </Label>
          <div className="flex flex-wrap gap-2 mt-1 max-h-24 overflow-y-auto">
            {popularSources.map((source) => (
              <Badge
                key={source}
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => handleAddItem("sources", source)}
              >
                {source}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {agent.sources.map((source, index) => (
            <Badge key={index} className="pl-2 pr-1 flex items-center gap-1">
              {source}
              <button
                onClick={() => handleRemoveItem("sources", index)}
                className="ml-1 rounded-full hover:bg-accent p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Topics/Keywords</Label>
        <div className="flex gap-2">
          <Input id="topics-input" placeholder="Add topic or keyword..." />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById("topics-input") as HTMLInputElement;
              handleAddItem("topics", input?.value || "");
            }}
          >
            Add
          </Button>
        </div>
        <div className="mt-2">
          <Label className="text-sm text-muted-foreground">
            Popular Topics
          </Label>
          <div className="flex flex-wrap gap-2 mt-1 max-h-24 overflow-y-auto">
            {popularTopics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => handleAddItem("topics", topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {agent.topics.map((topic, index) => (
            <Badge key={index} className="pl-2 pr-1 flex items-center gap-1">
              {topic}
              <button
                onClick={() => handleRemoveItem("topics", index)}
                className="ml-1 rounded-full hover:bg-accent p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Entities (Companies, People, etc.)</Label>
        <div className="flex gap-2">
          <Input id="entities-input" placeholder="Add entity..." />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById("entities-input") as HTMLInputElement;
              handleAddItem("entities", input?.value || "");
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {agent.entities.map((entity, index) => (
            <Badge key={index} className="pl-2 pr-1 flex items-center gap-1">
              {entity}
              <button
                onClick={() => handleRemoveItem("entities", index)}
                className="ml-1 rounded-full hover:bg-accent p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Update Frequency</Label>
        <Select
          value={agent.frequency}
          onValueChange={(value) => {
            if (selectedAgent) {
              setSelectedAgent({ ...selectedAgent, frequency: value });
            } else {
              setNewAgent({ ...newAgent, frequency: value });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {frequencies.map((freq) => (
              <SelectItem key={freq.value} value={freq.value}>
                {freq.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            AI News Agent Configuration & Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create New Agent</TabsTrigger>
            <TabsTrigger value="manage">Manage Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="tasks">Running Tasks ({runningTasks.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Create New AI Agent
                  </CardTitle>
                  <CardDescription>
                    Configure a new AI agent with advanced capabilities including web scraping, 
                    sentiment analysis, entity extraction, and content synthesis.
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderAgentForm()}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAgent && selectedAgent.id === agent.id 
                        ? "border-primary bg-accent/50" 
                        : "hover:bg-accent/20"
                    }`}
                    onClick={() => handleSelectAgent(agent)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}
                          ></div>
                          <span>{agent.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestAgent(agent);
                            }}
                            disabled={isTestingAgent}
                          >
                            <RefreshCw className={`h-4 w-4 ${isTestingAgent ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAgent(agent.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <span className="capitalize">{agent.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Frequency:</span>
                          <span className="capitalize">{agent.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Articles:</span>
                          <span>{agent.articlesCollected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Update:</span>
                          <span className="text-muted-foreground">{agent.lastUpdate}</span>
                        </div>
                      </div>
                      
                      {renderAgentCapabilities(agent.id)}
                      {renderAgentActions(agent)}
                      {selectedAgent?.id === agent.id && renderTestResults()}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedAgent && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Edit Agent: {selectedAgent.name}</CardTitle>
                    <CardDescription>
                      Update the configuration for this AI agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderAgentForm(selectedAgent)}</CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-3">
                {runningTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks currently running
                  </div>
                ) : (
                  runningTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">
                              {task.type.charAt(0).toUpperCase() + task.type.slice(1)} Task
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Agent: {agents.find(a => a.id === task.agentId)?.name}
                            </p>
                          </div>
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'failed' ? 'destructive' :
                            task.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Started: {task.startTime.toLocaleTimeString()}
                          {task.endTime && ` • Completed: ${task.endTime.toLocaleTimeString()}`}
                          {task.error && (
                            <div className="text-red-600 mt-1">Error: {task.error}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <Activity className="h-4 w-4 mr-2" />
            {agents.filter(a => a.status === "active").length} active agents • {runningTasks.filter(t => t.status === 'running').length} running tasks
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {activeTab === "create" ? (
              <Button 
                onClick={handleCreateAgent} 
                disabled={!newAgent.name.trim() || newAgent.sources.length === 0}
              >
                Deploy Agent
              </Button>
            ) : selectedAgent ? (
              <Button onClick={handleUpdateAgent}>Update Agent</Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentConfigPanel;