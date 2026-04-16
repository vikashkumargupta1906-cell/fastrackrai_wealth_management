import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown 
} from 'lucide-react';

const AccountsTab = ({ accounts }) => {
  const [sortField, setSortField] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!accounts) {
    return <div className="tab-loading">Loading accounts data...</div>;
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    // Handle numeric comparison for value and ownershipPercent
    if (sortField === 'value' || sortField === 'ownershipPercent') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const getAccountTypeColor = (accountType) => {
    switch (accountType?.toLowerCase()) {
      case 'ira':
      case 'roth ira':
        return '#28a745';
      case '401k':
      case '403b':
        return '#007bff';
      case 'checking':
      case 'savings':
        return '#6c757d';
      case 'brokerage':
        return '#6f42c1';
      case 'cd':
        return '#fd7e14';
      default:
        return '#6c757d';
    }
  };

  const getOwnershipColor = (ownership) => {
    const percent = parseFloat(ownership) || 0;
    if (percent === 100) return '#28a745';
    if (percent >= 50) return '#ffc107';
    return '#dc3545';
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown size={14} className="sort-icon inactive" />;
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="sort-icon active" /> : 
      <ChevronDown size={14} className="sort-icon active" />;
  };

  const totalValue = accounts.reduce((sum, account) => 
    sum + (parseFloat(account.value) || 0), 0
  );

  return (
    <div className="accounts-tab">
      <div className="tab-header">
        <h3>Accounts ({accounts.length})</h3>
        <div className="total-value">
          <strong>Total Value:</strong> {formatCurrency(totalValue)}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts found for this household.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('accountType')} className="sortable">
                  <div className="th-content">
                    Account Type {renderSortIcon('accountType')}
                  </div>
                </th>
                <th onClick={() => handleSort('custodian')} className="sortable">
                  <div className="th-content">
                    Custodian {renderSortIcon('custodian')}
                  </div>
                </th>
                <th onClick={() => handleSort('accountNumber')} className="sortable">
                  <div className="th-content">
                    Account Number {renderSortIcon('accountNumber')}
                  </div>
                </th>
                <th onClick={() => handleSort('value')} className="sortable">
                  <div className="th-content">
                    Value {renderSortIcon('value')}
                  </div>
                </th>
                <th onClick={() => handleSort('ownershipPercent')} className="sortable">
                  <div className="th-content">
                    Ownership {renderSortIcon('ownershipPercent')}
                  </div>
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  <div className="th-content">
                    Opened {renderSortIcon('createdAt')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map((account) => (
                <tr key={account.id} className="account-row">
                  <td>
                    <span 
                      className="account-type-badge"
                      style={{ backgroundColor: getAccountTypeColor(account.accountType) }}
                    >
                      {account.accountType || 'N/A'}
                    </span>
                  </td>
                  <td className="custodian-cell">
                    {account.custodian || 'N/A'}
                  </td>
                  <td className="account-number">
                    {account.accountNumber ? (
                      <code className="account-code">
                        {account.accountNumber.slice(-4).padStart(account.accountNumber.length, '*')}
                      </code>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="value-cell">
                    <div className="value-amount">
                      {formatCurrency(account.value)}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="ownership-badge"
                      style={{ backgroundColor: getOwnershipColor(account.ownershipPercent) }}
                    >
                      {formatPercentage(account.ownershipPercent)}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(account.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .accounts-tab {
          padding: 1rem;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tab-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .total-value {
          font-size: 1rem;
          color: #0f172a;
          background: #f1f5f9;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .accounts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .th-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        th {
          background: #f8fafc;
          padding: 1rem;
          text-align: left;
          font-weight: 700;
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
        }

        th.sortable {
          cursor: pointer;
          transition: all 0.2s;
        }

        th.sortable:hover {
          color: #1e293b;
          background: #f1f5f9;
        }

        :global(.sort-icon) {
          opacity: 0.4;
        }

        :global(.sort-icon.active) {
          opacity: 1;
          color: #3b82f6;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
          color: #334155;
        }

        .account-row:hover {
          background: #f8fafc;
        }

        .account-type-badge {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .value-cell .value-amount {
          font-weight: 700;
          color: #0f172a;
        }

        .ownership-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        @media (max-width: 768px) {
          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountsTab;
