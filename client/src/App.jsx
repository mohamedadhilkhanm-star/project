import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

function App() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    invalid: 0,
    alerts: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const [historyResponse, statsResponse] =
        await Promise.all([
          axios.get(`${API}/dns/history`),
          axios.get(`${API}/dns/stats`)
        ]);

      setHistory(historyResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (err) {
      setError(
        "Cannot connect to backend. Check whether the server is running."
      );
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analyzeDomain = async (e) => {
    e.preventDefault();

    if (!domain.trim()) {
      setError("Please enter a domain name.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/dns/analyze`,
        { domain }
      );

      setResult(response.data.data);
      setDomain("");
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteQuery = async (id) => {
    if (!window.confirm("Delete this query?")) return;

    try {
      await axios.delete(`${API}/dns/${id}`);
      await loadDashboard();

      if (result?._id === id) {
        setResult(null);
      }
    } catch (err) {
      setError("Unable to delete query.");
    }
  };

  const updateNote = async (item) => {
    const note = window.prompt(
      "Enter a note:",
      item.note || ""
    );

    if (note === null) return;

    try {
      await axios.patch(`${API}/dns/${item._id}`, {
        note
      });

      await loadDashboard();
    } catch (err) {
      setError("Unable to update note.");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="app">

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">DNS</div>
          <div>
            <h2>DNS Analyzer</h2>
            <p>Domain Validation & Network Analysis</p>
          </div>
        </div>

        <div className="server-status">
          <span className="status-dot"></span>
          System Dashboard
        </div>
      </header>

      <main className="container">

        <section className="welcome">
          <div>
            <span className="eyebrow">NETWORK INTELLIGENCE</span>
            <h1>DNS Query Analysis System</h1>
            <p>
              Validate domains, analyze DNS records and
              identify unusual query patterns.
            </p>
          </div>
        </section>

        {/* Statistics */}

        <section className="stats-grid">

          <StatCard
            title="Total Queries"
            value={stats.total}
            symbol="T"
          />

          <StatCard
            title="Successful"
            value={stats.successful}
            symbol="S"
          />

          <StatCard
            title="Failed"
            value={stats.failed}
            symbol="F"
          />

          <StatCard
            title="Invalid Domains"
            value={stats.invalid}
            symbol="I"
          />

          <StatCard
            title="Security Alerts"
            value={stats.alerts}
            symbol="!"
          />

        </section>

        {/* Domain Input */}

        <section className="panel analyzer-panel">

          <div className="section-heading">
            <div>
              <h2>Domain Analysis</h2>
              <p>Enter a domain to validate and analyze.</p>
            </div>
            <span className="tag">REGEX + DNS</span>
          </div>

          <form onSubmit={analyzeDomain} className="search-form">

            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (example.com)"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Domain"}
            </button>

          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

        </section>

        {/* Analysis Result */}

        {result && (
          <section className="panel result-panel">

            <div className="section-heading">
              <div>
                <h2>Analysis Result</h2>
                <p>Domain: {result.domain}</p>
              </div>

              <span
                className={`badge ${result.status.toLowerCase()}`}
              >
                {result.status}
              </span>
            </div>

            <div className="result-info">
              <div>
                <span>Domain Validation</span>
                <strong>
                  {result.isValid ? "VALID" : "INVALID"}
                </strong>
              </div>

              <div>
                <span>DNS Status</span>
                <strong>{result.status}</strong>
              </div>

              <div>
                <span>Security Alert</span>
                <strong>
                  {result.alert ? "Detected" : "None"}
                </strong>
              </div>
            </div>

            <p className="result-message">
              {result.message}
            </p>

            {result.alert && (
              <div className="alert-message">
                Repeated DNS lookup failures detected
                for this domain.
              </div>
            )}

            <h3>DNS Records</h3>

            {result.records?.length > 0 ? (
              <div className="record-list">
                {result.records.map((record, index) => (
                  <div className="record-item" key={index}>
                    <strong>{record.type}</strong>
                    <pre>
                      {JSON.stringify(
                        record.values,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                No DNS records available.
              </p>
            )}

          </section>
        )}

        {/* History */}

        <section className="panel history-panel">

          <div className="section-heading">
            <div>
              <h2>DNS Query History</h2>
              <p>Previously analyzed domains.</p>
            </div>

            <button
              className="refresh-button"
              onClick={loadDashboard}
            >
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              No queries yet. Analyze your first domain.
            </div>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Validation</th>
                    <th>Status</th>
                    <th>Alert</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>

                      <td>
                        <strong>{item.domain}</strong>
                        {item.note && (
                          <small className="note">
                            Note: {item.note}
                          </small>
                        )}
                      </td>

                      <td>
                        {item.isValid ? "Valid" : "Invalid"}
                      </td>

                      <td>
                        <span
                          className={`badge ${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {item.alert ? "Yes" : "No"}
                      </td>

                      <td>{formatDate(item.createdAt)}</td>

                      <td>
                        <div className="actions">
                          <button
                            className="edit-button"
                            onClick={() => updateNote(item)}
                          >
                            Note
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => deleteQuery(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

        </section>

        <footer>
          <p>
            DNS Query Analysis System | React + Node.js +
            Express + MongoDB
          </p>
        </footer>

      </main>
    </div>
  );
}

function StatCard({ title, value, symbol }) {
  return (
    <div className="stat-card">
      <div className="stat-symbol">{symbol}</div>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default App;