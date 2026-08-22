import "./App.css";
import { Routes, Route, NavLink } from "react-router-dom";
import Calendar from "./pages/Calendar";
import MyLeave from "./pages/MyLeave";
import RequestLeave from "./pages/RequestLeave";
import Requests from "./pages/Requests";
import Team from "./pages/Team";
import Settings from "./pages/Settings";

function Dashboard() {
  return (
    <section className="dashboard">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">SATURDAY, AUGUST 22, 2026</p>
          <h1>Good afternoon, Abdul.</h1>
          <p className="welcome-text">
            Here's what's happening with your leave today.
          </p>
        </div>

        <button className="primary-button">
          <span>+</span>
          Request Leave
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Leave allowance</span>
            <div className="stat-icon">◷</div>
          </div>
          <div className="stat-value">24</div>
          <p>Days this year</p>
          <div className="progress">
            <div className="progress-fill"></div>
          </div>
          <small>10 used · 14 remaining</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Used this year</span>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-value">10</div>
          <p>Days taken</p>
          <small className="positive">↓ 2 days less than last year</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Upcoming leave</span>
            <div className="stat-icon">◫</div>
          </div>
          <div className="stat-value">4</div>
          <p>Days planned</p>
          <small>Next: Aug 25</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pending requests</span>
            <div className="stat-icon warning">!</div>
          </div>
          <div className="stat-value">3</div>
          <p>Waiting for approval</p>
          <small className="warning-text">Needs attention</small>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel upcoming-panel">
          <div className="panel-header">
            <div>
              <h2>Upcoming leave</h2>
              <p>Your next planned time away</p>
            </div>
            <button className="text-button">View all →</button>
          </div>

          <div className="leave-list">
            <div className="leave-item">
              <div className="date-box">
                <span>AUG</span>
                <strong>25</strong>
              </div>

              <div className="leave-details">
                <strong>Annual Leave</strong>
                <span>Aug 25 — Aug 28 · 4 days</span>
              </div>

              <span className="status approved">Approved</span>
            </div>

            <div className="leave-item">
              <div className="date-box">
                <span>SEP</span>
                <strong>12</strong>
              </div>

              <div className="leave-details">
                <strong>Personal Leave</strong>
                <span>Sep 12 — Sep 13 · 2 days</span>
              </div>

              <span className="status pending">Pending</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Team today</h2>
              <p>Who's available right now</p>
            </div>
            <button className="text-button">View team →</button>
          </div>

          <div className="team-status">
            <div className="team-summary">
              <div className="team-avatars">
                <span className="mini-avatar avatar-one">AH</span>
                <span className="mini-avatar avatar-two">SK</span>
                <span className="mini-avatar avatar-three">UM</span>
                <span className="mini-avatar avatar-four">+4</span>
              </div>

              <div>
                <strong>7 people available</strong>
                <p>2 people are away today</p>
              </div>
            </div>

            <div className="availability-bar">
              <div></div>
            </div>
          </div>

          <div className="availability-footer">
            <span>
              <i className="available-dot"></i> Available
            </span>
            <span>
              <i className="away-dot"></i> Away
            </span>
          </div>
        </section>
      </div>

      <section className="panel requests-panel">
        <div className="panel-header">
          <div>
            <h2>Recent requests</h2>
            <p>Your latest leave activity</p>
          </div>

          <button className="text-button">View requests →</button>
        </div>

        <div className="request-table">
          <div className="table-row table-heading">
            <span>TYPE</span>
            <span>DATES</span>
            <span>DURATION</span>
            <span>STATUS</span>
          </div>

          <div className="table-row">
            <span className="request-type">
              <i className="leave-dot annual"></i>
              Annual Leave
            </span>
            <span>Aug 25 — Aug 28</span>
            <span>4 days</span>
            <span className="status approved">Approved</span>
          </div>

          <div className="table-row">
            <span className="request-type">
              <i className="leave-dot personal"></i>
              Personal Leave
            </span>
            <span>Sep 12 — Sep 13</span>
            <span>2 days</span>
            <span className="status pending">Pending</span>
          </div>

          <div className="table-row">
            <span className="request-type">
              <i className="leave-dot sick"></i>
              Sick Leave
            </span>
            <span>Jul 08 — Jul 09</span>
            <span>2 days</span>
            <span className="status declined">Declined</span>
          </div>
        </div>
      </section>
    </section>
  );
}

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">L</div>
          <span>LeaveFlow</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">MAIN</p>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>◫</span>
            Calendar
          </NavLink>

          <NavLink to="/my-leave" className="nav-item">
          <span>▤</span>
          My Leave
        </NavLink>
     
         <NavLink to="/requests" className="nav-item">
         <span>✓</span>
         Requests & Approvals
         </NavLink>

         <NavLink to="/team" className="nav-item">
          <span>👥</span>
          Team
          </NavLink>

          <NavLink to="/settings" className="nav-item">
            <span>⚙</span>
            Settings
         </NavLink>
         
          <button className="nav-item">
            <span>◌</span>
            Requests
            <span className="notification-count">3</span>
          </button>

          <p className="nav-label team-label">TEAM</p>

          <button className="nav-item">
            <span>♙</span>
            Team
          </button>

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <div className="help-icon">?</div>
            <div>
              <strong>Need help?</strong>
              <p>We're here for you.</p>
            </div>
          </div>

          <div className="user-profile">
            <div className="avatar">AR</div>
            <div className="user-info">
              <strong>Abdul Rehman</strong>
              <span>Administrator</span>
            </div>
            <span className="profile-arrow">⌄</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <p className="breadcrumb">Workspace / Leave Management</p>

          <div className="topbar-actions">
            <button className="icon-button">⌕</button>

            <button className="icon-button notification-button">
              ♧
              <span></span>
            </button>

            <div className="top-avatar">AR</div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/my-leave" element={<MyLeave />} />
          <Route path="/request-leave" element={<RequestLeave />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
</Routes>
      </main>
    </div>
  );
}

export default App;