import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openLogin = () => {
    setError("");
    setShowLogin(true);
  };

  const returnToLanding = () => {
    setError("");
    setShowLogin(false);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save authentication token
      localStorage.setItem("authToken", data.token);

      // Remove old token if it exists
      localStorage.removeItem("token");

      // Save user information
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // Update application state
      if (typeof onLogin === "function") {
        onLogin(data.user);
      }

      // Go to dashboard/home
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LANDING PAGE
  ========================= */

  if (!showLogin) {
    return (
      <div className="lf-site">
        <header className="lf-nav">
          <button
            type="button"
            className="lf-brand lf-brand-button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label="LeaveFlow home"
          >
            <span className="lf-brand-symbol">L</span>

            <span className="lf-brand-name">
              Leave<span>Flow</span>
            </span>
          </button>

          <nav
            className="lf-nav-links"
            aria-label="Main navigation"
          >
            <button
              type="button"
              onClick={() => scrollToSection("features")}
            >
              Features
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("how-it-works")
              }
            >
              How it works
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("about")}
            >
              About
            </button>
          </nav>

          <button
            type="button"
            className="lf-nav-login"
            onClick={openLogin}
          >
            Sign in <span>→</span>
          </button>
        </header>

        <main>
          {/* HERO */}

          <section className="lf-hero">
            <div className="lf-hero-copy">
              <p className="lf-kicker">
                <span></span>
                LEAVE MANAGEMENT, SIMPLIFIED
              </p>

              <h1>
                Time off,
                <br />
                <em>made simple.</em>
              </h1>

              <p className="lf-hero-description">
                One clear workspace for leave requests,
                approvals, balances, and team availability.
              </p>

              <div className="lf-hero-actions">
                <button
                  type="button"
                  className="lf-primary-button"
                  onClick={openLogin}
                >
                  Get started <span>→</span>
                </button>

                <button
                  type="button"
                  className="lf-text-button"
                  onClick={() =>
                    scrollToSection("features")
                  }
                >
                  Explore features <span>↓</span>
                </button>
              </div>

              <div className="lf-trust-row">
                <span>
                  <b>✓</b> Simple for employees
                </span>

                <span>
                  <b>✓</b> Clear for managers
                </span>
              </div>
            </div>

            <div
              className="lf-hero-visual"
              aria-label="LeaveFlow dashboard preview"
            >
              <div className="lf-orbit lf-orbit-one"></div>
              <div className="lf-orbit lf-orbit-two"></div>

              <div className="lf-dashboard-card">
                <div className="lf-card-top">
                  <div>
                    <small>LEAVEFLOW</small>
                    <strong>My overview</strong>
                  </div>

                  <span className="lf-live">
                    <i></i> LIVE
                  </span>
                </div>

                <div className="lf-balance-box">
                  <div>
                    <small>AVAILABLE LEAVE</small>
                    <strong>20</strong>
                    <span>days remaining</span>
                  </div>

                  <div className="lf-progress-ring">
                    <span>60%</span>
                  </div>
                </div>

                <div className="lf-card-divider"></div>

                <div className="lf-request-row">
                  <div className="lf-avatar">F</div>

                  <div>
                    <strong>Annual Leave</strong>
                    <small>24 Aug — 26 Aug</small>
                  </div>

                  <span className="lf-approved">
                    ✓ Approved
                  </span>
                </div>

                <div className="lf-calendar-row">
                  <div>
                    <small>MON</small>
                    <strong>24</strong>
                  </div>

                  <div className="active">
                    <small>TUE</small>
                    <strong>25</strong>
                  </div>

                  <div className="active">
                    <small>WED</small>
                    <strong>26</strong>
                  </div>

                  <div>
                    <small>THU</small>
                    <strong>27</strong>
                  </div>

                  <div>
                    <small>FRI</small>
                    <strong>28</strong>
                  </div>
                </div>
              </div>

              <div className="lf-float-card lf-float-approved">
                <span className="lf-float-icon">✓</span>

                <div>
                  <strong>Leave approved</strong>
                  <small>
                    Your request is confirmed
                  </small>
                </div>
              </div>

              <div className="lf-float-card lf-float-calendar">
                <span className="lf-date-icon">24</span>

                <div>
                  <strong>Team calendar</strong>
                  <small>4 people away today</small>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}

          <section id="features" className="lf-features">
            <div className="lf-section-heading">
              <p className="lf-section-label">
                <span>01</span> EVERYTHING YOU NEED
              </p>

              <h2>
                Leave management
                <br />
                <em>that flows.</em>
              </h2>

              <p>
                LeaveFlow gives your whole team a clearer,
                quicker way to request, approve, and track
                time away.
              </p>
            </div>

            <div className="lf-feature-grid">
              <article className="lf-feature-card">
                <span className="lf-feature-icon">
                  CAL
                </span>

                <p className="lf-feature-number">01</p>

                <h3>Team calendar</h3>

                <p>
                  See who is away, avoid scheduling
                  conflicts, and plan with confidence.
                </p>
              </article>

              <article className="lf-feature-card">
                <span className="lf-feature-icon">
                  BAL
                </span>

                <p className="lf-feature-number">02</p>

                <h3>Clear balances</h3>

                <p>
                  Everyone can see used, remaining, and
                  pending leave in one place.
                </p>
              </article>

              <article className="lf-feature-card">
                <span className="lf-feature-icon">
                  REQ
                </span>

                <p className="lf-feature-number">03</p>

                <h3>Simple requests</h3>

                <p>
                  Employees submit leave requests in
                  seconds from one easy form.
                </p>
              </article>

              <article className="lf-feature-card">
                <span className="lf-feature-icon">
                  APR
                </span>

                <p className="lf-feature-number">04</p>

                <h3>Faster approvals</h3>

                <p>
                  Managers can review requests and make
                  decisions without delays.
                </p>
              </article>
            </div>
          </section>

          {/* HOW IT WORKS */}

          <section
            id="how-it-works"
            className="lf-workflow"
          >
            <div className="lf-section-heading lf-centered-heading">
              <p className="lf-section-label">
                <span>02</span> HOW IT WORKS
              </p>

              <h2>
                From request
                <br />
                <em>to approved.</em>
              </h2>

              <p>
                A connected workflow that keeps employees
                and managers informed at every step.
              </p>
            </div>

            <div className="lf-workflow-steps">
              <article>
                <span className="lf-step-number">
                  01
                </span>

                <span className="lf-step-icon">
                  REQ
                </span>

                <h3>Request</h3>

                <p>
                  Employees request leave in seconds.
                </p>
              </article>

              <article>
                <span className="lf-step-number">
                  02
                </span>

                <span className="lf-step-icon">
                  REV
                </span>

                <h3>Review</h3>

                <p>
                  Managers review dates and balances.
                </p>
              </article>

              <article>
                <span className="lf-step-number">
                  03
                </span>

                <span className="lf-step-icon">
                  OK
                </span>

                <h3>Approve</h3>

                <p>
                  Approve or decline with one decision.
                </p>
              </article>

              <article>
                <span className="lf-step-number">
                  04
                </span>

                <span className="lf-step-icon">
                  CAL
                </span>

                <h3>Track</h3>

                <p>
                  The team calendar stays up to date.
                </p>
              </article>
            </div>
          </section>

          {/* ABOUT */}

          <section id="about" className="lf-about">
            <div className="lf-about-copy">
              <p className="lf-section-label">
                <span>03</span> WHY LEAVEFLOW
              </p>

              <h2>
                Less admin.
                <br />
                <em>More clarity.</em>
              </h2>

              <p>
                LeaveFlow brings requests, approvals,
                schedules, and leave visibility into one
                calm, connected experience.
              </p>

              <button
                type="button"
                className="lf-outline-button"
                onClick={openLogin}
              >
                Sign in to your workspace{" "}
                <span>→</span>
              </button>
            </div>

            <div className="lf-about-panel">
              <div className="lf-about-panel-top">
                <div>
                  <small>LEAVEFLOW</small>
                  <strong>Leave request</strong>
                </div>

                <span className="lf-live">
                  <i></i> LIVE
                </span>
              </div>

              <div className="lf-about-person">
                <span className="lf-avatar">M</span>

                <div>
                  <strong>
                    Max's leave request
                  </strong>

                  <small>
                    Annual Leave · 24 Aug — 26 Aug
                  </small>
                </div>

                <b>APPROVED</b>
              </div>

              <div className="lf-timeline">
                <div>
                  <span className="done">✓</span>
                  <small>REQUESTED</small>
                </div>

                <i></i>

                <div>
                  <span className="done">✓</span>
                  <small>APPROVED</small>
                </div>

                <i></i>

                <div>
                  <span>3</span>
                  <small>CALENDAR</small>
                </div>
              </div>

              <div className="lf-panel-footer">
                <span>
                  <b>✓</b> Leave approved
                </span>

                <small>
                  Everything in one place
                </small>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}

          <section className="lf-final-cta">
            <div>
              <p>READY WHEN YOU ARE</p>

              <h2>
                Make leave
                <br />
                <em>flow better.</em>
              </h2>
            </div>

            <button
              type="button"
              className="lf-light-button"
              onClick={openLogin}
            >
              Sign in to LeaveFlow <span>→</span>
            </button>
          </section>
        </main>

        {/* FOOTER */}

        <footer className="lf-footer">
          <div className="lf-brand">
            <span className="lf-brand-symbol">L</span>

            <span className="lf-brand-name">
              Leave<span>Flow</span>
            </span>
          </div>

          <p>Leave Management System</p>

          <span>© 2026 LeaveFlow</span>
        </footer>
      </div>
    );
  }

  /* =========================
     LOGIN PAGE
  ========================= */

  return (
    <div className="lf-login">
      <button
        type="button"
        className="lf-login-back"
        onClick={returnToLanding}
      >
        <span>←</span> Back to LeaveFlow
      </button>

      <section className="lf-login-intro">
        <div className="lf-brand lf-login-brand">
          <span className="lf-brand-symbol">L</span>

          <span className="lf-brand-name">
            Leave<span>Flow</span>
          </span>
        </div>

        <div className="lf-login-message">
          <p className="lf-section-label">
            YOUR WORKSPACE
          </p>

          <h1>
            Welcome
            <br />
            <em>back.</em>
          </h1>

          <p>
            Everything you need to manage leave, right
            where you left it.
          </p>
        </div>

        <div className="lf-login-statements">
          <div>
            <span>01</span>

            <p>
              Requests <strong>made simple</strong>
            </p>
          </div>

          <div>
            <span>02</span>

            <p>
              Balances <strong>always visible</strong>
            </p>
          </div>

          <div>
            <span>03</span>

            <p>
              Teams <strong>always connected</strong>
            </p>
          </div>
        </div>

        <span className="lf-login-watermark">
          FLOW
        </span>
      </section>

      <section className="lf-login-form">
        <div className="lf-login-form-inner">
          <div className="lf-mobile-brand">
            <div className="lf-brand">
              <span className="lf-brand-symbol">
                L
              </span>

              <span className="lf-brand-name">
                Leave<span>Flow</span>
              </span>
            </div>
          </div>

          <div className="lf-form-heading">
            <p>SIGN IN</p>

            <h2>
              Continue to your
              <br />
              workspace.
            </h2>

            <span>
              Enter your account details below.
            </span>
          </div>

          {error && (
            <div
              className="lf-form-error"
              role="alert"
              aria-live="polite"
            >
              <b>!</b> {error}
            </div>
          )}

          <form
            className="lf-form"
            onSubmit={handleSubmit}
          >
            <div className="lf-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="lf-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />

                <span>@</span>
              </div>
            </div>

            <div className="lf-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="lf-input-wrap">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <span>•••</span>
              </div>
            </div>

            <button
              type="submit"
              className="lf-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="lf-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="lf-security">
            <b>✓</b>

            <p>
              Your account information is securely
              handled by LeaveFlow.
            </p>
          </div>

          <div className="lf-login-footer">
            <span>Leave Management System</span>
            <i>•</i>
            <span>Secure access</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;