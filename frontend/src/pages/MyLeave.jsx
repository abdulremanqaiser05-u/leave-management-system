import React, {
  useEffect,
  useState,
} from "react";

function MyLeave() {
  const [requests, setRequests] =
    useState([]);

  const [leaveTypes, setLeaveTypes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const normalizeDate = (date) => {
    if (!date) {
      return null;
    }

    const value = String(date);

    if (value.includes("T")) {
      return value.split("T")[0];
    }

    return value.substring(0, 10);
  };

  const getTodayString = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // REQUEST FIELD HELPERS
  // =========================================================

  const getRequestStartDate = (
    request
  ) => {
    return (
      request?.startDate ||
      request?.start_date ||
      request?.fromDate ||
      request?.from_date ||
      ""
    );
  };

  const getRequestEndDate = (
    request
  ) => {
    return (
      request?.endDate ||
      request?.end_date ||
      request?.toDate ||
      request?.to_date ||
      getRequestStartDate(request)
    );
  };

  const getStatus = (request) => {
    return String(
      request?.status || "PENDING"
    ).toUpperCase();
  };

  const getLeaveTypeId = (
    request
  ) => {
    return (
      request?.leaveType?.id ||
      request?.leaveTypeId ||
      request?.leave_type_id ||
      null
    );
  };

  const getLeaveTypeName = (
    request
  ) => {
    return (
      request?.leaveType?.name ||
      request?.leaveType?.title ||
      request?.leave_type?.name ||
      request?.leaveName ||
      request?.leave_name ||
      "Leave"
    );
  };

  // =========================================================
  // CALCULATE DAYS
  // =========================================================

  const calculateDays = (
    startDate,
    endDate
  ) => {
    const startString =
      normalizeDate(startDate);

    const endString =
      normalizeDate(endDate);

    if (
      !startString ||
      !endString
    ) {
      return 0;
    }

    const start = new Date(
      `${startString}T00:00:00`
    );

    const end = new Date(
      `${endString}T00:00:00`
    );

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
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    const normalized =
      normalizeDate(date);

    if (!normalized) {
      return "—";
    }

    const parsedDate = new Date(
      `${normalized}T00:00:00`
    );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // FETCH MY LEAVE REQUESTS
  // =========================================================

  const fetchMyLeave = async () => {
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

      const response =
        await fetch(
          "http://localhost:5000/api/leave-requests",
          {
            method: "GET",

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
            "Failed to load your leave requests"
        );
      }

      if (
        !Array.isArray(data)
      ) {
        throw new Error(
          "Invalid leave request data received from server."
        );
      }

      setRequests(data);
    } catch (error) {
      console.error(
        "Failed to fetch My Leave:",
        error
      );

      setRequests([]);

      setError(
        error.message ||
          "Failed to load your leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH LEAVE TYPES
  // =========================================================

  const fetchLeaveTypes =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "authToken"
          );

        if (!token) {
          return;
        }

        const response =
          await fetch(
            "http://localhost:5000/api/leave-types",
            {
              method: "GET",

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
              "Failed to load leave types"
          );
        }

        setLeaveTypes(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch leave types:",
          error
        );
      }
    };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchMyLeave();
    fetchLeaveTypes();
  }, []);

  // =========================================================
  // TODAY
  // =========================================================

  const todayString =
    getTodayString();

  // =========================================================
  // LEAVE BALANCE
  // =========================================================

  const leaveBalance =
    leaveTypes.map(
      (leaveType) => {
        const approvedRequests =
          requests.filter(
            (request) => {
              return (
                getStatus(
                  request
                ) === "APPROVED" &&
                String(
                  getLeaveTypeId(
                    request
                  )
                ) ===
                  String(
                    leaveType.id
                  )
              );
            }
          );

        const used =
          approvedRequests.reduce(
            (
              total,
              request
            ) => {
              return (
                total +
                calculateDays(
                  getRequestStartDate(
                    request
                  ),
                  getRequestEndDate(
                    request
                  )
                )
              );
            },
            0
          );

        const entitlement =
          Number(
            leaveType.totalDays
          ) || 0;

        return {
          id: leaveType.id,

          type:
            leaveType.name ||
            "Leave",

          entitlement,

          used,

          remaining:
            Math.max(
              entitlement -
                used,
              0
            ),
        };
      }
    );

  // =========================================================
  // UPCOMING LEAVE
  // =========================================================

  const upcomingLeave =
    requests
      .filter((request) => {
        const startDate =
          normalizeDate(
            getRequestStartDate(
              request
            )
          );

        const endDate =
          normalizeDate(
            getRequestEndDate(
              request
            )
          );

        const status =
          getStatus(request);

        if (
          !startDate ||
          !endDate
        ) {
          return false;
        }

        // Only approved and pending
        // requests can appear as upcoming.
        if (
          status !== "PENDING" &&
          status !== "APPROVED"
        ) {
          return false;
        }

        return (
          endDate >=
          todayString
        );
      })
      .sort((a, b) => {
        return (
          normalizeDate(
            getRequestStartDate(a)
          ).localeCompare(
            normalizeDate(
              getRequestStartDate(b)
            )
          )
        );
      });

  // =========================================================
  // LEAVE HISTORY
  // =========================================================
  //
  // IMPORTANT:
  // Only requests whose END DATE has already
  // passed are shown here.
  //
  // This means a future REJECTED request
  // will NOT incorrectly appear as previous leave.
  // =========================================================

  const previousLeave =
    requests
      .filter((request) => {
        const endDate =
          normalizeDate(
            getRequestEndDate(
              request
            )
          );

        if (!endDate) {
          return false;
        }

        // Only completed/past leave belongs
        // in Leave History.
        return (
          endDate <
          todayString
        );
      })
      .sort((a, b) => {
        return (
          normalizeDate(
            getRequestStartDate(b)
          ).localeCompare(
            normalizeDate(
              getRequestStartDate(a)
            )
          )
        );
      });

  // =========================================================
  // REQUEST SUMMARY
  // =========================================================

  const pendingRequests =
    requests.filter(
      (request) =>
        getStatus(
          request
        ) === "PENDING"
    );

  const approvedRequests =
    requests.filter(
      (request) =>
        getStatus(
          request
        ) === "APPROVED"
    );

  const rejectedRequests =
    requests.filter(
      (request) =>
        getStatus(
          request
        ) === "REJECTED" ||
        getStatus(
          request
        ) === "DECLINED"
    );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="my-leave-page">

        <div className="page-header">

          <div>

            <h1>
              My Leave
            </h1>

            <p>
              Manage your leave balance,
              upcoming time off,
              and leave history.
            </p>

          </div>

        </div>

        <div className="empty-state">

          <p>
            Loading your leave requests...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="my-leave-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1>
            My Leave
          </h1>

          <p>
            Manage your leave balance,
            upcoming time off,
            and leave history.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            window.location.href =
              "/request-leave";
          }}
        >
          + Request Leave
        </button>

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

      {/* REQUEST SUMMARY */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Request Summary
          </h2>

          <p>
            Overview of your leave
            requests.
          </p>

        </div>

        <div className="leave-balance-grid">

          <div className="leave-balance-card">

            <h3>
              Pending
            </h3>

            <div className="leave-remaining">

              <strong>
                {
                  pendingRequests.length
                }
              </strong>

              <span>
                requests
              </span>

            </div>

          </div>

          <div className="leave-balance-card">

            <h3>
              Approved
            </h3>

            <div className="leave-remaining">

              <strong>
                {
                  approvedRequests.length
                }
              </strong>

              <span>
                requests
              </span>

            </div>

          </div>

          <div className="leave-balance-card">

            <h3>
              Rejected
            </h3>

            <div className="leave-remaining">

              <strong>
                {
                  rejectedRequests.length
                }
              </strong>

              <span>
                requests
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* LEAVE OVERVIEW */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Leave Overview
          </h2>

          <p>
            Your current leave entitlement
            and remaining days.
          </p>

        </div>

        <div className="leave-balance-grid">

          {leaveBalance.length >
          0 ? (

            leaveBalance.map(
              (leave) => (

                <div
                  className="leave-balance-card"
                  key={leave.id}
                >

                  <h3>
                    {leave.type}
                  </h3>

                  <div className="leave-remaining">

                    <strong>
                      {
                        leave.remaining
                      }
                    </strong>

                    <span>
                      days remaining
                    </span>

                  </div>

                  <div className="leave-summary">

                    <span>
                      Entitlement:{" "}
                      <strong>
                        {
                          leave.entitlement
                        }{" "}
                        days
                      </strong>
                    </span>

                    <span>
                      Used:{" "}
                      <strong>
                        {leave.used}{" "}
                        days
                      </strong>
                    </span>

                  </div>

                </div>

              )
            )

          ) : (

            <div className="empty-state">

              <p>
                No leave types found.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* UPCOMING LEAVE */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Upcoming Leave
          </h2>

          <p>
            Your approved and pending
            upcoming leave requests.
          </p>

        </div>

        {upcomingLeave.length >
        0 ? (

          <div className="leave-list">

            {upcomingLeave.map(
              (request) => {

                const startDate =
                  getRequestStartDate(
                    request
                  );

                const endDate =
                  getRequestEndDate(
                    request
                  );

                const days =
                  calculateDays(
                    startDate,
                    endDate
                  );

                const status =
                  getStatus(
                    request
                  );

                return (

                  <div
                    className="leave-row"
                    key={request.id}
                  >

                    <div className="leave-info">

                      <strong>
                        {getLeaveTypeName(
                          request
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          startDate
                        )}{" "}
                        —{" "}
                        {formatDate(
                          endDate
                        )}
                      </span>

                      <span>
                        Duration:{" "}
                        {days}{" "}
                        {days === 1
                          ? "day"
                          : "days"}
                      </span>

                      {request.reason && (
                        <span>
                          Reason:{" "}
                          {
                            request.reason
                          }
                        </span>
                      )}

                    </div>

                    <span
                      className={`status ${status.toLowerCase()}`}
                    >
                      {status}
                    </span>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="empty-state">

            <p>
              You have no upcoming
              leave requests.
            </p>

          </div>

        )}

      </section>

      {/* LEAVE HISTORY */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Leave History
          </h2>

          <p>
            A record of your previous
            leave.
          </p>

        </div>

        {previousLeave.length >
        0 ? (

          <div className="leave-list">

            {previousLeave.map(
              (request) => {

                const startDate =
                  getRequestStartDate(
                    request
                  );

                const endDate =
                  getRequestEndDate(
                    request
                  );

                const days =
                  calculateDays(
                    startDate,
                    endDate
                  );

                const status =
                  getStatus(
                    request
                  );

                return (

                  <div
                    className="leave-row"
                    key={request.id}
                  >

                    <div className="leave-info">

                      <strong>
                        {getLeaveTypeName(
                          request
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          startDate
                        )}{" "}
                        —{" "}
                        {formatDate(
                          endDate
                        )}
                      </span>

                      <span>
                        Duration:{" "}
                        {days}{" "}
                        {days === 1
                          ? "day"
                          : "days"}
                      </span>

                      {request.reason && (
                        <span>
                          Reason:{" "}
                          {
                            request.reason
                          }
                        </span>
                      )}

                    </div>

                    <span
                      className={`status ${status.toLowerCase()}`}
                    >
                      {status}
                    </span>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="empty-state">

            <p>
              No previous leave
              records found.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}

export default MyLeave;