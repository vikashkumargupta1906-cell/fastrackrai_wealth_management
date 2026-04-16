import React from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  TrendingUp, 
  LineChart 
} from 'lucide-react';

const StatCards = ({ insights }) => {
  if (!insights || !insights.summary) {
    return <div className="stat-cards-loading">Loading statistics...</div>;
  }

  const { summary } = insights;

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statCards = [
    {
      title: 'Total AUM',
      value: formatCurrency(summary.totalAUM),
      icon: <Building2 size={24} />,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      description: 'Assets Under Management'
    },
    {
      title: 'Total Households',
      value: formatNumber(summary.totalHouseholds),
      icon: <Home size={24} />,
      color: '#16a34a',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      description: 'Active households'
    },
    {
      title: 'Total Members',
      value: formatNumber(summary.totalMembers),
      icon: <Users size={24} />,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      description: 'Total household members'
    },
    {
      title: 'Avg Income',
      value: formatCurrency(summary.avgHouseholdIncome),
      icon: <TrendingUp size={24} />,
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#ffedd5',
      description: 'Average annual income'
    },
    {
      title: 'Avg Net Worth',
      value: formatCurrency(summary.avgHouseholdNetWorth),
      icon: <LineChart size={24} />,
      color: '#0891b2',
      bgColor: '#ecfeff',
      borderColor: '#cffafe',
      description: 'Average household net worth'
    }
  ];

  return (
    <div className="stat-cards">
      <div className="stat-cards-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-header">
              <div 
                className="stat-icon"
                style={{ 
                  backgroundColor: card.bgColor,
                  color: card.color,
                  borderColor: card.borderColor
                }}
              >
                {card.icon}
              </div>
              <div className="stat-title">{card.title}</div>
            </div>
            
            <div className="stat-value">{card.value}</div>
            
            <div className="stat-description">{card.description}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .stat-cards {
          margin-bottom: 2rem;
        }

        .stat-cards-loading {
          text-align: center;
          padding: 2rem;
          color: #64748b;
        }

        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }

        .stat-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.2;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.375rem;
          line-height: 1;
        }

        .stat-description {
          font-size: 0.8125rem;
          color: #94a3b8;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .stat-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatCards;
