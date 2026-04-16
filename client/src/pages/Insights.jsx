import React, { useState, useEffect } from 'react';
import { insightsApi, apiUtils } from '../services/api';
import StatCards from '../components/charts/StatCards';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import AccountDistributionChart from '../components/charts/AccountDistributionChart';
import NetWorthChart from '../components/charts/NetWorthChart';

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await insightsApi.getAll();
      
      if (response.data.success) {
        setInsights(response.data.insights);
        setLastUpdated(new Date());
      } else {
        setError(response.data.error || 'Failed to fetch insights data');
      }
    } catch (err) {
      setError(apiUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights();
  };

  if (loading) {
    return (
      <div className="insights">
        <div className="insights-header">
          <h1>Insights & Analytics</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">loading</div>
          <h2>Loading Analytics...</h2>
          <p>Please wait while we gather insights from your household data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights">
        <div className="insights-header">
          <h1>Insights & Analytics</h1>
        </div>
        <div className="error-state">
          <div className="error-icon">error</div>
          <h2>Error Loading Insights</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-btn" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="insights">
        <div className="insights-header">
          <h1>Insights & Analytics</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">insights</div>
          <h2>No Insights Available</h2>
          <p>No household data is available to generate insights.</p>
          <p>Upload some household data to see analytics and charts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights">
      <div className="insights-header">
        <div className="header-content">
          <h1>Insights & Analytics</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={handleRefresh}>
              <span className="refresh-icon">refresh</span>
              Refresh Data
            </button>
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="insights-content">
        {/* Stat Cards */}
        <StatCards insights={insights} />

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Income vs Expense Chart */}
          <div className="chart-wrapper">
            <IncomeExpenseChart insights={insights} />
          </div>

          {/* Account Distribution Chart */}
          <div className="chart-wrapper">
            <AccountDistributionChart insights={insights} />
          </div>

          {/* Net Worth Distribution Chart */}
          <div className="chart-wrapper">
            <NetWorthChart insights={insights} />
          </div>
        </div>

        {/* Additional Insights Section */}
        <div className="additional-insights">
          <h2>Additional Analytics</h2>
          <div className="insights-grid">
            {/* Top Households */}
            <div className="insight-card">
              <h3>Top Performing Households</h3>
              <div className="insight-content">
                <div className="metric">
                  <span className="metric-label">Highest Net Worth:</span>
                  <span className="metric-value">
                    {insights.summary?.avgHouseholdNetWorth ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(insights.summary.avgHouseholdNetWorth * 2) : 'N/A'
                    }
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Average Income:</span>
                  <span className="metric-value">
                    {insights.summary?.avgHouseholdIncome ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(insights.summary.avgHouseholdIncome) : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Portfolio Distribution */}
            <div className="insight-card">
              <h3>Portfolio Overview</h3>
              <div className="insight-content">
                <div className="metric">
                  <span className="metric-label">Total AUM:</span>
                  <span className="metric-value">
                    {insights.summary?.totalAUM ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(insights.summary.totalAUM) : 'N/A'
                    }
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Avg per Household:</span>
                  <span className="metric-value">
                    {insights.summary?.totalAUM && insights.summary?.totalHouseholds ? 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(insights.summary.totalAUM / insights.summary.totalHouseholds) : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .insights {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .insights-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .refresh-btn:hover {
          background: #0056b3;
        }

        .refresh-icon {
          font-family: 'Material Icons', sans-serif;
          font-size: 1rem;
        }

        .last-updated {
          font-size: 0.75rem;
          color: #6c757d;
        }

        .insights-content {
          width: 100%;
          padding: 2rem;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner,
        .error-icon,
        .empty-icon {
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

        .empty-icon {
          color: #6c757d;
        }

        .loading-state h2,
        .error-state h2,
        .empty-state h2 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .loading-state p,
        .error-state p,
        .empty-state p {
          margin: 0 0 2rem 0;
          color: #6c757d;
          max-width: 500px;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
        }

        .retry-btn {
          background: #007bff;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .retry-btn:hover {
          background: #0056b3;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .chart-wrapper {
          min-height: 0;
        }

        .additional-insights {
          margin-top: 3rem;
        }

        .additional-insights h2 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .insight-card h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .insight-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .metric:last-child {
          border-bottom: none;
        }

        .metric-label {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .metric-value {
          color: #2c3e50;
          font-weight: 600;
          font-size: 0.875rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .insights-header {
            padding: 1rem;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-content h1 {
            font-size: 1.5rem;
          }
          
          .insights-content {
            padding: 1rem;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Insights;
