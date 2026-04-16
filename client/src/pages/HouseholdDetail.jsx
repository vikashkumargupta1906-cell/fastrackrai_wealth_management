import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { householdApi, apiUtils } from '../services/api';
import OverviewTab from '../components/tabs/OverviewTab';
import MembersTab from '../components/tabs/MembersTab';
import AccountsTab from '../components/tabs/AccountsTab';
import BanksTab from '../components/tabs/BanksTab';
import AudioNotesTab from '../components/tabs/AudioNotesTab';
import { 
  ArrowLeft, 
  Users, 
  Wallet, 
  Building2, 
  Mic, 
  LayoutDashboard,
  Calendar
} from 'lucide-react';

const HouseholdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [household, setHousehold] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
    { id: 'accounts', label: 'Accounts', icon: <Wallet size={18} /> },
    { id: 'banks', label: 'Banks', icon: <Building2 size={18} /> },
    { id: 'audio-notes', label: 'Audio Notes', icon: <Mic size={18} /> },
  ];

  useEffect(() => {
    fetchHousehold();
  }, [id]);

  const fetchHousehold = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await householdApi.getById(id);
      
      if (response.data.success) {
        setHousehold(response.data.household);
      } else {
        setError(response.data.error || 'Failed to fetch household data');
      }
    } catch (err) {
      setError(apiUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  // Extract tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  if (loading) {
    return (
      <div className="household-detail loading">
        <div className="spinner"></div>
        <p>Loading household details...</p>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div className="household-detail error">
        <h2>Error</h2>
        <p>{error || 'Household not found'}</p>
        <button onClick={() => navigate('/')}>Back to List</button>
      </div>
    );
  }

  return (
    <div className="household-detail">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Back to Households</span>
          </button>
          
          <div className="last-updated">
            <Calendar size={14} />
            Last updated: {new Date(household.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="header-main">
          <h1>{household.name}</h1>
          <div className="header-badges">
            <div className="header-badge">
              <Users size={14} />
              <span>{household.members?.length || 0} Members</span>
            </div>
            <div className="header-badge">
              <Wallet size={14} />
              <span>{household.accounts?.length || 0} Accounts</span>
            </div>
          </div>
        </div>

        <div className="detail-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab household={household} />}
        {activeTab === 'members' && <MembersTab members={household.members} />}
        {activeTab === 'accounts' && <AccountsTab accounts={household.accounts} />}
        {activeTab === 'banks' && <BanksTab accounts={household.accounts} bankDetails={household.bankDetails} />}
        {activeTab === 'audio-notes' && <AudioNotesTab audioNotes={household.audioNotes} />}
      </div>

      <style jsx>{`
        .household-detail {
          padding: 2rem;
          width: 100%;
        }

        .detail-header {
          background: white;
          border-radius: 16px;
          padding: 1.5rem 2rem 0;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .last-updated {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .header-main {
          margin-bottom: 2rem;
        }

        .header-main h1 {
          font-size: 2.25rem;
          color: #1e293b;
          margin: 0 0 0.75rem 0;
          font-weight: 800;
        }

        .header-badges {
          display: flex;
          gap: 1rem;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #f1f5f9;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
        }

        .detail-tabs {
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid #f1f5f9;
          margin: 0 -2rem;
          padding: 0 2rem;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #1e293b;
          background: #f8fafc;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        .error-icon,
        .not-found-icon {
          font-family: 'Material Icons', sans-serif;
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .loading-spinner {
          color: #007bff;
          animation: spin 1s linear infinite;
        }

        .error-icon {
          color: #dc3545;
        }

        .not-found-icon {
          color: #6c757d;
        }

        .loading-state h2,
        .error-state h2,
        .not-found h2 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .loading-state p,
        .error-state p,
        .not-found p {
          margin: 0 0 2rem 0;
          color: #6c757d;
          max-width: 500px;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
        }

        .retry-btn,
        .back-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn {
          background: #007bff;
          color: white;
        }

        .retry-btn:hover {
          background: #0056b3;
        }

        .back-btn {
          background: #6c757d;
          color: white;
        }

        .back-btn:hover {
          background: #545b62;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .household-header {
            padding: 1rem;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .household-info h1 {
            font-size: 1.5rem;
          }
          
          .household-meta {
            gap: 1rem;
          }
          
          .tabs-container {
            padding: 0 1rem;
          }
          
          .tab-button {
            padding: 0.75rem 1rem;
          }
          
          .tab-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HouseholdDetail;
