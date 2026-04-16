import React, { useState } from 'react';

const BanksTab = ({ accounts, bankDetails }) => {
  const [sortField, setSortField] = useState('totalValue');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!accounts) {
    return <div className="tab-loading">Loading bank data...</div>;
  }

  // Combine real bank details with custodian-grouped accounts
  const banksData = (accounts || []).reduce((acc, account) => {
    const custodian = account.custodian || 'Unknown';
    if (!acc[custodian]) {
      acc[custodian] = {
        name: custodian,
        accounts: [],
        totalValue: 0,
        accountTypes: new Set(),
      };
    }
    acc[custodian].accounts.push(account);
    acc[custodian].totalValue += parseFloat(account.value) || 0;
    if (account.accountType) {
      acc[custodian].accountTypes.add(account.accountType);
    }
    return acc;
  }, {});

  const banks = Object.values(banksData);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBanks = [...banks].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortField === 'totalValue' || sortField === 'accountCount') {
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

  const getBankColor = (bankName) => {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
      '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
    ];
    let hash = 0;
    for (let i = 0; i < bankName.length; i++) {
      hash = bankName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'sort';
    return sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  };

  const totalBankValue = banks.reduce((sum, bank) => sum + bank.totalValue, 0);

  return (
    <div className="banks-tab">
      <div className="tab-header">
        <h3>Financial Institutions ({banks.length})</h3>
        <div className="total-value">
          <strong>Total Assets:</strong> {formatCurrency(totalBankValue)}
        </div>
      </div>

      {bankDetails && bankDetails.length > 0 && (
        <div className="real-banks-section">
          <h4>Specific Bank Details</h4>
          <div className="real-banks-grid">
            {bankDetails.map((bank, idx) => (
              <div key={idx} className="real-bank-card">
                <div className="bank-name-row">
                  <Building2 size={20} color="#3b82f6" />
                  <strong>{bank.bankName || 'Unknown Bank'}</strong>
                </div>
                <div className="bank-info-grid">
                  <div className="info-item">
                    <span className="label">Account Number</span>
                    <span className="value">{bank.accountNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Routing Number</span>
                    <span className="value">{bank.routingNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {banks.length === 0 ? (
        <div className="empty-state">
          <p>No financial institutions found for this household.</p>
        </div>
      ) : (
        <>
          <div className="banks-grid">
            {sortedBanks.map((bank, index) => (
              <div key={index} className="bank-card">
                <div className="bank-header">
                  <div 
                    className="bank-avatar"
                    style={{ backgroundColor: getBankColor(bank.name) }}
                  >
                    {bank.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bank-info">
                    <h4>{bank.name}</h4>
                    <p>{bank.accounts.length} account{bank.accounts.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="bank-metrics">
                  <div className="metric">
                    <div className="metric-label">Total Value</div>
                    <div className="metric-value">{formatCurrency(bank.totalValue)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Account Types</div>
                    <div className="account-types">
                      {Array.from(bank.accountTypes).map(type => (
                        <span key={type} className="account-type-tag">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bank-accounts">
                  <h5>Accounts</h5>
                  <div className="account-list">
                    {bank.accounts.map(account => (
                      <div key={account.id} className="account-item">
                        <div className="account-details">
                          <span className="account-type">{account.accountType}</span>
                          <span className="account-value">
                            {formatCurrency(account.value)}
                          </span>
                        </div>
                        {account.accountNumber && (
                          <div className="account-number">
                            ****{account.accountNumber.slice(-4)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <table className="banks-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Institution <span className="sort-icon">{getSortIcon('name')}</span>
                  </th>
                  <th onClick={() => handleSort('accountCount')} className="sortable">
                    Accounts <span className="sort-icon">{getSortIcon('accountCount')}</span>
                  </th>
                  <th onClick={() => handleSort('totalValue')} className="sortable">
                    Total Value <span className="sort-icon">{getSortIcon('totalValue')}</span>
                  </th>
                  <th>Account Types</th>
                </tr>
              </thead>
              <tbody>
                {sortedBanks.map((bank, index) => (
                  <tr key={index} className="bank-row">
                    <td className="bank-name-cell">
                      <div className="bank-name">
                        <div 
                          className="bank-indicator"
                          style={{ backgroundColor: getBankColor(bank.name) }}
                        />
                        {bank.name}
                      </div>
                    </td>
                    <td>{bank.accounts.length}</td>
                    <td className="value-cell">
                      <strong>{formatCurrency(bank.totalValue)}</strong>
                    </td>
                    <td>
                      <div className="account-types-list">
                        {Array.from(bank.accountTypes).map(type => (
                          <span key={type} className="account-type-badge">
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .banks-tab {
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
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .total-value {
          font-size: 1.125rem;
          color: #2c3e50;
          background: #e3f2fd;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid #bbdefb;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .empty-state p {
          color: #6c757d;
          margin: 0;
        }

        .banks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .bank-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          padding: 1.5rem;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .bank-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .bank-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .bank-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.25rem;
          margin-right: 1rem;
        }

        .bank-info h4 {
          margin: 0 0 0.25rem 0;
          color: #2c3e50;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .bank-info p {
          margin: 0;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .bank-metrics {
          margin-bottom: 1rem;
        }

        .metric {
          margin-bottom: 0.75rem;
        }

        .metric-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .account-types {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .account-type-tag {
          background: #f8f9fa;
          color: #495057;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid #dee2e6;
        }

        .bank-accounts h5 {
          margin: 0 0 0.75rem 0;
          color: #2c3e50;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .account-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .account-item {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .account-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .account-type {
          font-size: 0.875rem;
          color: #495057;
          font-weight: 500;
        }

        .account-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .account-number {
          font-size: 0.75rem;
          color: #6c757d;
          font-family: 'Courier New', monospace;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .banks-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .banks-table th {
          background: #f8f9fa;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }

        .banks-table th.sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }

        .banks-table th.sortable:hover {
          background: #e9ecef;
        }

        .sort-icon {
          margin-left: 0.5rem;
          font-size: 0.75rem;
          opacity: 0.5;
        }

        .banks-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .bank-row:hover {
          background: #f8f9fa;
        }

        .bank-name-cell .bank-name {
          display: flex;
          align-items: center;
          font-weight: 500;
        }

        .bank-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }

        .value-cell {
          font-weight: 600;
          color: #2c3e50;
        }

        .account-types-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .account-type-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid #bbdefb;
        }

        .tab-loading {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .banks-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .banks-table {
            font-size: 0.875rem;
          }
          
          .banks-table th,
          .banks-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BanksTab;
