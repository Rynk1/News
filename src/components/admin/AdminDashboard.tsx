// Comprehensive Admin Dashboard for NewsIntel
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Settings,
  Search,
  Filter,
  Download,
  Mail,
  Ban,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Crown,
  Zap,
  BarChart3,
  Calendar,
  Clock,
  Globe,
  Shield,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  churnRate: number;
  subscriptionDistribution: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
  systemHealth: {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'subscription_upgrade' | 'agent_created' | 'system_alert';
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  subscription: string;
  status: 'active' | 'inactive' | 'trial' | 'expired';
  createdAt: Date;
  lastLoginAt: Date;
  agentsCount: number;
  monthlyUsage: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1247,
    activeUsers: 892,
    monthlyRevenue: 47890,
    churnRate: 3.2,
    subscriptionDistribution: {
      free: 623,
      starter: 398,
      professional: 187,
      enterprise: 39,
    },
    systemHealth: {
      uptime: 99.8,
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 34,
      activeConnections: 1247,
    },
    recentActivity: [
      {
        id: '1',
        type: 'subscription_upgrade',
        message: 'User sarah.johnson@company.com upgraded to Professional',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        severity: 'success',
      },
      {
        id: '2',
        type: 'user_signup',
        message: 'New user registration: john.doe@startup.com',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        severity: 'info',
      },
      {
        id: '3',
        type: 'system_alert',
        message: 'High CPU usage detected on server-02',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        severity: 'warning',
      },
      {
        id: '4',
        type: 'agent_created',
        message: '15 new AI agents created in the last hour',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        severity: 'info',
      },
    ],
  });

  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: 'user_123',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      subscription: 'professional',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      agentsCount: 5,
      monthlyUsage: 1250,
      totalRevenue: 297,
    },
    {
      id: 'user_456',
      name: 'John Doe',
      email: 'john.doe@startup.com',
      subscription: 'starter',
      status: 'trial',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000),
      agentsCount: 2,
      monthlyUsage: 450,
      totalRevenue: 0,
    },
    {
      id: 'user_789',
      name: 'Emily Chen',
      email: 'emily.chen@enterprise.com',
      subscription: 'enterprise',
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(Date.now() - 10 * 60 * 1000),
      agentsCount: 25,
      monthlyUsage: 5000,
      totalRevenue: 897,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesSubscription = subscriptionFilter === 'all' || user.subscription === subscriptionFilter;
    
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  const handleUserAction = async (userId: string, action: string) => {
    console.log(`Performing ${action} on user ${userId}`);
    // In real app, this would make API calls
    
    switch (action) {
      case 'suspend':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'inactive' as const } : user
        ));
        break;
      case 'activate':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'active' as const } : user
        ));
        break;
      case 'send_email':
        // Would integrate with email service
        alert(`Email sent to user ${userId}`);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const exportData = (type: string) => {
    console.log(`Exporting ${type} data`);
    // In real app, this would generate and download CSV/Excel files
    alert(`${type} data export started. You'll receive an email when ready.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">NewsIntel System Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => exportData('system')}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                -0.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.subscriptionDistribution).map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge className={getSubscriptionColor(tier)}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{count}</span>
                          <Progress 
                            value={(count / stats.totalUsers) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.severity === 'success' ? 'bg-green-500' :
                            activity.severity === 'warning' ? 'bg-amber-500' :
                            activity.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agents</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSubscriptionColor(user.subscription)}>
                            {user.subscription}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.agentsCount}</TableCell>
                        <TableCell>{user.monthlyUsage.toLocaleString()}</TableCell>
                        <TableCell>{formatCurrency(user.totalRevenue)}</TableCell>
                        <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setIsUserModalOpen(true);
                              }}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, 'send_email')}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              {user.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.systemHealth.uptime}%</div>
                  <Progress value={stats.systemHealth.uptime} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.systemHealth.cpuUsage}%</div>
                  <Progress value={stats.systemHealth.cpuUsage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.systemHealth.memoryUsage}%</div>
                  <Progress value={stats.systemHealth.memoryUsage} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.systemHealth.activeConnections}</div>
                  <p className="text-xs text-muted-foreground">
                    Real-time connections
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <BarChart3 className="h-32 w-32 text-primary opacity-50" />
                  <div className="ml-4 text-center">
                    <p className="text-lg font-semibold">Revenue Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Detailed charts would be implemented with Chart.js or similar
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <TrendingUp className="h-32 w-32 text-primary opacity-50" />
                  <div className="ml-4 text-center">
                    <p className="text-lg font-semibold">Growth Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      User acquisition and retention metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">API Configuration</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">OpenAI API</span>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">News API</span>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Stripe</span>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">System Limits</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Max Users</span>
                        <span className="text-sm">10,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Rate Limit</span>
                        <span className="text-sm">1000/min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Storage Limit</span>
                        <span className="text-sm">1TB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Modal */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedUser.name}</div>
                      <div><strong>Email:</strong> {selectedUser.email}</div>
                      <div><strong>Status:</strong> 
                        <Badge className={`ml-2 ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                      <div><strong>Subscription:</strong> 
                        <Badge className={`ml-2 ${getSubscriptionColor(selectedUser.subscription)}`}>
                          {selectedUser.subscription}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Usage Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Agents:</strong> {selectedUser.agentsCount}</div>
                      <div><strong>Monthly Usage:</strong> {selectedUser.monthlyUsage.toLocaleString()}</div>
                      <div><strong>Total Revenue:</strong> {formatCurrency(selectedUser.totalRevenue)}</div>
                      <div><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</div>
                      <div><strong>Last Login:</strong> {formatDate(selectedUser.lastLoginAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;