import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AccountDistributionChart = ({ insights }) => {
  if (!insights || !insights.accountDistribution) {
    return <div className="chart-loading">Loading account distribution data...</div>;
  }

  // Group small categories into "Other" to prevent clutter
  const processedData = React.useMemo(() => {
    if (!insights?.accountDistribution) return [];
    
    const sorted = [...insights.accountDistribution].sort((a, b) => b.count - a.count);
    const threshold = 2; // Categories with fewer than this many accounts get grouped
    
    const mainCategories = sorted.filter(item => item.count >= threshold);
    const otherCategories = sorted.filter(item => item.count < threshold);
    
    if (otherCategories.length > 0) {
      const otherTotalCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
      const otherTotalValue = otherCategories.reduce((sum, item) => sum + item.totalValue, 0);
      
      mainCategories.push({
        accountType: 'Other',
        count: otherTotalCount,
        totalValue: otherTotalValue,
        averageValue: otherTotalValue / otherTotalCount
      });
    }
    
    return mainCategories.map(item => ({
      name: item.accountType,
      value: item.count,
      totalValue: item.totalValue,
      averageValue: item.averageValue
    }));
  }, [insights]);

  const COLORS = [
    '#007bff', '#28a745', '#fd7e14', '#dc3545', '#6f42c1', 
    '#20c997', '#ffc107', '#6c757d', '#e83e8c', '#17a2b8'
  ];

  const formatCurrency = (value) => {
    if (value === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <div className="tooltip-title">{data.name}</div>
          <div className="tooltip-item">
            <span className="tooltip-label">Accounts:</span>
            <span className="tooltip-value">{data.value}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">Total Value:</span>
            <span className="tooltip-value">{formatCurrency(data.totalValue)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalAccounts = processedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Account Distribution</h3>
        <p>{totalAccounts} total accounts</p>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '11px',
                maxHeight: '80px',
                overflowY: 'auto'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          height: 100%;
        }

        .chart-header {
          margin-bottom: 1rem;
        }

        .chart-header h3 {
          margin: 0;
          font-size: 1.125rem;
          color: #2c3e50;
        }

        .chart-header p {
          margin: 0;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .chart-wrapper {
          position: relative;
        }

        .custom-tooltip {
          background: white;
          border: 1px solid #e9ecef;
          padding: 0.75rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .tooltip-title {
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default AccountDistributionChart;
