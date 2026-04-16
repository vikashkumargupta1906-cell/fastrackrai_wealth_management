import React from 'react';

const OverviewTab = ({ household }) => {
  if (!household) {
    return <div className="tab-loading">Loading household data...</div>;
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value}%`;
  };

  const getRiskLevelColor = (riskTolerance) => {
    switch (riskTolerance?.toLowerCase()) {
      case 'conservative':
        return '#28a745';
      case 'moderate':
        return '#ffc107';
      case 'aggressive':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getTimeHorizonColor = (timeHorizon) => {
    switch (timeHorizon?.toLowerCase()) {
      case 'short':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'long':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Financial Summary */}
        <div className="overview-section">
          <h3>Financial Summary</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Annual Income</div>
              <div className="metric-value">{formatCurrency(household.annualIncome)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Net Worth</div>
              <div className="metric-value">{formatCurrency(household.netWorth)}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Liquid Net Worth</div>
              <div className="metric-value">{formatCurrency(household.liquidNetWorth)}</div>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="overview-section">
          <h3>Tax Information</h3>
          <div className="tax-grid">
            <div className="tax-item">
              <div className="tax-label">Tax Bracket</div>
              <div className="tax-value">{household.taxBracket || 'N/A'}</div>
            </div>
            <div className="tax-item">
              <div className="tax-label">Expense Range</div>
              <div className="tax-value">{household.expenseRange || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Investment Profile */}
        <div className="overview-section">
          <h3>Investment Profile</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <div className="profile-label">Risk Tolerance</div>
              <div 
                className="profile-value"
                style={{ color: getRiskLevelColor(household.riskTolerance) }}
              >
                {household.riskTolerance || 'N/A'}
              </div>
            </div>
            <div className="profile-item">
              <div className="profile-label">Time Horizon</div>
              <div 
                className="profile-value"
                style={{ color: getTimeHorizonColor(household.timeHorizon) }}
              >
                {household.timeHorizon || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="overview-section">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Members</div>
              <div className="stat-value">{household.members?.length || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Accounts</div>
              <div className="stat-value">{household.accounts?.length || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Account Value</div>
              <div className="stat-value">
                {formatCurrency(
                  household.accounts?.reduce((sum, account) => sum + (parseFloat(account.value) || 0), 0)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overview-tab {
          padding: 1rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .overview-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
        }

        .overview-section h3 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .metrics-grid,
        .tax-grid,
        .profile-grid,
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .metric-card,
        .tax-item,
        .profile-item,
        .stat-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .metric-label,
        .tax-label,
        .profile-label,
        .stat-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .metric-value,
        .tax-value,
        .profile-value,
        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .metric-value {
          font-size: 1.5rem;
        }

        .tab-loading {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid,
          .tax-grid,
          .profile-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OverviewTab;
