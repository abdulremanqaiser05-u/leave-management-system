import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import API_URL from "../api";
function Dashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("authToken");

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // =====================================================
        // 1. GET MY LEAVE BALANCE
        //
        // IMPORTANT:
        // This is the working endpoint we tested.
        // It automatically uses the userId from the JWT.
        // =====================================================

        const balanceResponse = await fetch(
          `${API_URL}/api/leave-requests/balance`,
          {
            method: "GET",
            headers,
          }
        );

        const balanceData = await balanceResponse.json();

        if (!balanceResponse.ok) {
          throw new Error(
            balanceData.message ||
              "Failed to load leave balance."
          );
        }

        console.log(
          "DASHBOARD BALANCE DATA:",
          balanceData
        );

        // =====================================================
        // 2. GET MY LEAVE REQUESTS
        // =====================================================

        const requestsResponse = await fetch(
          `${API_URL}/api/leave-requests`,
          {
            method: "GET",
            headers,
          }
        );

        const requestsData = await requestsResponse.json();

        if (!requestsResponse.ok) {
          throw new Error(
            requestsData.message ||
              "Failed to load leave requests."
          );
        }

        console.log(
          "DASHBOARD REQUESTS:",
          requestsData
        );

        // =====================================================
        // 3. GET TEAM MEMBERS
        // =====================================================

        const teamResponse = await fetch(
          `${API_URL}/api/users`,
          {
            method: "GET",
            headers,
          }
        );

        const teamData = await teamResponse.json();

        if (!teamResponse.ok) {
          throw new Error(
            teamData.message ||
              "Failed to load team members."
          );
        }

        // =====================================================
        // SAVE DATA
        // =====================================================

        setBalance(balanceData);

        setRequests(
          Array.isArray(requestsData)
            ? requestsData
            : []
        );

        setTeamMembers(
          Array.isArray(teamData)
            ? teamData
            : []
        );
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setError(
          error.message ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // =========================================================
  // CALCULATE DAYS
  // =========================================================

  const calculateDays = (
    startDate,
    endDate
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference =
      end.getTime() -
      start.getTime();

    if (difference < 0) {
      return 0;
    }

    return (
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  // =========================================================
  // TODAY
  // =========================================================

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // =========================================================
  // REQUEST STATUS
  // =========================================================

  const approvedRequests =
    requests.filter(
      (request) =>
        String(
          request.status || ""
        ).toUpperCase() === "APPROVED"
    );

  const pendingRequests =
    requests.filter(
      (request) =>
        String(
          request.status || ""
        ).toUpperCase() === "PENDING"
    );

  // =========================================================
  // PERSONAL BALANCE
  //
  // THESE VALUES COME DIRECTLY FROM:
  //
  // /api/leave-requests/balance
  //
  // Example for Ayesha:
  //
  // allowance = 35
  // used      = 21
  // upcoming  = 21
  // pending   = 0
  // =========================================================

  const totalAllowance = Number(
    balance?.totals?.allowance ?? 0
  );

  const usedDays = Number(
    balance?.totals?.used ?? 0
  );

  const upcomingDaysFromBackend = Number(
    balance?.totals?.upcoming ?? 0
  );

  const pendingDaysFromBackend = Number(
    balance?.totals?.pendingDays ??
      balance?.totals?.pending ??
      0
  );

  const remainingDays = Math.max(
    totalAllowance - usedDays,
    0
  );

  // =========================================================
  // UPCOMING LEAVE
  // =========================================================

  const upcomingLeave =
    requests
      .filter((request) => {
        const status = String(
          request.status || ""
        ).toUpperCase();

        const endDate = new Date(
          request.endDate
        );

        endDate.setHours(
          0,
          0,
          0,
          0
        );

        return (
          endDate >= today &&
          status !== "REJECTED" &&
          status !== "DECLINED"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startDate) -
          new Date(b.startDate)
      );

  // =========================================================
  // USE BACKEND UPCOMING VALUE
  // =========================================================

  const upcomingDays =
    upcomingDaysFromBackend > 0
      ? upcomingDaysFromBackend
      : upcomingLeave.reduce(
          (total, request) =>
            total +
            calculateDays(
              request.startDate,
              request.endDate
            ),
          0
        );

  // =========================================================
  // RECENT REQUESTS
  // =========================================================

  const recentRequests =
    [...requests]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt ||
              b.startDate
          ) -
          new Date(
            a.createdAt ||
              a.startDate
          )
      )
      .slice(0, 5);

  // =========================================================
  // TEAM STATUS
  // =========================================================

  const availableMembers =
    teamMembers.filter(
      (member) =>
        String(
          member.status || ""
        ).toLowerCase() ===
        "available"
    );

  const awayMembers =
    teamMembers.filter(
      (member) =>
        String(
          member.status || ""
        ).toLowerCase() ===
        "on leave"
    );

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatShortDate = (date) => {
    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="dashboard">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">
              LEAVE MANAGEMENT
            </p>

            <h1>
              Loading your dashboard...
            </h1>

            <p className="welcome-text">
              Getting your latest
              leave information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <section className="dashboard">

      {/* ===================================================
          WELCOME
      =================================================== */}

      <div className="welcome-row">
        <div>
          <p className="eyebrow">
            LEAVE MANAGEMENT
          </p>

          <h1>
            Good afternoon{" "}
            {user?.name ||
              balance?.user?.name ||
              "User"}
            .
          </h1>

          <p className="welcome-text">
            Here's what's happening
            with your leave today.
          </p>
        </div>

        <NavLink
          to="/request-leave"
          className="primary-button"
          style={{
            textDecoration:
              "none",
          }}
        >
          <span>+</span>
          Request Leave
        </NavLink>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            background:
              "#fee2e2",
            color:
              "#b91c1c",
            borderRadius:
              "8px",
            border:
              "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          PERSONAL STATS
      =================================================== */}

      <div className="stats-grid">

        {/* =================================================
            LEAVE ALLOWANCE
        ================================================= */}

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Leave allowance
            </span>

            <div className="stat-icon">
              ◷
            </div>
          </div>

          <div className="stat-value">
            {totalAllowance}
          </div>

          <p>
            Days this year
          </p>

          <div className="progress">
            <div
              className="progress-fill"
              style={{
                width:
                  totalAllowance > 0
                    ? `${Math.min(
                        (usedDays /
                          totalAllowance) *
                          100,
                        100
                      )}%`
                    : "0%",
              }}
            ></div>
          </div>

          <small>
            {usedDays} used ·{" "}
            {remainingDays} remaining
          </small>

        </div>

        {/* =================================================
            USED THIS YEAR
        ================================================= */}

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Used this year
            </span>

            <div className="stat-icon">
              ✓
            </div>
          </div>

          <div className="stat-value">
            {usedDays}
          </div>

          <p>
            Days taken
          </p>

          <small className="positive">
            Based on approved leave
          </small>

        </div>

        {/* =================================================
            UPCOMING LEAVE
        ================================================= */}

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Upcoming leave
            </span>

            <div className="stat-icon">
              ◫
            </div>
          </div>

          <div className="stat-value">
            {upcomingDays}
          </div>

          <p>
            Days planned
          </p>

          <small>
            {upcomingLeave.length > 0
              ? `Next: ${formatShortDate(
                  upcomingLeave[0]
                    .startDate
                )}`
              : "No upcoming leave"}
          </small>

        </div>

        {/* =================================================
            PENDING REQUESTS
        ================================================= */}

        <div className="stat-card">

          <div className="stat-top">
            <span>
              Pending requests
            </span>

            <div className="stat-icon warning">
              !
            </div>
          </div>

          <div className="stat-value">
            {pendingRequests.length}
          </div>

          <p>
            Waiting for approval
          </p>

          <small className="warning-text">
            {pendingRequests.length > 0
              ? `${pendingRequests.length} request${
                  pendingRequests.length ===
                  1
                    ? ""
                    : "s"
                } waiting`
              : "All caught up"}
          </small>

        </div>

      </div>

      {/* ===================================================
          DATABASE DEBUG INFORMATION
          TEMPORARY - REMOVE AFTER TESTING
      =================================================== */}

      {balance?.debug && (
        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            padding: "15px",
            background: "#f3f4f6",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <strong>
            Database connection verified
          </strong>

          <div>
            Logged-in User ID:{" "}
            {balance.debug.authenticatedUserId}
          </div>

          <div>
            Database User ID:{" "}
            {balance.debug.databaseUserId}
          </div>

          <div>
            Employee:{" "}
            {balance.user?.name ||
              "Unknown"}
          </div>

          <div>
            Leave Requests:{" "}
            {balance.debug.requestCount}
          </div>
        </div>
      )}

      {/* ===================================================
          PERSONAL BALANCE BREAKDOWN
      =================================================== */}

      {balance?.balances?.length > 0 && (
        <section
          className="panel"
          style={{
            marginBottom:
              "24px",
          }}
        >

          <div className="panel-header">

            <div>
              <h2>
                Leave balance
              </h2>

              <p>
                Your individual
                allowance and
                leave usage
              </p>
            </div>

            <NavLink
              to="/my-leave"
              className="text-button"
            >
              View details →
            </NavLink>

          </div>

          <div className="request-table">

            <div className="table-row table-heading">

              <span>
                TYPE
              </span>

              <span>
                ALLOWED
              </span>

              <span>
                USED
              </span>

              <span>
                REMAINING
              </span>

            </div>

            {balance.balances.map(
              (item) => (
                <div
                  className="table-row"
                  key={
                    item.leaveTypeId
                  }
                >

                  <span className="request-type">
                    {item.name}
                  </span>

                  <span>
                    {item.entitlement}
                  </span>

                  <span>
                    {item.used}
                  </span>

                  <span>
                    {item.remaining}
                  </span>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ===================================================
          UPCOMING + TEAM
      =================================================== */}

      <div className="content-grid">

        {/* =================================================
            UPCOMING LEAVE
        ================================================= */}

        <section className="panel upcoming-panel">

          <div className="panel-header">

            <div>
              <h2>
                Upcoming leave
              </h2>

              <p>
                Your next planned
                time away
              </p>
            </div>

            <NavLink
              to="/my-leave"
              className="text-button"
            >
              View all →
            </NavLink>

          </div>

          <div className="leave-list">

            {upcomingLeave.length > 0 ? (
              upcomingLeave
                .slice(0, 3)
                .map(
                  (request) => {
                    const startDate =
                      new Date(
                        request.startDate
                      );

                    const month =
                      startDate
                        .toLocaleDateString(
                          "en-US",
                          {
                            month:
                              "short",
                          }
                        )
                        .toUpperCase();

                    const day =
                      startDate.getDate();

                    const duration =
                      calculateDays(
                        request.startDate,
                        request.endDate
                      );

                    return (
                      <div
                        className="leave-item"
                        key={
                          request.id
                        }
                      >

                        <div className="date-box">

                          <span>
                            {month}
                          </span>

                          <strong>
                            {day}
                          </strong>

                        </div>

                        <div className="leave-details">

                          <strong>
                            {request
                              .leaveType
                              ?.name ||
                              "Leave"}
                          </strong>

                          <span>
                            {formatShortDate(
                              request.startDate
                            )}{" "}
                            —{" "}
                            {formatShortDate(
                              request.endDate
                            )}{" "}
                            ·{" "}
                            {duration}{" "}
                            {duration === 1
                              ? "day"
                              : "days"}
                          </span>

                        </div>

                        <span
                          className={`status ${
                            String(
                              request.status
                            ).toLowerCase()
                          }`}
                        >
                          {request.status}
                        </span>

                      </div>
                    );
                  }
                )
            ) : (
              <div className="empty-state">
                <p>
                  No upcoming leave.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* =================================================
            TEAM
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Team today
              </h2>

              <p>
                Who's available
                right now
              </p>
            </div>

            <NavLink
              to="/team"
              className="text-button"
            >
              View team →
            </NavLink>

          </div>

          <div className="team-status">

            <div className="team-summary">

              <div className="team-avatars">

                {teamMembers
                  .slice(0, 4)
                  .map(
                    (member) => (
                      <span
                        className="mini-avatar"
                        key={
                          member.id
                        }
                        title={`${member.name} — ${member.status}`}
                      >
                        {getInitials(
                          member.name
                        )}
                      </span>
                    )
                  )}

                {teamMembers.length >
                  4 && (
                  <span className="mini-avatar">
                    +
                    {teamMembers.length -
                      4}
                  </span>
                )}

              </div>

              <div>

                <strong>
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1
                    ? "team member"
                    : "team members"}
                </strong>

                <p>
                  {
                    availableMembers.length
                  }{" "}
                  available ·{" "}
                  {
                    awayMembers.length
                  }{" "}
                  on leave today.
                </p>

              </div>

            </div>

            <div className="availability-bar">

              <div
                style={{
                  width:
                    teamMembers.length > 0
                      ? `${
                          (availableMembers.length /
                            teamMembers.length) *
                          100
                        }%`
                      : "0%",
                }}
              ></div>

            </div>

          </div>

          <div className="availability-footer">

            <span>
              <i className="available-dot"></i>
              Available{" "}
              {
                availableMembers.length
              }
            </span>

            <span>
              <i className="away-dot"></i>
              Away{" "}
              {
                awayMembers.length
              }
            </span>

          </div>

        </section>

      </div>

      {/* ===================================================
          RECENT REQUESTS
      =================================================== */}

      <section className="panel requests-panel">

        <div className="panel-header">

          <div>
            <h2>
              Recent requests
            </h2>

            <p>
              Your latest leave
              activity
            </p>
          </div>

          <NavLink
            to="/my-leave"
            className="text-button"
          >
            View requests →
          </NavLink>

        </div>

        <div className="request-table">

          <div className="table-row table-heading">

            <span>
              TYPE
            </span>

            <span>
              DATES
            </span>

            <span>
              DURATION
            </span>

            <span>
              STATUS
            </span>

          </div>

          {recentRequests.length > 0 ? (
            recentRequests.map(
              (request) => {

                const leaveName =
                  request
                    .leaveType
                    ?.name ||
                  "Leave";

                const duration =
                  calculateDays(
                    request.startDate,
                    request.endDate
                  );

                let dotClass =
                  "annual";

                const lowerName =
                  leaveName.toLowerCase();

                if (
                  lowerName.includes(
                    "personal"
                  ) ||
                  lowerName.includes(
                    "casual"
                  )
                ) {
                  dotClass =
                    "personal";
                }

                if (
                  lowerName.includes(
                    "sick"
                  )
                ) {
                  dotClass =
                    "sick";
                }

                return (
                  <div
                    className="table-row"
                    key={
                      request.id
                    }
                  >

                    <span className="request-type">

                      <i
                        className={`leave-dot ${dotClass}`}
                      ></i>

                      {leaveName}

                    </span>

                    <span>
                      {formatShortDate(
                        request.startDate
                      )}{" "}
                      —{" "}
                      {formatShortDate(
                        request.endDate
                      )}
                    </span>

                    <span>
                      {duration}{" "}
                      {duration === 1
                        ? "day"
                        : "days"}
                    </span>

                    <span
                      className={`status ${
                        String(
                          request.status
                        ).toLowerCase()
                      }`}
                    >
                      {request.status}
                    </span>

                  </div>
                );
              }
            )
          ) : (
            <div
              style={{
                padding:
                  "20px 0",
                color:
                  "#6b7280",
                fontSize:
                  "12px",
              }}
            >
              No leave requests
              found.
            </div>
          )}

        </div>

      </section>

    </section>
  );
}

export default Dashboard;
