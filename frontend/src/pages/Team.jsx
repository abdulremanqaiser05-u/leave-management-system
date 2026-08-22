import React, { useState } from "react";

function Team() {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Abdul Rehman",
      role: "Frontend Developer",
      status: "Available",
    },
    {
      id: 2,
      name: "Ahmed Khan",
      role: "Backend Developer",
      status: "On Leave",
    },
    {
      id: 3,
      name: "Sara Ali",
      role: "UI/UX Designer",
      status: "Available",
    },
  ]);

  const removeMember = (id) => {
    setTeamMembers(
      teamMembers.filter((member) => member.id !== id)
    );
  };

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p>View and manage your team members.</p>
        </div>
      </div>

      <section className="leave-section">
        <div className="section-heading">
          <h2>Team Members</h2>
          <p>Current members of your team.</p>
        </div>

        {teamMembers.length > 0 ? (
          <div className="leave-list">
            {teamMembers.map((member) => (
              <div className="leave-row" key={member.id}>
                <div className="leave-info">
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>

                <span
                  className={`status ${
                    member.status === "Available"
                      ? "approved"
                      : "pending"
                  }`}
                >
                  {member.status}
                </span>

                <button
                  className="reject-button"
                  onClick={() => removeMember(member.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No team members found.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Team;