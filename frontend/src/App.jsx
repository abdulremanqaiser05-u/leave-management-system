import "./App.css";
import API_URL from "./api";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Calendar from "./pages/Calendar";
import MyLeave from "./pages/MyLeave";
import RequestLeave from "./pages/RequestLeave";
import Requests from "./pages/Requests";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({ user }) {
  const [dashboardData, setDashboardData] =
    useState({
      allowance: 0,
      used: 0,
      remaining: 0,
      upcoming: 0,
      pending: 0,
    });

  const [leaveRequests, setLeaveRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     FETCH DASHBOARD DATA
  ===================================================== */

  useEffect(() => {
    const fetchDashboardData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            localStorage.getItem(
              "authToken"
            );

          if (!token) {
            throw new Error(
              "You are not logged in."
            );
          }

          /* =========================================
             GET EMPLOYEE BALANCE
          ========================================= */

         const balanceResponse =
  await fetch(
    `${API_URL}/api/leave-requests/balance`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

          const balanceData =
            await balanceResponse.json();

          if (!balanceResponse.ok) {
            throw new Error(
              balanceData.message ||
                "Failed to load leave balance."
            );
          }

          /* =========================================
             REAL DATABASE VALUES
          ========================================= */

          const allowance =
            Number(
              balanceData.totals?.allowance
            ) || 0;

          const used =
            Number(
              balanceData.totals?.used
            ) || 0;

          const upcoming =
            Number(
              balanceData.totals?.upcoming
            ) || 0;

          const pending =
            Number(
              balanceData.totals?.pending
            ) || 0;

          const remaining =
            Math.max(
              0,
              allowance - used
            );

          setDashboardData({
            allowance,
            used,
            remaining,
            upcoming,
            pending,
          });

          /* =========================================
             GET EMPLOYEE REQUESTS
          ========================================= */

          const requestsResponse =
            await fetch(
              `${API_URL}/api/leave-requests`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const requestsData =
            await requestsResponse.json();

          if (requestsResponse.ok) {
            setLeaveRequests(
              Array.isArray(
                requestsData
              )
                ? requestsData
                : []
            );
          } else {
            console.warn(
              "Could not load leave requests:",
              requestsData
            );
          }
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

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatDateRange = (
    startDate,
    endDate
  ) => {
    const start =
      formatDate(startDate);

    const end =
      formatDate(endDate);

    if (!start) {
      return "";
    }

    if (
      !end ||
      start === end
    ) {
      return start;
    }

    return `${start} — ${end}`;
  };

  const calculateDays = (
    startDate,
    endDate
  ) => {
    if (
      !startDate ||
      !endDate
    ) {
      return 0;
    }

    const start =
      new Date(startDate);

    const end =
      new Date(endDate);

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return 0;
    }

    const difference =
      end.getTime() -
      start.getTime();

    return (
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  /* =====================================================
     STATUS HELPERS
  ===================================================== */

  const getStatusClass = (
    status
  ) => {
    const normalized =
      String(
        status || ""
      ).toUpperCase();

    if (
      normalized ===
      "APPROVED"
    ) {
      return "approved";
    }

    if (
      normalized ===
        "REJECTED" ||
      normalized ===
        "DECLINED"
    ) {
      return "declined";
    }

    return "pending";
  };

  const getStatusLabel = (
    status
  ) => {
    const normalized =
      String(
        status || ""
      ).toUpperCase();

    if (
      normalized ===
      "APPROVED"
    ) {
      return "Approved";
    }

    if (
      normalized ===
      "REJECTED"
    ) {
      return "Rejected";
    }

    if (
      normalized ===
      "DECLINED"
    ) {
      return "Declined";
    }

    return "Pending";
  };

  /* =====================================================
     SORT REQUESTS
  ===================================================== */

  const sortedRequests = [
    ...leaveRequests,
  ].sort(
    (a, b) => {
      const aDate =
        new Date(
          a.startDate ||
            a.createdAt
        ).getTime();

      const bDate =
        new Date(
          b.startDate ||
            b.createdAt
        ).getTime();

      return bDate - aDate;
    }
  );

  /* =====================================================
     UPCOMING REQUESTS
  ===================================================== */

  const upcomingRequests =
    [...leaveRequests]
      .filter(
        (request) => {
          if (
            !request.startDate
          ) {
            return false;
          }

          const start =
            new Date(
              request.startDate
            );

          const today =
            new Date();

          today.setHours(
            0,
            0,
            0,
            0
          );

          return (
            start >= today &&
            String(
              request.status ||
                ""
            ).toUpperCase() !==
              "REJECTED"
          );
        }
      )
      .sort(
        (a, b) =>
          new Date(
            a.startDate
          ) -
          new Date(
            b.startDate
          )
      );

  /* =====================================================
     RECENT REQUESTS
  ===================================================== */

  const recentRequests =
    sortedRequests.slice(
      0,
      3
    );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <section className="dashboard">

        <div className="welcome-row">

          <div>

            <p className="eyebrow">
              LEAVE MANAGEMENT
            </p>

            <h1>
              Good afternoon,{" "}
              {user?.name ||
                "User"}
              .
            </h1>

            <p className="welcome-text">
              Loading your leave
              data...
            </p>

          </div>

        </div>

      </section>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <section className="dashboard">

      {/* ================================================
          WELCOME
      ================================================ */}

      <div className="welcome-row">

        <div>

          <p className="eyebrow">
            LEAVE MANAGEMENT
          </p>

          <h1>
            Good afternoon,{" "}
            {user?.name ||
              "User"}
            .
          </h1>

          <p className="welcome-text">
            Here's what's
            happening with your
            leave today.
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

      {/* ================================================
          ERROR
      ================================================ */}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom:
              "20px",
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

      {/* ================================================
          STATS
      ================================================ */}

      <div className="stats-grid">

        {/* ALLOWANCE */}

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
            {
              dashboardData.allowance
            }
          </div>

          <p>
            Days this year
          </p>

          <div className="progress">

            <div
              className="progress-fill"
              style={{
                width:
                  dashboardData
                    .allowance > 0
                    ? `${Math.min(
                        100,
                        (
                          dashboardData
                            .used /
                          dashboardData
                            .allowance
                        ) * 100
                      )}%`
                    : "0%",
              }}
            ></div>

          </div>

          <small>
            {
              dashboardData.used
            }{" "}
            used ·{" "}
            {
              dashboardData
                .remaining
            }{" "}
            remaining
          </small>

        </div>

        {/* USED */}

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
            {
              dashboardData.used
            }
          </div>

          <p>
            Days taken
          </p>

          <small className="positive">
            {dashboardData.used >
            0
              ? `${dashboardData.used} days used`
              : "No days used yet"}
          </small>

        </div>

        {/* UPCOMING */}

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
            {
              dashboardData.upcoming
            }
          </div>

          <p>
            Days planned
          </p>

          <small>
            {upcomingRequests.length >
            0
              ? `Next: ${formatDate(
                  upcomingRequests[0]
                    .startDate
                )}`
              : "No upcoming leave"}
          </small>

        </div>

        {/* PENDING */}

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
            {
              dashboardData.pending
            }
          </div>

          <p>
            Waiting for approval
          </p>

          <small className="warning-text">
            {dashboardData.pending >
            0
              ? "Waiting for approval"
              : "All caught up"}
          </small>

        </div>

      </div>

      {/* ================================================
          TWO COLUMN CONTENT
      ================================================ */}

      <div className="content-grid">

        {/* UPCOMING LEAVE */}

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

            {upcomingRequests.length >
            0 ? (
              upcomingRequests
                .slice(0, 3)
                .map(
                  (
                    request
                  ) => {

                    const start =
                      new Date(
                        request.startDate
                      );

                    const month =
                      start
                        .toLocaleDateString(
                          "en-US",
                          {
                            month:
                              "short",
                          }
                        )
                        .toUpperCase();

                    const day =
                      start.getDate();

                    const days =
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
                            {
                              request
                                .leaveType
                                ?.name ||
                              "Leave"
                            }
                          </strong>

                          <span>
                            {
                              formatDateRange(
                                request.startDate,
                                request.endDate
                              )
                            }{" "}
                            ·{" "}
                            {days}{" "}
                            {days === 1
                              ? "day"
                              : "days"}
                          </span>

                        </div>

                        <span
                          className={`status ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {
                            getStatusLabel(
                              request.status
                            )
                          }
                        </span>

                      </div>
                    );
                  }
                )
            ) : (
              <div className="empty-state">
                <p>
                  No upcoming
                  leave.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* TEAM TODAY */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Team today
              </h2>

              <p>
                Your team
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

                <span className="mini-avatar avatar-one">
                  👥
                </span>

              </div>

              <div>

                <strong>
                  View your team
                </strong>

                <p>
                  Check team
                  members and
                  their roles
                </p>

              </div>

            </div>

            <div className="availability-bar">
              <div></div>
            </div>

          </div>

          <div className="availability-footer">

            <span>
              <i className="available-dot"></i>
              Team
            </span>

            <span>
              <i className="away-dot"></i>
              Leave
            </span>

          </div>

        </section>

      </div>

      {/* ================================================
          RECENT REQUESTS
      ================================================ */}

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

          {recentRequests.length >
          0 ? (
            recentRequests.map(
              (
                request
              ) => {

                const days =
                  calculateDays(
                    request.startDate,
                    request.endDate
                  );

                const leaveName =
                  request
                    .leaveType
                    ?.name ||
                  "Leave";

                const leaveNameLower =
                  String(
                    leaveName
                  ).toLowerCase();

                let dotClass =
                  "personal";

                if (
                  leaveNameLower.includes(
                    "annual"
                  )
                ) {
                  dotClass =
                    "annual";
                } else if (
                  leaveNameLower.includes(
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
                      {
                        formatDateRange(
                          request.startDate,
                          request.endDate
                        )
                      }
                    </span>

                    <span>
                      {days}{" "}
                      {days === 1
                        ? "day"
                        : "days"}
                    </span>

                    <span
                      className={`status ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {
                        getStatusLabel(
                          request.status
                        )
                      }
                    </span>

                  </div>
                );
              }
            )
          ) : (
            <div className="empty-state">

              <p>
                You have no
                leave requests
                yet.
              </p>

            </div>
          )}

        </div>

      </section>

    </section>
  );
}

/* =====================================================
   APP
===================================================== */

function App() {

  /* =====================================================
     USER
  ===================================================== */

  const [user, setUser] =
    useState(() => {

      const savedUser =
        localStorage.getItem(
          "user"
        );

      try {
        return savedUser
          ? JSON.parse(
              savedUser
            )
          : null;
      } catch {
        return null;
      }
    });

  /* =====================================================
     UI STATES
  ===================================================== */

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

 const [notificationOpen, setNotificationOpen] =
  useState(false);

const [notifications, setNotifications] =
  useState([]);

  const [helpOpen, setHelpOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const profileRef =
    useRef(null);

  const searchRef =
    useRef(null);

  const notificationRef =
    useRef(null);

  const navigate =
    useNavigate();

  /* =====================================================
     TOKEN
  ===================================================== */

  const token =
    localStorage.getItem(
      "authToken"
    );
    /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken =
          localStorage.getItem("authToken");

        if (!authToken) {
          return;
        }

        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return;
        }

        const requests = Array.isArray(data)
          ? data
          : [];

        const generatedNotifications =
          requests
            .sort(
              (a, b) =>
                new Date(
                  b.updatedAt ||
                    b.createdAt ||
                    b.startDate
                ) -
                new Date(
                  a.updatedAt ||
                    a.createdAt ||
                    a.startDate
                )
            )
            .slice(0, 5)
            .map((request) => {
              const status =
                String(
                  request.status || ""
                ).toUpperCase();

              const leaveType =
                request.leaveType?.name ||
                "Leave";

              if (status === "APPROVED") {
                return {
                  id: request.id,
                  type: "approved",
                  title:
                    "Leave request approved",
                  message:
                    `${leaveType} leave has been approved.`,
                  icon: "✓",
                };
              }

              if (
                status === "REJECTED" ||
                status === "DECLINED"
              ) {
                return {
                  id: request.id,
                  type: "rejected",
                  title:
                    "Leave request rejected",
                  message:
                    `${leaveType} leave has been rejected.`,
                  icon: "!",
                };
              }

              return {
                id: request.id,
                type: "pending",
                title:
                  "Leave request pending",
                message:
                  `${leaveType} leave is waiting for approval.`,
                icon: "•",
              };
            });

        setNotifications(
          generatedNotifications
        );
      } catch (error) {
        console.error(
          "Notification error:",
          error
        );
      }
    };

    fetchNotifications();
  }, []);

  /* =====================================================
     CLOSE DROPDOWNS
  ===================================================== */

  useEffect(() => {

    const handleOutsideClick =
      (event) => {

        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target
          )
        ) {
          setProfileOpen(
            false
          );
        }

        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target
          )
        ) {
          setSearchOpen(
            false
          );
        }

        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target
          )
        ) {
          setNotificationOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };

  }, []);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    () => {

      localStorage.removeItem(
        "authToken"
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      setUser(null);

      setProfileOpen(
        false
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  /* =====================================================
     SEARCH
  ===================================================== */

  const searchItems = [
    {
      name: "Dashboard",
      path: "/",
      keywords:
        "dashboard home overview",
    },
    {
      name: "Calendar",
      path: "/calendar",
      keywords:
        "calendar team schedule dates",
    },
    {
      name: "My Leave",
      path: "/my-leave",
      keywords:
        "leave balance history",
    },
    {
      name: "Request Leave",
      path: "/request-leave",
      keywords:
        "request apply leave vacation",
    },
    {
      name: "Requests & Approvals",
      path: "/requests",
      keywords:
        "requests approvals admin",
    },
    {
      name: "Team",
      path: "/team",
      keywords:
        "team members employees",
    },
    {
      name: "Settings",
      path: "/settings",
      keywords:
        "account settings notifications",
    },
  ];

  const filteredSearchItems =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return searchItems;
      }

      return searchItems.filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(query) ||
          item.keywords
            .toLowerCase()
            .includes(query)
      );

    }, [searchText]);

  const handleSearchNavigate =
    (path) => {

      navigate(path);

      setSearchText("");

      setSearchOpen(
        false
      );
    };

  /* =====================================================
     LOGGED OUT
  ===================================================== */

  if (!token || !user) {

    return (
      <Routes>

        <Route
          path="/login"
          element={
            <Login
              onLogin={(
                loggedInUser
              ) => {
                setUser(
                  loggedInUser
                );
              }}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    );
  }

  /* =====================================================
     LOGGED IN APP
  ===================================================== */

  return (
    <div className="app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-mark">
            L
          </div>

          <span>
            LeaveFlow
          </span>

        </div>

        <nav className="sidebar-nav">

          <p className="nav-label">
            MAIN
          </p>

          <NavLink
            to="/"
            end
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/calendar"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>◫</span>
            Calendar
          </NavLink>

          <NavLink
            to="/my-leave"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>▤</span>
            My Leave
          </NavLink>

          <NavLink
            to="/requests"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>✓</span>
            Requests &amp;
            Approvals
          </NavLink>

          <NavLink
            to="/team"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>👥</span>
            Team
          </NavLink>

          <NavLink
            to="/settings"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span>⚙</span>
            Settings
          </NavLink>

        </nav>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="help-box help-button"
            onClick={() =>
              setHelpOpen(true)
            }
          >

            <div className="help-icon">
              ?
            </div>

            <div>

              <strong>
                Need help?
              </strong>

              <p>
                We're here for you.
              </p>

            </div>

          </button>

          <div
            className="profile-wrapper"
            ref={profileRef}
          >

            <button
              type="button"
              className={`user-profile ${
                profileOpen
                  ? "profile-open"
                  : ""
              }`}
              onClick={() =>
                setProfileOpen(
                  (previous) =>
                    !previous
                )
              }
              title="Open profile menu"
            >

              <div className="avatar">

                {user?.name
                  ? user.name
                      .split(" ")
                      .map(
                        (
                          word
                        ) =>
                          word[0]
                      )
                      .join("")
                      .slice(
                        0,
                        2
                      )
                      .toUpperCase()
                  : "U"}

              </div>

              <div className="user-info">

                <strong>
                  {user?.name ||
                    "User"}
                </strong>

                <span>
                  {user?.role ||
                    "USER"}
                </span>

              </div>

              <span className="profile-arrow">
                {profileOpen
                  ? "⌃"
                  : "⌄"}
              </span>

            </button>

            {profileOpen && (

              <div className="profile-menu">

                <div className="profile-menu-header">

                  <div className="profile-menu-avatar">

                    {user?.name
                      ? user.name
                          .split(
                            " "
                          )
                          .map(
                            (
                              word
                            ) =>
                              word[0]
                          )
                          .join(
                            ""
                          )
                          .slice(
                            0,
                            2
                          )
                          .toUpperCase()
                      : "U"}

                  </div>

                  <div>

                    <strong>
                      {user?.name ||
                        "User"}
                    </strong>

                    <span>
                      {user?.email ||
                        ""}
                    </span>

                  </div>

                </div>

                <div className="profile-menu-divider"></div>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => {
                    setProfileOpen(
                      false
                    );

                    navigate(
                      "/settings"
                    );
                  }}
                >
                  <span>⚙</span>
                  Settings
                </button>

                <button
                  type="button"
                  className="profile-menu-item logout-item"
                  onClick={
                    handleLogout
                  }
                >
                  <span>↪</span>
                  Logout
                </button>

              </div>

            )}

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main-content">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="topbar">

          <p className="breadcrumb">
            Workspace /
            Leave Management
          </p>

          <div className="topbar-actions">

            {/* SEARCH */}

            <div
              className="search-wrapper"
              ref={searchRef}
            >

              <button
                type="button"
                className={`icon-button ${
                  searchOpen
                    ? "icon-button-active"
                    : ""
                }`}
                title="Search"
                onClick={() => {

                  setSearchOpen(
                    (previous) =>
                      !previous
                  );

                  setNotificationOpen(
                    false
                  );

                }}
              >
                ⌕
              </button>

              {searchOpen && (

                <div className="search-panel">

                  <div className="search-input-wrapper">

                    <span>
                      ⌕
                    </span>

                    <input
                      autoFocus
                      type="text"
                      placeholder="Search pages..."
                      value={
                        searchText
                      }
                      onChange={(
                        e
                      ) =>
                        setSearchText(
                          e.target
                            .value
                        )
                      }
                    />

                  </div>

                  <div className="search-results">

                    {filteredSearchItems.length >
                    0 ? (

                      filteredSearchItems.map(
                        (
                          item
                        ) => (

                          <button
                            type="button"
                            key={
                              item.path
                            }
                            className="search-result"
                            onClick={() =>
                              handleSearchNavigate(
                                item.path
                              )
                            }
                          >

                            <span>
                              {
                                item.name
                              }
                            </span>

                            <small>
                              →
                            </small>

                          </button>

                        )
                      )

                    ) : (

                      <div className="search-empty">
                        No pages
                        found.
                      </div>

                    )}

                  </div>

                </div>

              )}

            </div>

            {/* NOTIFICATIONS */}

            <div
              className="notification-wrapper"
              ref={
                notificationRef
              }
            >

              <button
                type="button"
                className={`icon-button notification-button ${
                  notificationOpen
                    ? "icon-button-active"
                    : ""
                }`}
                title="Notifications"
                onClick={() => {

                  setNotificationOpen(
                    (previous) =>
                      !previous
                  );

                  setSearchOpen(
                    false
                  );

                }}
              >

                ♧

                <span></span>

              </button>

              {notificationOpen && (

  <div className="notification-panel">

    <div className="notification-header">

      <strong>
        Notifications
      </strong>

      <span>
        {notifications.length}
      </span>

    </div>

    {notifications.length > 0 ? (

      notifications.map(
        (notification) => (

          <div
            className="notification-item"
            key={notification.id}
          >

            <div className="notification-dot">
              {notification.icon}
            </div>

            <div>

              <strong>
                {notification.title}
              </strong>

              <p>
                {notification.message}
              </p>

            </div>

          </div>

        )
      )

    ) : (

      <div className="notification-item">

        <div className="notification-dot">
          ✓
        </div>

        <div>

          <strong>
            You're all caught up
          </strong>

          <p>
            No new leave updates.
          </p>

        </div>

      </div>

    )}

  </div>

)}

            </div>

            {/* TOP AVATAR */}

            <button
              type="button"
              className="top-avatar"
              onClick={() =>
                setProfileOpen(
                  (previous) =>
                    !previous
                )
              }
              title="Open profile menu"
            >

              {user?.name
                ? user.name
                    .split(" ")
                    .map(
                      (
                        word
                      ) =>
                        word[0]
                    )
                    .join("")
                    .slice(
                      0,
                      2
                    )
                    .toUpperCase()
                : "U"}

            </button>

          </div>

        </header>

        {/* =================================================
            ROUTES
        ================================================= */}

        <Routes>

          <Route
            path="/"
            element={
              <Dashboard
                user={user}
              />
            }
          />

          <Route
            path="/calendar"
            element={
              <Calendar />
            }
          />

          <Route
            path="/my-leave"
            element={
              <MyLeave />
            }
          />

          <Route
            path="/request-leave"
            element={
              <RequestLeave />
            }
          />

          <Route
            path="/requests"
            element={
              <Requests />
            }
          />

          <Route
            path="/team"
            element={
              <Team />
            }
          />

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />

          <Route
            path="/login"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>

      {/* =================================================
          HELP MODAL
      ================================================= */}

      {helpOpen && (

        <div
          className="help-overlay"
          onClick={() =>
            setHelpOpen(false)
          }
        >

          <div
            className="help-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="help-close"
              onClick={() =>
                setHelpOpen(false)
              }
            >
              ×
            </button>

            <div className="help-modal-icon">
              ?
            </div>

            <h2>
              Need help?
            </h2>

            <p>
              If you need
              assistance with
              your leave request,
              approval, calendar,
              or account settings,
              please contact your
              administrator.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setHelpOpen(false)
              }
            >
              Got it
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;
