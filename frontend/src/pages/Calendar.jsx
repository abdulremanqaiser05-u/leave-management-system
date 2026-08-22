import { useState } from "react";

const teamMembers = [
  {
    name: "Abdul Rehman",
    role: "Administrator",
    initials: "AR",
    leaves: {
      25: "annual",
      26: "annual",
      27: "annual",
      28: "annual",
    },
  },
  {
    name: "Ayesha Hassan",
    role: "Product Designer",
    initials: "AH",
    leaves: {
      4: "sick",
      5: "sick",
    },
  },
  {
    name: "Sara Khan",
    role: "Frontend Developer",
    initials: "SK",
    leaves: {
      12: "personal",
      13: "personal",
    },
  },
  {
    name: "Usman Malik",
    role: "Backend Developer",
    initials: "UM",
    leaves: {
      18: "annual",
      19: "annual",
      20: "annual",
    },
  },
  {
    name: "Hamza Ali",
    role: "Developer",
    initials: "HA",
    leaves: {},
  },
];

const leaveLabels = {
  annual: "Annual Leave",
  personal: "Personal Leave",
  sick: "Sick Leave",
};

function Calendar() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });

  const goPrevious = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToday = () => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  return (
    <section className="calendar-page">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">TEAM AVAILABILITY</p>
          <h1>Leave Calendar</h1>
          <p className="calendar-subtitle">
            See who's away and when your team is available.
          </p>
        </div>

        <button className="primary-button">
          <span>+</span>
          Request Leave
        </button>
      </div>

      <div className="calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-navigation">
            <button onClick={goPrevious} className="calendar-nav-button">
              ←
            </button>

            <button onClick={goNext} className="calendar-nav-button">
              →
            </button>

            <button onClick={goToday} className="today-button">
              Today
            </button>
          </div>

          <div className="calendar-month">
            <h2>
              {monthName} {year}
            </h2>
          </div>

          <div className="calendar-view">
            <button className="view-button active">Month</button>
            <button className="view-button">Year</button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="calendar-member-header">TEAM MEMBER</div>

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);

            return (
              <div
                key={day}
                className={`calendar-day-header ${
                  date.getDay() === 0 || date.getDay() === 6
                    ? "weekend"
                    : ""
                }`}
              >
                <span>
                  {date.toLocaleString("en-US", {
                    weekday: "short",
                  })}
                </span>
                <strong>{day}</strong>
              </div>
            );
          })}

          {teamMembers.map((member) => (
            <div className="calendar-member-row" key={member.name}>
              <div className="member-info">
                <div className="member-avatar">{member.initials}</div>

                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
              </div>

              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const leaveType = member.leaves[day];

                return (
                  <div
                    key={day}
                    className={`calendar-cell ${
                      new Date(year, month, day).getDay() === 0 ||
                      new Date(year, month, day).getDay() === 6
                        ? "weekend"
                        : ""
                    }`}
                  >
                    {leaveType && (
                      <div className={`leave-block ${leaveType}`}>
                        {day === Object.keys(member.leaves)[0]
                          ? leaveLabels[leaveType]
                          : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="calendar-legend">
          <span>
            <i className="legend-dot annual"></i>
            Annual Leave
          </span>

          <span>
            <i className="legend-dot personal"></i>
            Personal Leave
          </span>

          <span>
            <i className="legend-dot sick"></i>
            Sick Leave
          </span>

          <span>
            <i className="legend-dot available"></i>
            Available
          </span>
        </div>
      </div>
    </section>
  );
}

export default Calendar;