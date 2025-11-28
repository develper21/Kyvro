import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, TrendingUp, Clock, CheckCircle, XCircle, Send } from 'lucide-react';

interface DashboardStats {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  totalContacts: number;
  activeCampaigns: number;
}

interface RecentActivity {
  id: string;
  type: 'message_sent' | 'message_delivered' | 'message_failed' | 'campaign_created';
  message: string;
  timestamp: string;
  status: 'success' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    sentMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    totalContacts: 0,
    activeCampaigns: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Load actual data from database
      // For now, showing mock data
      setStats({
        totalMessages: 1247,
        sentMessages: 1156,
        deliveredMessages: 1089,
        failedMessages: 67,
        totalContacts: 3421,
        activeCampaigns: 3
      });

      setRecentActivity([
        {
          id: '1',
          type: 'message_sent',
          message: 'Campaign "Welcome Series" sent to 500 contacts',
          timestamp: '2 minutes ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'message_delivered',
          message: '487 messages delivered successfully',
          timestamp: '5 minutes ago',
          status: 'success'
        },
        {
          id: '3',
          type: 'message_failed',
          message: '13 messages failed to deliver',
          timestamp: '8 minutes ago',
          status: 'error'
        },
        {
          id: '4',
          type: 'campaign_created',
          message: 'New campaign "Product Launch" created',
          timestamp: '1 hour ago',
          status: 'info'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'info') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'info':
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'message_sent':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'message_delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'message_failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'campaign_created':
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const deliveryRate = stats.sentMessages > 0 
    ? Math.round((stats.deliveredMessages / stats.sentMessages) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {greeting}, User! 👋
        </h1>
        <p className="text-gray-400">
          Here's what's happening with your WhatsApp campaigns today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Messages */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.totalMessages.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Messages Sent</div>
        </div>

        {/* Delivered Messages */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-green-400">+12%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.deliveredMessages.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Delivered</div>
        </div>

        {/* Failed Messages */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs text-red-400">-5%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.failedMessages.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Failed</div>
        </div>

        {/* Delivery Rate */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400">+2.1%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {deliveryRate}%
          </div>
          <div className="text-sm text-gray-400">Delivery Rate</div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts & Campaigns */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Total Contacts</span>
              </div>
              <span className="text-white font-medium">
                {stats.totalContacts.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Active Campaigns</span>
              </div>
              <span className="text-white font-medium">
                {stats.activeCampaigns}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="mt-1">
                  {getActivityTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">
                    {activity.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {activity.timestamp}
                    </span>
                    {getStatusIcon(activity.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="glass-dark p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <Send className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-white font-medium">Send Message</div>
            <div className="text-xs text-gray-400">Quick message to contacts</div>
          </button>
          <button className="glass-dark p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <Users className="w-5 h-5 text-green-400 mb-2" />
            <div className="text-white font-medium">Import Contacts</div>
            <div className="text-xs text-gray-400">Add contacts from CSV</div>
          </button>
          <button className="glass-dark p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-white font-medium">View Analytics</div>
            <div className="text-xs text-gray-400">Detailed campaign insights</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
