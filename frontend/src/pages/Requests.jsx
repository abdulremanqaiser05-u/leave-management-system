import React, { useEffect, useState } from "react";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("authToken");

  // =========================================
  // CALCULATE DURATION
  // =========================================

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference =
      end.getTime() - start.getTime();

    if (difference < 0) {
      return 0;
    }

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =========================================
  // FETCH ALL REQUESTS
  // =========================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const currentToken =
        localStorage.getItem("authToken");

      if (!currentToken) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/admin/leave-requests",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load leave requests"
        );
      }

      setRequests(data);
    } catch (error) {
      console.error(
        "Failed to fetch requests:",
        error
      );

      setError(
        error.message ||
          "Failed to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD REQUESTS
  // =========================================

  useEffect(() => {
    fetchRequests();
  }, []);

  // =========================================
  // UPDATE REQUEST STATUS
  // =========================================

  const updateRequestStatus = async (
    id,
    action
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const currentToken =
        localStorage.getItem("authToken");

      if (!currentToken) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/leave-requests/${id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${action} leave request`
        );
      }

      // Refresh the list from PostgreSQL
      await fetchRequests();

      alert(
        data.message ||
          `Leave request ${
            action === "approve"
              ? "approved"
              : "rejected"
          } successfully.`
      );
    } catch (error) {
      console.error(
        `Failed to ${action} request:`,
        error
      );

      setError(
        error.message ||
          `Failed to ${action} request.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================
  // COUNT REQUESTS
  // =========================================

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "PENDING"
    ).length;

  const approvedCount =
    requests.filter(
      (request) =>
        request.status === "APPROVED"
    ).length;

  const rejectedCount =
    requests.filter(
      (request) =>
        request.status === "REJECTED"
    ).length;

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="requests-page">

        <div className="page-header">
          <div>
            <h1>
              Requests & Approvals
            </h1>

            <p>
              Review and manage employee
              leave requests.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <p>
            Loading leave requests...
          </p>
        </div>

      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="requests-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page-header">

        <div>
          <h1>
            Requests & Approvals
          </h1>

          <p>
            Review and manage employee
            leave requests.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={fetchRequests}
          disabled={loading}
        >
          Refresh
        </button>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================
          REQUEST SUMMARY
      ===================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Pending Requests
            </span>

            <div className="stat-icon warning">
              !
            </div>
          </div>

          <div className="stat-value">
            {pendingCount}
          </div>

          <p>
            Waiting for approval
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Approved
            </span>

            <div className="stat-icon">
              ✓
            </div>
          </div>

          <div className="stat-value">
            {approvedCount}
          </div>

          <p>
            Approved requests
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Rejected
            </span>

            <div className="stat-icon">
              ×
            </div>
          </div>

          <div className="stat-value">
            {rejectedCount}
          </div>

          <p>
            Rejected requests
          </p>

        </div>

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Total Requests
            </span>

            <div className="stat-icon">
              ◷
            </div>
          </div>

          <div className="stat-value">
            {requests.length}
          </div>

          <p>
            All leave requests
          </p>

        </div>

      </div>

      {/* =====================================
          REQUEST SECTION
      ===================================== */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Leave Requests
          </h2>

          <p>
            Review pending, approved,
            and rejected requests.
          </p>

        </div>

        {/* =================================
            REQUEST LIST
        ================================= */}

        {requests.length > 0 ? (

          <div className="leave-list">

            {requests.map((request) => {

              const duration =
                calculateDuration(
                  request.startDate,
                  request.endDate
                );

              const isUpdating =
                updatingId === request.id;

              return (
                <div
                  className="leave-row"
                  key={request.id}
                >

                  {/* =========================
                      EMPLOYEE INFORMATION
                  ========================= */}

                  <div className="leave-info">

                    <strong>
                      {request.user?.name ||
                        "Employee"}
                    </strong>

                    {request.user?.email && (
                      <span>
                        {request.user.email}
                      </span>
                    )}

                    <span>
                      Leave Type:{" "}
                      <strong>
                        {request.leaveType?.name ||
                          "Leave"}
                      </strong>
                    </span>

                    {/* DATES */}

                    <span>
                      {formatDate(
                        request.startDate
                      )}{" "}
                      —{" "}
                      {formatDate(
                        request.endDate
                      )}
                    </span>

                    {/* DURATION */}

                    <span>
                      Duration:{" "}
                      <strong>
                        {duration}{" "}
                        {duration === 1
                          ? "day"
                          : "days"}
                      </strong>
                    </span>

                    {/* REASON */}

                    {request.reason && (
                      <span>
                        Reason:{" "}
                        {request.reason}
                      </span>
                    )}

                  </div>

                  {/* =========================
                      RIGHT SIDE
                  ========================= */}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >

                    {/* STATUS */}

                    <span
                      className={`status ${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>

                    {/* ACTION BUTTONS */}

                    {request.status ===
                      "PENDING" && (

                      <div
                        className="request-actions"
                        style={{
                          display: "flex",
                          gap: "10px",
                        }}
                      >

                        <button
                          type="button"
                          className="approve-button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateRequestStatus(
                              request.id,
                              "approve"
                            )
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="reject-button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateRequestStatus(
                              request.id,
                              "reject"
                            )
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Reject"}
                        </button>

                      </div>
                    )}

                    {/* COMPLETED STATUS */}

                    {request.status ===
                      "APPROVED" && (
                      <small>
                        Approved
                      </small>
                    )}

                    {request.status ===
                      "REJECTED" && (
                      <small>
                        Rejected
                      </small>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        ) : (

          <div className="empty-state">

            <p>
              No leave requests to review.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}

export default Requests;