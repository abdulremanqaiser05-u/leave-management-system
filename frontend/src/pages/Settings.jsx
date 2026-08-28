import React, { useEffect, useState } from "react";

function Settings() {
  const [settings, setSettings] = useState({
    name: "",
    email: "",
    notifications: true,
    emailUpdates: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // =========================================
  // LOAD SAVED SETTINGS
  // =========================================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedSettings =
      localStorage.getItem("userSettings");

    try {
      const user = savedUser
        ? JSON.parse(savedUser)
        : null;

      const notificationSettings =
        savedSettings
          ? JSON.parse(savedSettings)
          : {};

      setSettings({
        name: user?.name || "",
        email: user?.email || "",
        notifications:
          notificationSettings.notifications ??
          true,
        emailUpdates:
          notificationSettings.emailUpdates ??
          true,
      });
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );
    }
  }, []);

  // =========================================
  // HANDLE INPUT CHANGES
  // =========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMessage("");
  };

  // =========================================
  // SAVE SETTINGS
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const token =
        localStorage.getItem("authToken");

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const savedUser =
        localStorage.getItem("user");

      const user = savedUser
        ? JSON.parse(savedUser)
        : null;

      if (!user?.id) {
        throw new Error(
          "Unable to identify the logged-in user."
        );
      }

      // ---------------------------------------
      // UPDATE USER IN POSTGRESQL
      // ---------------------------------------

      const response = await fetch(
        `https://ruin-sorrowful-hippopotamus.abasthan.app/api/users/${user.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: settings.name.trim(),
            email: settings.email.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update account settings."
        );
      }

      // ---------------------------------------
      // SAVE NOTIFICATION SETTINGS
      // ---------------------------------------

      localStorage.setItem(
        "userSettings",
        JSON.stringify({
          notifications:
            settings.notifications,
          emailUpdates:
            settings.emailUpdates,
        })
      );

      // ---------------------------------------
      // UPDATE LOGGED-IN USER
      // ---------------------------------------

      const updatedUser = {
        ...user,
        name: data.name,
        email: data.email,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setSettings((previous) => ({
        ...previous,
        name: data.name,
        email: data.email,
      }));

      setMessage(
        "Settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );

      setMessage(
        error.message ||
          "Failed to save settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="settings-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1>
            Settings
          </h1>

          <p>
            Manage your account and
            notification preferences.
          </p>

        </div>

      </div>

      {/* ACCOUNT SETTINGS */}

      <section className="leave-section">

        <div className="section-heading">

          <h2>
            Account Settings
          </h2>

          <p>
            Update your basic account
            information.
          </p>

        </div>

        <div className="leave-form-card">

          <form onSubmit={handleSubmit}>

            {/* FULL NAME */}

            <div className="form-group">

              <label htmlFor="name">
                Full Name
              </label>

              <input
                type="text"
                id="name"
                name="name"
                value={settings.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />

            </div>

            {/* NOTIFICATIONS */}

            <div
              className="section-heading"
              style={{
                marginTop: "30px",
              }}
            >

              <h2>
                Notifications
              </h2>

              <p>
                Choose how you want to
                receive updates.
              </p>

            </div>

            {/* ENABLE NOTIFICATIONS */}

            <div className="settings-option">

              <label>

                <input
                  type="checkbox"
                  name="notifications"
                  checked={
                    settings.notifications
                  }
                  onChange={handleChange}
                />

                <span>
                  Enable notifications
                </span>

              </label>

              <p>
                Receive notifications
                about your leave requests.
              </p>

            </div>

            {/* EMAIL UPDATES */}

            <div className="settings-option">

              <label>

                <input
                  type="checkbox"
                  name="emailUpdates"
                  checked={
                    settings.emailUpdates
                  }
                  onChange={handleChange}
                />

                <span>
                  Receive email updates
                </span>

              </label>

              <p>
                Receive important leave
                updates by email.
              </p>

            </div>

            {/* SUCCESS / ERROR MESSAGE */}

            {message && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 15px",
                  borderRadius: "8px",
                  background:
                    message.includes(
                      "successfully"
                    )
                      ? "#dcfce7"
                      : "#fee2e2",
                  color:
                    message.includes(
                      "successfully"
                    )
                      ? "#166534"
                      : "#b91c1c",
                }}
              >
                {message}
              </div>
            )}

            {/* SAVE BUTTON */}

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{
                marginTop: "20px",
              }}
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>

          </form>

        </div>

      </section>

    </div>
  );
}

export default Settings;