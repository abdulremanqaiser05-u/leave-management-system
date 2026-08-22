import React, { useState } from "react";

function Settings() {
  const [settings, setSettings] = useState({
    name: "Abdul Rehman",
    email: "abdul@example.com",
    notifications: true,
    emailUpdates: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem("userSettings", JSON.stringify(settings));

    alert("Settings saved successfully.");
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and notification preferences.</p>
        </div>
      </div>

      <section className="leave-section">
        <div className="section-heading">
          <h2>Account Settings</h2>
          <p>Update your basic account information.</p>
        </div>

        <div className="leave-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>

              <input
                type="text"
                id="name"
                name="name"
                value={settings.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <input
                type="email"
                id="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
              />
            </div>

            <div className="section-heading">
              <h2>Notifications</h2>
              <p>Choose how you want to receive updates.</p>
            </div>

            <label>
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
              />
              Enable notifications
            </label>

            <label>
              <input
                type="checkbox"
                name="emailUpdates"
                checked={settings.emailUpdates}
                onChange={handleChange}
              />
              Receive email updates
            </label>

            <button type="submit" className="primary-button">
              Save Settings
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Settings;