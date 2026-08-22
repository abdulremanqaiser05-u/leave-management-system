import React, { useState } from "react";

function RequestLeave() {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const existingRequests =
      JSON.parse(localStorage.getItem("leaveRequests")) || [];

    const newRequest = {
      id: Date.now(),
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: "Pending",
    };

    const updatedRequests = [...existingRequests, newRequest];

    localStorage.setItem(
      "leaveRequests",
      JSON.stringify(updatedRequests)
    );

    alert("Leave request submitted successfully.");

    setFormData({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
    });

    window.location.href = "/my-leave";
  };

  return (
    <div className="request-leave-page">
      <div className="page-header">
        <div>
          <h1>Request Leave</h1>
          <p>Submit a new leave request for approval.</p>
        </div>
      </div>

      <div className="leave-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="leaveType">Leave Type</label>

            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              required
            >
              <option value="">Select leave type</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>

              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>

              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason</label>

            <textarea
              id="reason"
              name="reason"
              placeholder="Enter the reason for your leave..."
              value={formData.reason}
              onChange={handleChange}
              rows="5"
            />
          </div>

          <button type="submit" className="primary-button">
            Submit Leave Request
          </button>
        </form>
      </div>
    </div>
  );
}

export default RequestLeave;