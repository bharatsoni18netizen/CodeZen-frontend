import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    int a = 10
    cout << "Value: " << a
    return 0;
}`);
  const [language, setLanguage] = useState("cpp");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Save Code Vault States
  const [savedSnippets, setSavedSnippets] = useState([]);
  const [saveToast, setSaveToast] = useState("");
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Load saved snippets from localStorage on initial load
  useEffect(() => {
    const localData = localStorage.getItem("dev_engine_saved_codes");
    if (localData) {
      try {
        setSavedSnippets(JSON.parse(localData));
      } catch (e) {
        console.error("Failed to load saved snippets", e);
      }
    }
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setErrorMsg("");
    setCopied(false);

    try {
      const response = await fetch("https://dev-engine-backend.onrender.com/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = async () => {
    if (!question.trim()) {
      alert("Please enter a question or problem description!");
      return;
    }
    setLoading(true);
    setResult(null);
    setErrorMsg("");
    setCopied(false);

    try {
      const response = await fetch("https://dev-engine-backend.onrender.com/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setQuestion("");
    setResult(null);
    setErrorMsg("");
  };

  const getRenderCode = () => {
    if (!result) return "";
    return (
      result.cleanCode ||
      result.code ||
      result.correctedCode ||
      result.optimizedCode ||
      result.fixedCode ||
      (typeof result === "string" ? result : "")
    );
  };

  const codeToShow = getRenderCode();

  const handleCopy = () => {
    if (!codeToShow) return;
    navigator.clipboard.writeText(codeToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCode = () => {
    if (!codeToShow) {
      alert("Save karne ke liye pehle koi code screen par hona chahiye!");
      return;
    }

    const titlePrompt = prompt(
      "Snippet ka name / title enter karo:",
      `${language.toUpperCase()} Solution - ${new Date().toLocaleDateString()}`
    );
    if (!titlePrompt) return;

    const newSnippet = {
      id: Date.now(),
      title: titlePrompt,
      language: language,
      code: codeToShow,
      complexity: result?.complexity || "O(1)",
      date:
        new Date().toLocaleDateString() +
        " " +
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updated = [newSnippet, ...savedSnippets];
    setSavedSnippets(updated);
    localStorage.setItem("dev_engine_saved_codes", JSON.stringify(updated));

    setSaveToast("Saved to Vault! ✓");
    setTimeout(() => setSaveToast(""), 2000);
  };

  const handleDeleteSnippet = (id, e) => {
    e.stopPropagation();
    const filtered = savedSnippets.filter((item) => item.id !== id);
    setSavedSnippets(filtered);
    localStorage.setItem("dev_engine_saved_codes", JSON.stringify(filtered));
  };

  const handleLoadSnippet = (snippet) => {
    setLanguage(snippet.language);
    setResult({
      cleanCode: snippet.code,
      complexity: snippet.complexity,
      errors: []
    });
    setShowSavedModal(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>&lt;CodeZen /&gt;</h1>
          <p>Smart Code Optimizer & Bug Resolver</p>
        </div>
        <div className="badge-group">
          <button className="vault-btn" onClick={() => setShowSavedModal(true)}>
            📁 Saved Vault ({savedSnippets.length})
          </button>
          <span className="badge">Gemini-3.8-Flash</span>
          <span className="badge live">v1.1 Live</span>
        </div>
      </header>

      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === "analyze" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("analyze");
            setResult(null);
            setErrorMsg("");
          }}
        >
          🐞 Bug Fix & Optimize
        </button>
        <button
          className={`tab-btn ${activeTab === "solve" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("solve");
            setResult(null);
            setErrorMsg("");
          }}
        >
          ✨ Question to Code
        </button>
      </div>

      <div className="workspace">
        <div className="card">
          <div className="card-header">
            <h3>{activeTab === "analyze" ? "Raw Code Input" : "Describe Problem / Logic"}</h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="sql">SQL / MySQL</option>
            </select>
          </div>

          {activeTab === "analyze" ? (
            <textarea
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your source code here..."
              spellCheck="false"
            />
          ) : (
            <textarea
              className="code-editor"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Write a program to reverse a singly linked list in C++..."
              spellCheck="false"
            />
          )}

          <div className="btn-group-row">
            <button
              className="action-btn"
              disabled={loading}
              onClick={activeTab === "analyze" ? handleAnalyze : handleSolve}
            >
              {loading
                ? "⚙ AI Processing..."
                : activeTab === "analyze"
                ? "⚡ Analyze & Optimize"
                : "🚀 Generate Code"}
            </button>
            <button
              className="clear-btn"
              onClick={handleClear}
              disabled={loading}
              title="Clear input and output"
            >
              🗑 Clear
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Optimized AI Output</h3>
            {result?.complexity && (
              <span className="complexity-badge">
                Complexity: {result.complexity}
              </span>
            )}
          </div>

          <div className="output-area">
            {!result && !loading && !errorMsg && (
              <div className="placeholder-text">
                AI optimized result yahan live render hoga ...
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Gemini AI analyzing and generating clean code...</p>
              </div>
            )}

            {errorMsg && (
              <div className="error-box" style={{ borderColor: "#ef4444" }}>
                <h4>Error:</h4>
                <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errorMsg}
                </p>
              </div>
            )}

            {result && (
              <div className="result-content">
                {result.errors && result.errors.length > 0 && (
                  <div className="error-box">
                    <h4>Detected Issues:</h4>
                    <ul>
                      {result.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.explanation && (
                  <div className="explanation-box">
                    <h4>Logic Explanation:</h4>
                    <p>{result.explanation}</p>
                  </div>
                )}

                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span>Generated Clean Code</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="save-btn"
                        onClick={handleSaveCode}
                      >
                        {saveToast || "💾 Save Snippet"}
                      </button>
                      <button
                        className={`copy-btn ${copied ? "copied" : ""}`}
                        onClick={handleCopy}
                      >
                        {copied ? "Copied! ✓" : "📋 Copy"}
                      </button>
                    </div>
                  </div>
                  <pre className="code-preview">
                    <code>{codeToShow || "// No changes required"}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Snippets Modal */}
      {showSavedModal && (
        <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📁 Saved Code Vault</h2>
              <button className="close-btn" onClick={() => setShowSavedModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {savedSnippets.length === 0 ? (
                <p className="empty-vault-text">Abhi tak koi code save nahi kiya gaya hai.</p>
              ) : (
                <div className="snippets-list">
                  {savedSnippets.map((item) => (
                    <div key={item.id} className="snippet-card" onClick={() => handleLoadSnippet(item)}>
                      <div className="snippet-top">
                        <span className="snippet-lang-tag">{item.language.toUpperCase()}</span>
                        <span className="snippet-date">{item.date}</span>
                        <button className="snippet-del-btn" onClick={(e) => handleDeleteSnippet(item.id, e)}>🗑</button>
                      </div>
                      <h4 className="snippet-title">{item.title}</h4>
                      <pre className="snippet-preview-code">
                        <code>{item.code.substring(0, 100)}...</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;