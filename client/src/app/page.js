"use client";
import React, { useEffect, useState } from "react";

// 👇 CHANGE THIS if your backend runs on a non-standard port or needs a full URL in development (if using a proxy, `/api/import-logs` is enough)
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/import-logs`;

export default function ImportHistory() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?page=${page}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page, perPage: 20, total: 0, totalPages: 1 });
    } catch (error) {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (!pagination || !pagination.totalPages) return;
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (newPage === pagination.page) return;
    fetchLogs(newPage);
  };

  // Build compact page list with ellipses: [1, ..., p-1, p, p+1, ..., total]
  const getPageNumbers = () => {
    const current = pagination.page || 1;
    const total = pagination.totalPages || 1;
    const windowSize = 2; // pages around current
    const pages = [];
    const push = (n) => pages.push(n);
    if (total <= 7) {
      for (let i = 1; i <= total; i++) push(i);
      return pages;
    }
    push(1);
    if (current - windowSize > 2) pages.push('…');
    const start = Math.max(2, current - windowSize);
    const end = Math.min(total - 1, current + windowSize);
    for (let i = start; i <= end; i++) push(i);
    if (current + windowSize < total - 1) pages.push('…');
    push(total);
    return pages;
  };

  return (
    <div className="container mt-5">
      <h2>Import History</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
        <table className="table table-bordered table-hover mt-4">
          <thead className="thead-light">
            <tr>
              <th>File Name (Feed URL)</th>
              <th>Timestamp</th>
              <th>Total</th>
              <th>New</th>
              <th>Updated</th>
              <th>Failed</th>
              <th>Failure Reasons</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">No logs found.</td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ wordBreak: "break-all" }}>{log.fileName}</td>
                  <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</td>
                  <td>{log.totalFetched}</td>
                  <td>{log.newJobs}</td>
                  <td>{log.updatedJobs}</td>
                  <td>{log.failedJobs}</td>
                  <td>
                    {log.failureReasons && log.failureReasons.length
                      ? log.failureReasons.join(', ')
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${pagination.page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                Previous
              </button>
            </li>
            {getPageNumbers().map((p, idx) => (
              <li key={`${p}-${idx}`} className={`page-item ${p === '…' ? 'disabled' : ''} ${p === pagination.page ? 'active' : ''}`}>
                {p === '…' ? (
                  <span className="page-link">…</span>
                ) : (
                  <button className="page-link" onClick={() => handlePageChange(p)} disabled={p === pagination.page}>{p}</button>
                )}
              </li>
            ))}
            <li className={`page-item ${pagination.page === pagination.totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                Next
              </button>
            </li>
          </ul>
          <div className="text-center text-muted small">
            Showing {(pagination.page - 1) * pagination.perPage + (logs.length ? 1 : 0)}–{(pagination.page - 1) * pagination.perPage + logs.length} of {pagination.total}
          </div>
        </nav>
        </>
      )}
    </div>
  );
}
