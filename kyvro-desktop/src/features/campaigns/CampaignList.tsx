import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Send, Clock, CheckCircle, XCircle, Pause, Play } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  templateName: string;
  templateLanguage: string;
  status: 'draft' | 'sending' | 'completed' | 'paused' | 'failed';
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  scheduledAt?: string;
}

const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Load actual campaigns from database
      // Mock data for now
      const mockCampaigns: Campaign[] = [
        {
          id: 1,
          name: 'Welcome Series',
          templateName: 'welcome_message',
          templateLanguage: 'en',
          status: 'completed',
          totalContacts: 500,
          sentCount: 500,
          deliveredCount: 487,
          failedCount: 13,
          createdAt: '2023-11-28T10:30:00Z'
        },
        {
          id: 2,
          name: 'Product Launch',
          templateName: 'product_announcement',
          templateLanguage: 'en',
          status: 'sending',
          totalContacts: 1000,
          sentCount: 750,
          deliveredCount: 680,
          failedCount: 70,
          createdAt: '2023-11-28T09:15:00Z'
        },
        {
          id: 3,
          name: 'Holiday Special',
          templateName: 'holiday_offer',
          templateLanguage: 'en',
          status: 'draft',
          totalContacts: 2000,
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          createdAt: '2023-11-27T16:45:00Z'
        },
        {
          id: 4,
          name: 'Weekly Newsletter',
          templateName: 'newsletter',
          templateLanguage: 'en',
          status: 'paused',
          totalContacts: 800,
          sentCount: 400,
          deliveredCount: 350,
          failedCount: 50,
          createdAt: '2023-11-26T14:20:00Z'
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'sending':
        return <Send className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'sending':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sending':
        return 'Sending';
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.totalContacts === 0) return 0;
    return Math.round((campaign.sentCount / campaign.totalContacts) * 100);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400">Manage your WhatsApp messaging campaigns</p>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a3e] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#2a2a3e] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="glass-card p-8 rounded-xl text-center">
            <div className="text-gray-400 mb-2">No campaigns found</div>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first campaign to get started'
              }
            </p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(campaign.status)}
                        <span>{getStatusText(campaign.status)}</span>
                      </span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Template: {campaign.templateName} • Created {formatDate(campaign.createdAt)}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{getProgressPercentage(campaign)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(campaign)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 lg:gap-8 mt-4 lg:mt-0">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{campaign.totalContacts.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">{campaign.deliveredCount.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-400">{campaign.failedCount.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Failed</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                  {campaign.status === 'draft' && (
                    <button className="p-2 glass-dark rounded-lg hover:bg-white/10 transition-colors">
                      <Play className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  {campaign.status === 'sending' && (
                    <button className="p-2 glass-dark rounded-lg hover:bg-white/10 transition-colors">
                      <Pause className="w-4 h-4 text-yellow-400" />
                    </button>
                  )}
                  <button className="p-2 glass-dark rounded-lg hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignList;
