import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function RequestLeave() {
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [leaveType, setLeaveType] = useState("");
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // FETCH LEAVE TYPES
  // =========================================

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("authToken");

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        const response = await fetch(
          "https://ruin-sorrowful-hippopotamus.abasthan.app/api/leave-types",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load leave types"
          );
        }

        setLeaveTypes(data);
      } catch (error) {
        console.error(
          "Leave types error:",
          error
        );

        setError(
          error.message ||
            "Failed to load leave types."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  // =========================================
  // CALCULATE DAYS
  // =========================================

  const calculateDays = () => {
    if (!startDate || !endDate) {
      return 0;
    }

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
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  // =========================================
  // TODAY
  // =========================================

  const getTodayString = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================
  // SELECTED LEAVE TYPE
  // =========================================

  const selectedLeaveType =
    leaveTypes.find(
      (type) =>
        Number(type.id) ===
        Number(leaveType)
    );

  // =========================================
  // SUBMIT REQUEST
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Leave type validation
    if (!leaveType) {
      setError(
        "Please select a leave type."
      );
      return;
    }

    // Start date validation
    if (!startDate) {
      setError(
        "Please select a start date."
      );
      return;
    }

    // End date validation
    if (!endDate) {
      setError(
        "Please select an end date."
      );
      return;
    }

    // Prevent past dates
    const today = new Date(
      getTodayString()
    );

    const selectedStart = new Date(
      startDate
    );

    if (selectedStart < today) {
      setError(
        "Start date cannot be in the past."
      );
      return;
    }

    // Date order validation
    if (
      new Date(endDate) <
      new Date(startDate)
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    const days = calculateDays();

    if (days <= 0) {
      setError(
        "Please select valid dates."
      );
      return;
    }

    // =========================================
    // CHECK LEAVE BALANCE
    // =========================================

    if (
      selectedLeaveType &&
      selectedLeaveType.totalDays !==
        undefined &&
      days >
        Number(
          selectedLeaveType.totalDays
        )
    ) {
      setError(
        `You cannot request ${days} days. ${selectedLeaveType.name} has a maximum entitlement of ${selectedLeaveType.totalDays} days.`
      );

      return;
    }

    try {
      setSubmitting(true);

      const token =
        localStorage.getItem(
          "authToken"
        );

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        "https://ruin-sorrowful-hippopotamus.abasthan.app/api/leave-requests",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            leaveTypeId:
              Number(leaveType),

            startDate,

            endDate,

            reason:
              reason.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit leave request"
        );
      }

      // =========================================
      // SUCCESS
      // =========================================

      setSuccess(
        "Leave request submitted successfully. Your request is now pending approval."
      );

      // Clear form
      setLeaveType("");
      setStartDate(null);
      setEndDate(null);
      setReason("");

    } catch (error) {
      console.error(
        "Submit leave error:",
        error
      );

      setError(
        error.message ||
          "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="request-leave-page">

        <div className="page-header">

          <div>
            <h1>
              Request Leave
            </h1>

            <p>
              Submit a new leave request.
            </p>
          </div>

        </div>

        <div className="empty-state">

          <p>
            Loading leave types...
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="request-leave-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1>
            Request Leave
          </h1>

          <p>
            Submit a new leave request
            for approval.
          </p>

        </div>

      </div>

      {/* ERROR */}

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

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            background:
              "#dcfce7",
            color:
              "#166534",
            borderRadius:
              "8px",
            border:
              "1px solid #bbf7d0",
          }}
        >
          {success}
        </div>
      )}

      {/* FORM */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Leave Details
          </h2>

          <p>
            Choose your leave type and
            requested dates.
          </p>

        </div>

        <div className="leave-form-card">

          <form
            onSubmit={handleSubmit}
          >

            {/* LEAVE TYPE */}

            <div className="form-group">

              <label htmlFor="leaveType">
                Leave Type
              </label>

              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => {
                  setLeaveType(
                    e.target.value
                  );

                  setError("");
                }}
                required
              >

                <option value="">
                  Select leave type
                </option>

                {leaveTypes.map(
                  (type) => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.name}
                    </option>
                  )
                )}

              </select>

              {/* SELECTED LEAVE INFORMATION */}

              {selectedLeaveType && (
                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "8px",
                    color:
                      "#6b7280",
                  }}
                >
                  Entitlement:{" "}
                  <strong>
                    {
                      selectedLeaveType.totalDays
                    }{" "}
                    days
                  </strong>
                </small>
              )}

            </div>

            {/* DATES */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "20px",
              }}
            >

              {/* START DATE */}

              <div className="form-group">

                <label htmlFor="startDate">
                  Start Date
                </label>

                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setError("");
                  }}
                  minDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select start date"
                  className="date-picker-input"
                  showPopperArrow={false}
                />

              </div>

              {/* END DATE */}

              <div className="form-group">

                <label htmlFor="endDate">
                  End Date
                </label>

                <DatePicker
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setError("");
                  }}
                  minDate={startDate || new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select end date"
                  className="date-picker-input"
                  showPopperArrow={false}
                />

              </div>

            </div>

            {/* DURATION */}

            
            {/* REASON */}

            <div className="form-group">
              <label htmlFor="reason">
                Reason
              </label>

              <textarea
                id="reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="Enter the reason for your leave"
                rows="4"
              />
            </div>

            {calculateDays() > 0 && (
              <div className="duration-box">
                <span>Duration</span>

                <strong>
                  {calculateDays()}{" "}
                  {calculateDays() === 1 ? "day" : "days"}
                </strong>
              </div>
            )}
            
            {/* SUBMIT */}

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >

              {submitting
                ? "Submitting..."
                : "Submit Leave Request"}

            </button>

          </form>

        </div>

      </section>

    </div>
  );
}

export default RequestLeave;

