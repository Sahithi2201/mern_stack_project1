import React from 'react';

/**
 * AdminTable
 * Responsive data table wrapper supporting horizontal scrolling, custom headers,
 * hover rows, and formatted empty states.
 */
const AdminTable = ({
  headers = [],
  children,
  isEmpty = false,
  emptyIcon = '📭',
  emptyTitle = 'No records found',
  emptyMessage = 'There are no records matching your current filter criteria.',
}) => {
  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-container">
        <table className="admin-table">
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} style={h.align ? { textAlign: h.align } : {}}>
                    {h.label || h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={headers.length || 1}>
                  <div className="table-empty-state">
                    <span className="table-empty-icon">{emptyIcon}</span>
                    <h4>{emptyTitle}</h4>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
