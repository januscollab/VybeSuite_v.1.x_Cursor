import { debug } from '../../utils/debug';
import React, { useState } from 'react';
import { Shield, Users, Settings, BarChart3, ArrowLeft } from 'lucide-react';
import { UserManagement } from './UserManagement';
interface AdminLayoutProps {
    onBack?: () => void;
}
type AdminTab = 'users' | 'settings' | 'analytics';
export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const tabs = [
        { id: 'users' as AdminTab, label: 'User Management', icon: Users },
        { id: 'settings' as AdminTab, label: 'System Settings', icon: Settings },
        { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    ];
    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                return <UserManagement />;
            case 'settings':
                return (<div className="bg-bg-primary rounded-xl p-8 text-center">
            <Settings className="w-12 h-12 text-text-quaternary mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-text-primary mb-2">System Settings</h3>
            <p className="text-text-tertiary">System settings management coming soon.</p>
          </div>);
            case 'analytics':
                return (<div className="bg-bg-primary rounded-xl p-8 text-center">
            <BarChart3 className="w-12 h-12 text-text-quaternary mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Analytics</h3>
            <p className="text-text-tertiary">Platform analytics and reporting coming soon.</p>
          </div>);
            default:
                return null;
        }
    };
    return (<div className="min-h-screen bg-bg-canvas">
      {/* Header */}
      <div className="bg-bg-primary border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (<button onClick={onBack} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4"/>
                  Back to Sprint Board
                </button>)}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-devsuite-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-text-inverse"/>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
                  <p className="text-text-tertiary">VybeSuite Super Admin Panel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-bg-primary border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-devsuite-primary text-devsuite-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'}`}>
                  <Icon className="w-4 h-4"/>
                  {tab.label}
                </button>);
        })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>);
};
