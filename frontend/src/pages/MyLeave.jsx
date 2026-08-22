import React, { useState } from "react";

function MyLeave() {
  const [requests] = useState(() => {
    return JSON.parse(localStorage.getItem("leaveRequests")) || [];
  });

  const leaveBalance = [
    {
      type: "Annual Leave",
      entitlement: 20,
      used: 8,
      remaining: 12,
    },
    {
      type: "Sick Leave",
      entitlement: 10,
      used: 3,
      remaining: 7,
    },
    {
      type: "Casual Leave",
      entitlement: 7,
      used: 2,
      remaining: 5,
    },
  ];

  const previousLeave = [
    {
      id: 1,
      type: "Sick Leave",
      start: "10 Aug 2026",
      end: "11 Aug 2026",
      days: 2,
      status: "Approved",
    },
    {
      id: 2,
      type: "Annual Leave",
      start: "20 Jul 2026",
      end: "22 Jul 2026",
      days: 3,
      status: "Approved",
    },
  ];

  return (
    <div className="my-leave-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Leave</h1>
          <p>
            Manage your leave balance, upcoming time off, and leave history.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            window.location.href = "/request-leave";
          }}
        >
          Request Leave
        </button>
      </div>

      {/* Leave Overview */}
      <section className="leave-section">
        <div className="section-heading">
          <h2>Leave Overview</h2>
          <p>Your current leave entitlement and remaining days.</p>
        </div>

        <div className="leave-balance-grid">
          {leaveBalance.map((leave) => (
            <div className="leave-balance-card" key={leave.type}>
              <h3>{leave.type}</h3>

              <div className="leave-remaining">
                <strong>{leave.remaining}</strong>
                <span>days remaining</span>
              </div>

              <div className="leave-summary">
                <span>
                  Entitlement: <strong>{leave.entitlement} days</strong>
                </span>

                <span>
                  Used: <strong>{leave.used} days</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Leave */}
      <section className="leave-section">
        <div className="section-heading">
          <h2>Upcoming Leave</h2>
          <p>Your approved and pending upcoming leave requests.</p>
        </div>

        {requests.length > 0 ? (
          <div className="leave-list">
            {requests.map((request) => (
              <div className="leave-row" key={request.id}>
                <div className="leave-info">
                  <strong>{request.leaveType}</strong>

                  <span>
                    {request.startDate} — {request.endDate}
                  </span>

                  {request.reason && (
                    <span>Reason: {request.reason}</span>
                  )}
                </div>

                <span
                  className={`status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>You have no upcoming leave requests.</p>
          </div>
        )}
      </section>

      {/* Leave History */}
      <section className="leave-section">
        <div className="section-heading">
          <h2>Leave History</h2>
          <p>A record of your previous leave.</p>
        </div>

        {previousLeave.length > 0 ? (
          <div className="leave-list">
            {previousLeave.map((leave) => (
              <div className="leave-row" key={leave.id}>
                <div className="leave-info">
                  <strong>{leave.type}</strong>

                  <span>
                    {leave.start} — {leave.end}
                  </span>
                </div>

                <span className="leave-duration">
                  {leave.days} days
                </span>

                <span
                  className={`status ${leave.status.toLowerCase()}`}
                >
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No previous leave records found.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MyLeave;