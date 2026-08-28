import React, { useEffect, useState } from "react";

function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [customRole, setCustomRole] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  // =========================================
  // CURRENT USER / ROLE
  // =========================================

  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Failed to read user:",
      error
    );
  }

  const isAdmin =
    String(currentUser?.role || "").toUpperCase() ===
    "ADMIN";

  // =========================================
  // FETCH TEAM MEMBERS
  // =========================================

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("authToken");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        "https://ruin-sorrowful-hippopotamus.abasthan.app/api/users",
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
            "Failed to load team members"
        );
      }

      setTeamMembers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Team error:",
        error
      );

      setError(
        error.message ||
          "Failed to load team members."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD TEAM
  // =========================================

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
  };

  // =========================================
  // ROLE CHANGE
  // =========================================

  const handleRoleChange = (e) => {
    const value = e.target.value;

    setFormData((currentData) => ({
      ...currentData,
      role: value,
    }));

    if (value !== "CUSTOM") {
      setCustomRole("");
    }

    setError("");
  };

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
    });

    setCustomRole("");
  };

  // =========================================
  // ADD TEAM MEMBER
  // ADMIN ONLY
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError(
        "Only administrators can add team members."
      );
      return;
    }

    // =========================================
    // CUSTOM ROLE VALIDATION
    // =========================================

    let finalRole =
      formData.role;

    if (formData.role === "CUSTOM") {
      finalRole =
        customRole.trim();

      if (!finalRole) {
        setError(
          "Please enter a custom role."
        );
        return;
      }
    }

    try {
      setError("");

      const token =
        localStorage.getItem(
          "authToken"
        );

      if (!token) {
        setError(
          "You are not logged in."
        );
        return;
      }

      const response =
        await fetch(
          "https://ruin-sorrowful-hippopotamus.abasthan.app/api/users",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              name:
                formData.name.trim(),

              email:
                formData.email.trim(),

              password:
                formData.password,

              role: finalRole,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to add team member"
        );
      }

      setTeamMembers(
        (currentMembers) => [
          ...currentMembers,
          data,
        ]
      );

      resetForm();

      setShowForm(false);

      alert(
        "Team member added successfully."
      );
    } catch (error) {
      console.error(
        "Add team member error:",
        error
      );

      setError(
        error.message ||
          "Failed to add team member."
      );
    }
  };

  // =========================================
  // REMOVE TEAM MEMBER
  // ADMIN ONLY
  // =========================================

  const removeMember = async (
    member
  ) => {
    if (!isAdmin) {
      setError(
        "Only administrators can remove team members."
      );
      return;
    }

    if (
      String(member.role).toUpperCase() ===
      "ADMIN"
    ) {
      alert(
        "Admin accounts cannot be removed."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to remove ${member.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token =
        localStorage.getItem(
          "authToken"
        );

      if (!token) {
        setError(
          "You are not logged in."
        );
        return;
      }

      const response =
        await fetch(
          `https://ruin-sorrowful-hippopotamus.abasthan.app/api/users/${member.id}`,
          {
            method: "DELETE",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to remove team member"
        );
      }

      setTeamMembers(
        (currentMembers) =>
          currentMembers.filter(
            (currentMember) =>
              currentMember.id !==
              member.id
          )
      );

      alert(
        "Team member removed successfully."
      );
    } catch (error) {
      console.error(
        "Remove team member error:",
        error
      );

      setError(
        error.message ||
          "Failed to remove team member."
      );
    }
  };

  // =========================================
  // AVATAR INITIALS
  // =========================================

  const getInitials = (name) => {
    if (!name) {
      return "??";
    }

    return name
      .trim()
      .split(/\s+/)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="team-page">
        <div className="page-header">
          <div>
            <h1>Team</h1>

            <p>
              View and manage your team
              members.
            </p>
          </div>
        </div>

        <section className="leave-section">
          <div className="empty-state">
            <p>
              Loading team members...
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="team-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Team</h1>

          <p>
            {isAdmin
              ? "View and manage your team members."
              : "View your team members."}
          </p>
        </div>

        {/* ADMIN ONLY */}

        {isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setError("");
              setShowForm(
                (current) =>
                  !current
              );
            }}
          >
            <span>+</span>
            Add Team Member
          </button>
        )}

      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
            border:
              "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================
          ADD MEMBER FORM
          ADMIN ONLY
      ===================================== */}

      {isAdmin && showForm && (
        <section className="leave-section">

          <div className="section-heading">

            <h2>
              Add Team Member
            </h2>

            <p>
              Create a new employee
              account and assign a role.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
          >

            {/* NAME + EMAIL */}

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter full name"
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="email">
                  Email
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter email address"
                  required
                />

              </div>

            </div>

            {/* PASSWORD + ROLE */}

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="password">
                  Temporary Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter password"
                  required
                  minLength="6"
                />

              </div>

              <div className="form-group">

                <label htmlFor="role">
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={
                    formData.role
                  }
                  onChange={
                    handleRoleChange
                  }
                  required
                >

                  <option value="EMPLOYEE">
                    Employee
                  </option>

                  <option value="MANAGER">
                    Manager
                  </option>

                  <option value="ASSISTANT MANAGER">
                    Assistant Manager
                  </option>

                  <option value="HEAD">
                    Head
                  </option>

                  <option value="SUPERVISOR">
                    Supervisor
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>

                  <option value="CUSTOM">
                    Other / Custom Role
                  </option>

                </select>

              </div>

            </div>

            {/* CUSTOM ROLE */}

            {formData.role ===
              "CUSTOM" && (
              <div
                className="form-group"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <label htmlFor="customRole">
                  Custom Role
                </label>

                <input
                  type="text"
                  id="customRole"
                  value={
                    customRole
                  }
                  onChange={(e) => {
                    setCustomRole(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder="e.g. Department Head"
                  required
                />

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
                  Enter the role name
                  you want to assign to
                  this team member.
                </small>

              </div>
            )}

            {/* BUTTONS */}

            <div
              style={{
                display:
                  "flex",
                gap: "10px",
                marginTop:
                  "20px",
              }}
            >

              <button
                type="submit"
                className="primary-button"
              >
                Add Team Member
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowForm(
                    false
                  );

                  resetForm();

                  setError("");
                }}
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =====================================
          TEAM MEMBERS
      ===================================== */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Team Members
          </h2>

          <p>
            Current team availability.
          </p>

        </div>

        {teamMembers.length >
        0 ? (

          <div className="leave-list">

            {teamMembers.map(
              (member) => {

                const memberRole =
                  String(
                    member.role ||
                      "EMPLOYEE"
                  );

                const isMemberAdmin =
                  memberRole.toUpperCase() ===
                  "ADMIN";

                return (
                  <div
                    className="leave-row"
                    key={
                      member.id
                    }
                  >

                    {/* MEMBER */}

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "15px",
                      }}
                    >

                      <div className="member-avatar">
                        {getInitials(
                          member.name
                        )}
                      </div>

                      <div className="leave-info">

                        <strong>
                          {
                            member.name
                          }
                        </strong>

                        <span>
                          {
                            member.email
                          }
                        </span>

                      </div>

                    </div>

                    {/* STATUS */}

                    <span
                      className={`status ${
                        member.status ===
                        "On Leave"
                          ? "pending"
                          : "approved"
                      }`}
                    >
                      {
                        member.status
                      }
                    </span>

                    {/* ROLE */}

                    <span
                      style={{
                        fontSize:
                          "14px",
                        fontWeight:
                          "600",
                      }}
                    >
                      {
                        memberRole
                      }
                    </span>

                    {/* ADMIN CONTROLS */}

                    {isAdmin && (
                      <>
                        {isMemberAdmin ? (
                          <span
                            style={{
                              color:
                                "#777",
                              fontSize:
                                "14px",
                            }}
                          >
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="reject-button"
                            onClick={() =>
                              removeMember(
                                member
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}

                  </div>
                );
              }
            )}

          </div>

        ) : (

          <div className="empty-state">

            <p>
              No team members found.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}

export default Team;