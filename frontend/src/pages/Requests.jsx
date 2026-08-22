import React, { useState } from "react";

function Requests() {
  const [requests, setRequests] = useState(() => {
    return JSON.parse(localStorage.getItem("leaveRequests")) || [];
  });

  const updateRequestStatus = (id, status) => {
    const updatedRequests = requests.map((request) =>
      request.id === id
        ? { ...request, status }
        : request
    );

    setRequests(updatedRequests);

    localStorage.setItem(
      "leaveRequests",
      JSON.stringify(updatedRequests)
    );
  };

  return (
    <div className="requests-page">
      <div className="page-header">
        <div>
          <h1>Requests & Approvals</h1>
          <p>Review and manage employee leave requests.</p>
        </div>
      </div>

      <section className="leave-section">
        <div className="section-heading">
          <h2>Leave Requests</h2>
          <p>Review pending, approved, and rejected requests.</p>
        </div>

        {requests.length > 0 ? (
          <div className="leave-list">
            {requests.map((request) => (
              <div className="leave-row" key={request.id}>
                <div className="leave-info">
                  <strong>Employee</strong>

                  <span>
                    {request.leaveType}
                  </span>

                  <span>
                    {request.startDate} — {request.endDate}
                  </span>

                  {request.reason && (
                    <span>
                      Reason: {request.reason}
                    </span>
                  )}
                </div>

                <span
                  className={`status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>

                {request.status === "Pending" && (
                  <div className="request-actions">
                    <button
                      className="approve-button"
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "Rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No leave requests to review.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Requests;