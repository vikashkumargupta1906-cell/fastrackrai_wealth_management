import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IncomeExpenseChart = ({ insights }) => {
  if (!insights || !insights.incomeExpense) {
    return <div className="chart-loading">Loading income vs expense data...</div>;
  }

  const data = insights.incomeExpense.map(household => ({
    name: household.name.length > 15 ? household.name.substring(0, 15) + '...' : household.name,
    fullName: household.name,
    income: household.income || 0,
    expense: household.estimatedExpense || 0,
    savingsRate: household.savingsRate || 0
  })).sort((a, b) => b.income - a.income).slice(0, 10); // Top 10 households

  const formatCurrency = (value) => {
    if (value === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <div className="tooltip-title">{data.fullName}</div>
          <div className="tooltip-item">
            <span className="tooltip-label">Income:</span>
            <span className="tooltip-value income">{formatCurrency(data.income)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">Expense:</span>
            <span className="tooltip-value expense">{formatCurrency(data.expense)}</span>
          </div>
          {data.savingsRate && (
            <div className="tooltip-item">
              <span className="tooltip-label">Savings Rate:</span>
              <span className="tooltip-value">{data.savingsRate.toFixed(1)}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Income vs Expense per Household</h3>
        <p>Top 10 households by income</p>
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="income" 
            fill="#28a745" 
            name="Income"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="expense" 
            fill="#dc3545" 
            name="Estimated Expense"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

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

        .tooltip-value.income {
          color: #28a745;
          font-weight: 500;
        }

        .tooltip-value.expense {
          color: #dc3545;
          font-weight: 500;
        }

        .tooltip-value {
          color: #2c3e50;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .chart-container {
            padding: 1rem;
          }
          
          .chart-header h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default IncomeExpenseChart;
