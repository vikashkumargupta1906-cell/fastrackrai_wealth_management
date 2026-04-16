import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NetWorthChart = ({ insights }) => {
  if (!insights || !insights.netWorthDistribution) {
    return <div className="chart-loading">Loading net worth distribution data...</div>;
  }

  const data = insights.netWorthDistribution.map(range => ({
    name: range.range,
    count: range.count,
    percentage: range.percentage
  }));

  const formatYAxis = (value) => {
    return `${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <div className="tooltip-title">{data.name}</div>
          <div className="tooltip-item">
            <span className="tooltip-label">Households:</span>
            <span className="tooltip-value">{data.count}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">Percentage:</span>
            <span className="tooltip-value">{data.percentage.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (percentage) => {
    if (percentage >= 30) return '#28a745'; // Green - high concentration
    if (percentage >= 15) return '#ffc107'; // Yellow - medium concentration
    return '#007bff'; // Blue - low concentration
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Net Worth Distribution</h3>
        <p>Households grouped by net worth ranges</p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12 }}
            label={{ value: 'Number of Households', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            name="Households"
            radius={[8, 8, 0, 0]}
            fill={(entry) => getBarColor(entry.percentage)}
          >
            {data.map((entry, index) => (
              <Bar key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-insights">
        <h4>Key Insights</h4>
        <div className="insights-grid">
          {data.map((item, index) => (
            <div key={index} className="insight-item">
              <div 
                className="insight-indicator"
                style={{ backgroundColor: getBarColor(item.percentage) }}
              />
              <div className="insight-content">
                <div className="insight-range">{item.name}</div>
                <div className="insight-stats">
                  <span>{item.count} households</span>
                  <span>({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .chart-loading {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .chart-header {
          margin-bottom: 1.5rem;
        }

        .chart-header h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .chart-header p {
          margin: 0;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .custom-tooltip {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .tooltip-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .tooltip-item {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .tooltip-label {
          color: #6c757d;
        }

        .tooltip-value {
          color: #2c3e50;
          font-weight: 500;
        }

        .chart-insights {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        .chart-insights h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .insight-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .insight-content {
          flex: 1;
        }

        .insight-range {
          font-weight: 500;
          color: #2c3e50;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .insight-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .chart-container {
            padding: 1rem;
          }
          
          .chart-header h3 {
            font-size: 1.125rem;
          }
          
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default NetWorthChart;
