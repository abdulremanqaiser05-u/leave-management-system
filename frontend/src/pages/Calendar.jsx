import React, { useEffect, useState } from "react";
import API_URL from "../api";
function Calendar() {
  const [month, setMonth] = useState(7); // August
  const [year, setYear] = useState(2026);

  const [view, setView] = useState("month");

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = new Date(year, month, 1).toLocaleString(
    "en-US",
    {
      month: "long",
    }
  );

  // =========================================
  // FETCH CALENDAR DATA
  // =========================================

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("authToken");

        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/calendar`,
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
            data.message || "Failed to load calendar"
          );
        }

        setTeamMembers(data);
      } catch (error) {
        console.error("Calendar error:", error);
        setError(
          error.message || "Failed to load calendar"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  // =========================================
  // MONTH / YEAR NAVIGATION
  // =========================================

  const goPrevious = () => {
    if (view === "year") {
      setYear(year - 1);
      return;
    }

    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (view === "year") {
      setYear(year + 1);
      return;
    }

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

  // =========================================
  // CREATE LOCAL DATE STRING
  // =========================================

  const makeDateString = (day) => {
    const monthNumber = String(month + 1).padStart(2, "0");
    const dayNumber = String(day).padStart(2, "0");

    return `${year}-${monthNumber}-${dayNumber}`;
  };

  // =========================================
  // NORMALIZE DATABASE DATE
  // =========================================

  const normalizeDate = (date) => {
    if (!date) {
      return "";
    }

    return String(date).split("T")[0];
  };

  // =========================================
  // FIND LEAVE FOR EXACT DAY
  // =========================================

  const getLeaveForDay = (member, day) => {
    const currentDate = makeDateString(day);

    if (!member.leaves || member.leaves.length === 0) {
      return null;
    }

    const leave = member.leaves.find((item) => {
      const startDate = normalizeDate(item.startDate);
      const endDate = normalizeDate(item.endDate);

      return (
        currentDate >= startDate &&
        currentDate <= endDate
      );
    });

    return leave || null;
  };

  // =========================================
  // FIND LEAVE FOR ANY DATE
  // =========================================

  const getLeaveForDate = (member, date) => {
    if (!member.leaves || member.leaves.length === 0) {
      return null;
    }

    const currentDate = normalizeDate(date);

    return (
      member.leaves.find((item) => {
        const startDate = normalizeDate(item.startDate);
        const endDate = normalizeDate(item.endDate);

        return (
          currentDate >= startDate &&
          currentDate <= endDate
        );
      }) || null
    );
  };

  // =========================================
  // GET LEAVE TYPE NAME
  // =========================================

  const getLeaveTypeName = (leave) => {
    if (!leave) {
      return "Leave";
    }

    return (
      leave.leaveType?.name ||
      leave.leaveType?.title ||
      leave.leave_type?.name ||
      leave.leave_type ||
      leave.leaveName ||
      leave.leave_name ||
      leave.type?.name ||
      leave.type ||
      leave.name ||
      leave.leaveType ||
      "Leave"
    );
  };

  // =========================================
  // GET LEAVE ABBREVIATION
  // =========================================

  const getLeaveCode = (leave) => {
    const leaveType = getLeaveTypeName(leave);

    const type = String(leaveType)
      .trim()
      .toLowerCase();

    if (
      type.includes("annual") ||
      type.includes("vacation")
    ) {
      return "AL";
    }

    if (
      type.includes("sick") ||
      type.includes("medical")
    ) {
      return "SL";
    }

    if (
      type.includes("casual") ||
      type.includes("personal")
    ) {
      return "CL";
    }

    if (
      type.includes("other") ||
      type.includes("special")
    ) {
      return "OL";
    }

    const words = String(leaveType)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 2) {
      return words
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
    }

    if (words.length === 1) {
      return words[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return "LV";
  };

  // =========================================
  // LEAVE CLASS
  // =========================================

  const getLeaveClass = (leave) => {
    const leaveType = getLeaveTypeName(leave);

    const type = String(leaveType)
      .trim()
      .toLowerCase();

    if (
      type.includes("annual") ||
      type.includes("vacation")
    ) {
      return "annual";
    }

    if (
      type.includes("sick") ||
      type.includes("medical")
    ) {
      return "sick";
    }

    if (
      type.includes("casual") ||
      type.includes("personal")
    ) {
      return "personal";
    }

    return "other";
  };

  // =========================================
  // YEAR VIEW
  // =========================================

  const renderYearView = () => {
    const months = Array.from(
      { length: 12 },
      (_, index) => index
    );

    return (
      <div
        style={{
          padding: "24px",
        }}
      >

        {/* YEAR TITLE */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
              }}
            >
              {year}
            </h2>
          </div>

          {/* COLOR LEGEND */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
              fontSize: "13px",
            }}
          >

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <i
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "inline-block",
                }}
              ></i>
              Annual Leave
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <i
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#f59e0b",
                  display: "inline-block",
                }}
              ></i>
              Casual Leave
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <i
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                }}
              ></i>
              Sick Leave
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <i
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#8b5cf6",
                  display: "inline-block",
                }}
              ></i>
              Other Leave
            </span>

          </div>

        </div>

        {/* MONTHS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "18px",
          }}
        >

          {months.map((monthIndex) => {

            const currentMonthName =
              new Date(
                year,
                monthIndex,
                1
              ).toLocaleString("en-US", {
                month: "long",
              });

            const monthDays =
              new Date(
                year,
                monthIndex + 1,
                0
              ).getDate();

            const firstDay =
              new Date(
                year,
                monthIndex,
                1
              ).getDay();

            const monthLeaves = [];

            teamMembers.forEach((member) => {

              if (!member.leaves) {
                return;
              }

              member.leaves.forEach(
                (leave) => {

                  const startDate =
                    normalizeDate(
                      leave.startDate
                    );

                  const endDate =
                    normalizeDate(
                      leave.endDate
                    );

                  const monthStart =
                    `${year}-${String(
                      monthIndex + 1
                    ).padStart(
                      2,
                      "0"
                    )}-01`;

                  const monthEnd =
                    `${year}-${String(
                      monthIndex + 1
                    ).padStart(
                      2,
                      "0"
                    )}-${String(
                      monthDays
                    ).padStart(2, "0")}`;

                  if (
                    startDate <= monthEnd &&
                    endDate >= monthStart
                  ) {
                    monthLeaves.push({
                      member,
                      leave,
                    });
                  }
                }
              );
            });

            return (
              <div
                key={monthIndex}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#ffffff",
                  minWidth: 0,
                }}
              >

                {/* MONTH HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "17px",
                    }}
                  >
                    {currentMonthName}
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      setMonth(monthIndex);
                      setView("month");
                    }}
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    View
                  </button>

                </div>

                {/* WEEK DAYS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(7, 1fr)",
                    gap: "4px",
                    marginBottom: "5px",
                  }}
                >

                  {[
                    "S",
                    "M",
                    "T",
                    "W",
                    "T",
                    "F",
                    "S",
                  ].map(
                    (day, index) => (
                      <div
                        key={index}
                        style={{
                          textAlign:
                            "center",
                          fontSize:
                            "10px",
                          fontWeight:
                            "600",
                          color:
                            "#9ca3af",
                        }}
                      >
                        {day}
                      </div>
                    )
                  )}

                </div>

                {/* DAYS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(7, 1fr)",
                    gap: "4px",
                  }}
                >

                  {/* EMPTY DAYS */}

                  {Array.from(
                    {
                      length: firstDay,
                    },
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        style={{
                          minHeight:
                            "28px",
                        }}
                      />
                    )
                  )}

                  {/* ACTUAL DAYS */}

                  {Array.from(
                    {
                      length: monthDays,
                    },
                    (_, index) => {

                      const day =
                        index + 1;

                      const dateString =
                        `${year}-${String(
                          monthIndex + 1
                        ).padStart(
                          2,
                          "0"
                        )}-${String(
                          day
                        ).padStart(
                          2,
                          "0"
                        )}`;

                      const date =
                        new Date(
                          year,
                          monthIndex,
                          day
                        );

                      const leave =
                        teamMembers
                          .map(
                            (member) =>
                              getLeaveForDate(
                                member,
                                dateString
                              )
                          )
                          .find(
                            (item) =>
                              item
                          );

                      const leaveCount =
                        teamMembers.filter(
                          (member) =>
                            getLeaveForDate(
                              member,
                              dateString
                            )
                        ).length;

                      let dotColor =
                        "";

                      if (leave) {
                        const leaveClass =
                          getLeaveClass(
                            leave
                          );

                        if (
                          leaveClass ===
                          "annual"
                        ) {
                          dotColor =
                            "#2563eb";
                        } else if (
                          leaveClass ===
                          "personal"
                        ) {
                          dotColor =
                            "#f59e0b";
                        } else if (
                          leaveClass ===
                          "sick"
                        ) {
                          dotColor =
                            "#ef4444";
                        } else {
                          dotColor =
                            "#8b5cf6";
                        }
                      }

                      return (
                        <div
                          key={day}
                          title={
                            leave
                              ? `${leaveCount} team member${
                                  leaveCount ===
                                  1
                                    ? ""
                                    : "s"
                                } on ${getLeaveTypeName(
                                  leave
                                )}`
                              : undefined
                          }
                          style={{
                            minHeight:
                              "28px",
                            borderRadius:
                              "6px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            position:
                              "relative",
                            fontSize:
                              "11px",
                            background:
                              leave
                                ? `${dotColor}18`
                                : "transparent",
                            fontWeight:
                              leave
                                ? "700"
                                : "400",
                            cursor:
                              leave
                                ? "pointer"
                                : "default",
                          }}
                        >

                          {day}

                          {leave && (
                            <span
                              style={{
                                position:
                                  "absolute",
                                bottom:
                                  "2px",
                                width:
                                  "4px",
                                height:
                                  "4px",
                                borderRadius:
                                  "50%",
                                background:
                                  dotColor,
                              }}
                            />
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

                {/* MONTH LEAVE SUMMARY */}

                {monthLeaves.length > 0 ? (

                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop:
                        "12px",
                      borderTop:
                        "1px solid #f0f0f0",
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: "8px",
                    }}
                  >

                    {monthLeaves
                      .slice(0, 4)
                      .map(
                        (
                          item,
                          index
                        ) => {

                          const leaveClass =
                            getLeaveClass(
                              item.leave
                            );

                          let dotColor =
                            "#8b5cf6";

                          if (
                            leaveClass ===
                            "annual"
                          ) {
                            dotColor =
                              "#2563eb";
                          }

                          if (
                            leaveClass ===
                            "personal"
                          ) {
                            dotColor =
                              "#f59e0b";
                          }

                          if (
                            leaveClass ===
                            "sick"
                          ) {
                            dotColor =
                              "#ef4444";
                          }

                          return (
                            <div
                              key={`${item.member.id}-${item.leave.id}-${index}`}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "8px",
                                fontSize:
                                  "12px",
                              }}
                            >

                              <span
                                style={{
                                  width:
                                    "8px",
                                  height:
                                    "8px",
                                  minWidth:
                                    "8px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    dotColor,
                                }}
                              />

                              <div
                                style={{
                                  minWidth:
                                    0,
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                }}
                              >

                                <strong
                                  style={{
                                    whiteSpace:
                                      "nowrap",
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                  }}
                                >
                                  {
                                    item
                                      .member
                                      .name
                                  }
                                </strong>

                                <span
                                  style={{
                                    color:
                                      "#6b7280",
                                  }}
                                >
                                  {getLeaveTypeName(
                                    item.leave
                                  )}
                                </span>

                              </div>

                            </div>
                          );
                        }
                      )}

                    {monthLeaves.length >
                      4 && (
                      <span
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "#6b7280",
                        }}
                      >
                        +
                        {monthLeaves.length -
                          4}{" "}
                        more
                      </span>
                    )}

                  </div>

                ) : (

                  <div
                    style={{
                      marginTop:
                        "14px",
                      paddingTop:
                        "12px",
                      borderTop:
                        "1px solid #f0f0f0",
                      fontSize:
                        "12px",
                      color:
                        "#9ca3af",
                    }}
                  >
                    No leave
                  </div>

                )}

              </div>
            );
          })}

        </div>

      </div>
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <section className="calendar-page">

        <div className="calendar-heading">

          <div>
            <p className="eyebrow">
              TEAM AVAILABILITY
            </p>

            <h1>
              Leave Calendar
            </h1>

            <p className="calendar-subtitle">
              See who's away and when your team is
              available.
            </p>
          </div>

        </div>

        <div className="calendar-panel">

          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            Loading calendar...
          </div>

        </div>

      </section>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <section className="calendar-page">

      {/* HEADER */}

      <div className="calendar-heading">

        <div>

          <p className="eyebrow">
            TEAM AVAILABILITY
          </p>

          <h1>
            Leave Calendar
          </h1>

          <p className="calendar-subtitle">
            See who's away and when your team is
            available.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => {
            window.location.href =
              "/request-leave";
          }}
        >
          <span>+</span>
          Request Leave
        </button>

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
          }}
        >
          {error}
        </div>
      )}

      {/* CALENDAR PANEL */}

      <div className="calendar-panel">

        {/* TOOLBAR */}

        <div className="calendar-toolbar">

          <div className="calendar-navigation">

            <button
              onClick={goPrevious}
              className="calendar-nav-button"
              type="button"
            >
              ←
            </button>

            <button
              onClick={goNext}
              className="calendar-nav-button"
              type="button"
            >
              →
            </button>

            <button
              onClick={goToday}
              className="today-button"
              type="button"
            >
              Today
            </button>

          </div>

          <div className="calendar-month">

            <h2>
              {view === "year"
                ? year
                : `${monthName} ${year}`}
            </h2>

          </div>

          <div className="calendar-view">

            <button
              className={`view-button ${
                view === "month"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() =>
                setView("month")
              }
            >
              Month
            </button>

            <button
              className={`view-button ${
                view === "year"
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() =>
                setView("year")
              }
            >
              Year
            </button>

          </div>

        </div>

        {/* =====================================
            YEAR VIEW
        ===================================== */}

        {view === "year" ? (

          renderYearView()

        ) : (

          <>
            {/* CALENDAR GRID */}

            <div
              className="calendar-grid"
              style={{
                gridTemplateColumns: `210px repeat(${daysInMonth}, minmax(42px, 1fr))`,
              }}
            >

              <div className="calendar-member-header">
                TEAM MEMBER
              </div>

              {/* DAY HEADERS */}

              {Array.from(
                { length: daysInMonth },
                (_, index) => {

                  const day =
                    index + 1;

                  const date =
                    new Date(
                      year,
                      month,
                      day
                    );

                  const weekend =
                    date.getDay() ===
                      0 ||
                    date.getDay() ===
                      6;

                  return (
                    <div
                      key={day}
                      className={`calendar-day-header ${
                        weekend
                          ? "weekend"
                          : ""
                      }`}
                    >

                      <span>
                        {date.toLocaleString(
                          "en-US",
                          {
                            weekday:
                              "short",
                          }
                        )}
                      </span>

                      <strong>
                        {day}
                      </strong>

                    </div>
                  );
                }
              )}

              {/* TEAM MEMBERS */}

              {teamMembers.map(
                (member) => (

                  <React.Fragment
                    key={member.id}
                  >

                    <div className="member-info">

                      <div className="member-avatar">
                        {member.name
                          .split(" ")
                          .map(
                            (word) =>
                              word[0]
                          )
                          .join("")
                          .slice(
                            0,
                            2
                          )
                          .toUpperCase()}
                      </div>

                      <div>

                        <strong>
                          {member.name}
                        </strong>

                        <span>
                          {member.role}
                        </span>

                      </div>

                    </div>

                    {Array.from(
                      {
                        length:
                          daysInMonth,
                      },
                      (_, index) => {

                        const day =
                          index + 1;

                        const date =
                          new Date(
                            year,
                            month,
                            day
                          );

                        const weekend =
                          date.getDay() ===
                            0 ||
                          date.getDay() ===
                            6;

                        const leave =
                          getLeaveForDay(
                            member,
                            day
                          );

                        const currentDate =
                          makeDateString(
                            day
                          );

                        const leaveStartDate =
                          leave
                            ? normalizeDate(
                                leave.startDate
                              )
                            : "";

                        const leaveName =
                          leave
                            ? getLeaveTypeName(
                                leave
                              )
                            : "";

                        const leaveCode =
                          leave
                            ? getLeaveCode(
                                leave
                              )
                            : "";

                        const leaveClass =
                          leave
                            ? getLeaveClass(
                                leave
                              )
                            : "";

                        return (
                          <div
                            key={day}
                            className={`calendar-cell ${
                              weekend
                                ? "weekend"
                                : ""
                            }`}
                          >

                            {leave && (

                              <div
                                className={`leave-block ${leaveClass}`}
                                title={
                                  leaveName
                                }
                                data-leave-name={
                                  leaveName
                                }
                              >

                                {currentDate ===
                                  leaveStartDate && (

                                  <span className="leave-code">
                                    {
                                      leaveCode
                                    }
                                  </span>

                                )}

                                <span className="leave-tooltip">
                                  {
                                    leaveName
                                  }
                                </span>

                              </div>

                            )}

                          </div>
                        );
                      }
                    )}

                  </React.Fragment>
                )
              )}

            </div>

            {/* LEGEND */}

            <div className="calendar-legend">

              <span>
                <i className="legend-dot annual"></i>
                Annual Leave
              </span>

              <span>
                <i className="legend-dot personal"></i>
                Casual Leave
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

          </>
        )}

      </div>

    </section>
  );
}

export default Calendar;