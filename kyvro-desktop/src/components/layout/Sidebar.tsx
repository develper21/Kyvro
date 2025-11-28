import React from 'react';
import { Home, MessageCircle, Users, Settings, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: SidebarItem[];
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick, collapsed = false }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: 3,
      children: [
        {
          id: 'campaigns-list',
          label: 'All Campaigns',
          icon: <MessageCircle className="w-4 h-4" />
        },
        {
          id: 'campaigns-create',
          label: 'Create Campaign',
          icon: <MessageCircle className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Users className="w-5 h-5" />,
      children: [
        {
          id: 'contacts-list',
          label: 'All Contacts',
          icon: <Users className="w-4 h-4" />
        },
        {
          id: 'contacts-import',
          label: 'Import Contacts',
          icon: <Users className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (itemId: string): boolean => {
    return activeItem === itemId || activeItem.startsWith(itemId + '-');
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const isActive = isItemActive(item.id);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group ${
            isActive
              ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-2 border-purple-500'
              : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onItemClick(item.id);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={`${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>
              {item.icon}
            </div>
            {!collapsed && (
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'} transition-colors`}>
                {item.label}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )
              )}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full bg-[#2a2a3e] border-r border-white/10 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg">Kyvro</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">U</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">User</div>
              <div className="text-xs text-gray-400">Free Plan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
