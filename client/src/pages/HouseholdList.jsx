import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { householdApi, apiUtils } from '../services/api';
import { 
  Search, 
  Users, 
  Wallet, 
  TrendingUp, 
  ChevronRight,
  Filter
} from 'lucide-react';

const HouseholdList = () => {
  const navigate = useNavigate();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await householdApi.getAll();
      if (response.data.success) {
        setHouseholds(response.data.households);
      } else {
        setError(response.data.error || 'Failed to fetch households');
      }
    } catch (err) {
      setError(apiUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredHouseholds = households.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="list-container loading">
        <div className="spinner"></div>
        <p>Loading your households...</p>
      </div>
    );
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h1>Households</h1>
          <p className="subtitle">Manage and monitor your client households</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-mini">
            <span className="label">Total Clients</span>
            <span className="value">{households.length}</span>
          </div>
        </div>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search by household name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchHouseholds}>Retry</button>
        </div>
      ) : filteredHouseholds.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No households found</h3>
          <p>Try adjusting your search or upload an Excel file to get started.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="household-table">
            <thead>
              <tr>
                <th>Household Name</th>
                <th>Members</th>
                <th>Accounts</th>
                <th>Total AUM</th>
                <th>Net Worth</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredHouseholds.map((h) => (
                <tr key={h.id} onClick={() => navigate(`/households/${h.id}`)} className="clickable-row">
                  <td className="name-cell">
                    <div className="household-name">{h.name}</div>
                  </td>
                  <td>
                    <div className="badge members">
                      <Users size={14} />
                      {h.memberCount || 0}
                    </div>
                  </td>
                  <td>
                    <div className="badge accounts">
                      <Wallet size={14} />
                      {h.accountCount || 0}
                    </div>
                  </td>
                  <td className="amount-cell">{formatCurrency(h.totalAccountValue)}</td>
                  <td className="amount-cell">{formatCurrency(h.netWorth)}</td>
                  <td className="action-cell">
                    <ChevronRight size={20} className="arrow-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .list-page {
          padding: 2rem;
          width: 100%;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        h1 {
          font-size: 1.875rem;
          color: #1e293b;
          margin: 0;
          font-weight: 700;
        }

        .subtitle {
          color: #64748b;
          margin-top: 0.25rem;
        }

        .stat-mini {
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-mini .label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-mini .value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .search-bar-container {
          margin-bottom: 1.5rem;
        }

        .search-input-wrapper {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .household-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          background: #f8fafc;
          padding: 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
          border-bottom: 1px solid #e2e8f0;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
          color: #334155;
        }

        .clickable-row {
          cursor: pointer;
          transition: background 0.2s;
        }

        .clickable-row:hover {
          background: #f1f5f9;
        }

        .household-name {
          font-weight: 600;
          color: #1e293b;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .badge.members { background: #eff6ff; color: #2563eb; }
        .badge.accounts { background: #f0fdf4; color: #16a34a; }

        .amount-cell {
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 500;
        }

        .arrow-icon {
          color: #cbd5e1;
          transition: transform 0.2s;
        }

        .clickable-row:hover .arrow-icon {
          transform: translateX(4px);
          color: #3498db;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          color: #64748b;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-state h3 {
          color: #1e293b;
          margin: 1rem 0 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default HouseholdList;
