import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown 
} from 'lucide-react';

const MembersTab = ({ members }) => {
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');

  if (!members) {
    return <div className="tab-loading">Loading members data...</div>;
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    // Handle name concatenation for display/sorting if needed
    if (sortField === 'lastName') {
      aValue = `${a.lastName} ${a.firstName}`.toLowerCase();
      bValue = `${b.lastName} ${b.firstName}`.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship?.toLowerCase()) {
      case 'primary':
        return '#16a34a';
      case 'spouse':
        return '#2563eb';
      case 'child':
        return '#ea580c';
      case 'dependent':
        return '#7c3aed';
      default:
        return '#64748b';
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown size={14} className="sort-icon inactive" />;
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="sort-icon active" /> : 
      <ChevronDown size={14} className="sort-icon active" />;
  };

  return (
    <div className="members-tab">
      <div className="tab-header">
        <h3>Household Members ({members.length})</h3>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <p>No members found for this household.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('lastName')} className="sortable">
                  <div className="th-content">
                    Name {renderSortIcon('lastName')}
                  </div>
                </th>
                <th onClick={() => handleSort('relationship')} className="sortable">
                  <div className="th-content">
                    Relationship {renderSortIcon('relationship')}
                  </div>
                </th>
                <th onClick={() => handleSort('dob')} className="sortable">
                  <div className="th-content">
                    Date of Birth {renderSortIcon('dob')}
                  </div>
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  <div className="th-content">
                    Email {renderSortIcon('email')}
                  </div>
                </th>
                <th onClick={() => handleSort('phone')} className="sortable">
                  <div className="th-content">
                    Phone {renderSortIcon('phone')}
                  </div>
                </th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr key={member.id} className="member-row">
                  <td className="member-name">
                    <div className="name-cell">
                      <strong>{member.firstName} {member.lastName}</strong>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="relationship-badge"
                      style={{ backgroundColor: getRelationshipColor(member.relationship) }}
                    >
                      {member.relationship || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDate(member.dob)}</td>
                  <td>
                    <a href={`mailto:${member.email}`} className="email-link">
                      {member.email || 'N/A'}
                    </a>
                  </td>
                  <td>
                    <a href={`tel:${member.phone}`} className="phone-link">
                      {member.phone || 'N/A'}
                    </a>
                  </td>
                  <td className="address-cell">
                    {member.street && member.city && member.state && member.zip ? (
                      <div className="address">
                        <div>{member.street}</div>
                        <div>
                          {member.city}, {member.state} {member.zip}
                        </div>
                      </div>
                    ) : (
                      <span className="no-address">No address on file</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .members-tab {
          padding: 1rem;
        }

        .tab-header {
          margin-bottom: 1.5rem;
        }

        .tab-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 700;
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

        .members-table {
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
          vertical-align: top;
        }

        .member-row:hover {
          background: #f8fafc;
        }

        .name-cell {
          color: #0f172a;
        }

        .relationship-badge {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-transform: capitalize;
        }

        .email-link, .phone-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .email-link:hover, .phone-link:hover {
          text-decoration: underline;
        }

        .address-cell .address {
          line-height: 1.5;
        }

        .no-address {
          color: #94a3b8;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .address-cell {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MembersTab;
