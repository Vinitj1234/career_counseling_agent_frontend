import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const SUGGESTIONS = [
  "Analyze My Resume",
  "How do I switch careers into software engineering?",
  "What skills should a data scientist have?",
  
  "What are the highest-paying careers in 2025?",
  "How do I prepare for a technical interview?",
  "What certifications are worth pursuing in cloud computing?",
];

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="13" rx="3" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    <path d="M9.5 18c.8.7 4.2.7 5 0" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const NewChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

function parseMarkdown(md) {
  let html = md
    // Escape HTML special chars first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks ```lang\n...\n```
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trimEnd()}</code></pre>`
  );

  // Inline code `...`
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Horizontal rules --- or ***
  html = html.replace(/^[-*]{3,}\s*$/gm, "<hr/>");

  // Headings  ### ## #
  html = html.replace(/^#{1,6}\s+(.+)$/gm, (_, t, offset, str) => {
    const level = str.slice(offset).match(/^#+/)[0].length;
    return `<h${level}>${t}</h${level}>`;
  });

  // Bold **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a ?? b}</strong>`);

  // Italic *text* or _text_  (not inside words)
  html = html.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)|(?<!\w)_([^_\n]+)_(?!\w)/g,
    (_, a, b) => `<em>${a ?? b}</em>`);

  // Blockquote lines  > text
  html = html.replace(/^&gt;\s?(.*)$/gm, "<blockquote>$1</blockquote>");

  // Tables  | col | col |
  html = html.replace(/((?:^\|.+\|\s*\n)+)/gm, (block) => {
    const lines = block.trim().split("\n");
    if (lines.length < 2) return block;
    const isSep = (l) => /^\|[\s|:-]+\|$/.test(l.trim());
    const toRow = (l, tag) =>
      "<tr>" +
      l.replace(/^\||\|$/g, "").split("|").map((c) =>
        `<${tag}>${c.trim()}</${tag}>`
      ).join("") +
      "</tr>";
    let out = "<table>";
    let headerDone = false;
    for (let i = 0; i < lines.length; i++) {
      if (isSep(lines[i])) { out += "</thead><tbody>"; headerDone = true; continue; }
      out += !headerDone ? (i === 0 ? "<thead>" + toRow(lines[i], "th") : toRow(lines[i], "td"))
                         : toRow(lines[i], "td");
    }
    out += headerDone ? "</tbody>" : "";
    out += "</table>";
    return out;
  });

  // Unordered list items  - or *  (collect consecutive)
  html = html.replace(/((?:^[ \t]*[-*+]\s+.+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((l) =>
      `<li>${l.replace(/^[ \t]*[-*+]\s+/, "")}</li>`
    ).join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered list items  1. 2.
  html = html.replace(/((?:^[ \t]*\d+\.\s+.+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((l) =>
      `<li>${l.replace(/^[ \t]*\d+\.\s+/, "")}</li>`
    ).join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs: wrap double-newline-separated blocks that aren't already HTML
  html = html.replace(/\n{2,}/g, "\n\n");
  html = html.split("\n\n").map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (/^<(h[1-6]|ul|ol|li|table|pre|blockquote|hr)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");

  return html;
}

function MessageBubble({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`message-row ${isBot ? "bot-row" : "user-row"}`}>
      <div className={`avatar ${isBot ? "avatar-bot" : "avatar-user"}`}>
        {isBot ? <BotIcon /> : <UserIcon />}
      </div>
      <div className={`bubble ${isBot ? "bubble-bot" : "bubble-user"}`}>
        {msg.loading ? (
          <TypingDots />
        ) : isBot ? (
          <>
            <div
              className="bubble-md"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
            />
            <span className="bubble-time">{msg.time}</span>
          </>
        ) : (
          <>
            <span className="bubble-text">{msg.text}</span>
            <span className="bubble-time">{msg.time}</span>
          </>
        )}
      </div>
    </div>
  );
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

let sessionCounter = 1;

function createSession() {
  return {
    id: Date.now() + Math.random(),
    title: `New Conversation ${sessionCounter++}`,
    messages: [],
  };
}

export default function App() {
  const [sessions, setSessions] = useState(() => [createSession()]);
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeId]);

  function updateSession(id, updater) {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    if (activeSession.messages.length === 0) {
      updateSession(activeId, (s) => ({
        ...s,
        title: msg.slice(0, 38) + (msg.length > 38 ? "…" : ""),
      }));
    }

    const userMsg = { role: "user", text: msg, time: formatTime() };
    const placeholderId = `ph-${Date.now()}`;
    const botPlaceholder = { role: "bot", text: "", time: "", loading: true, id: placeholderId };

    updateSession(activeId, (s) => ({
      ...s,
      messages: [...s.messages, userMsg, botPlaceholder],
    }));

    try {
      const API_URL = import.meta.env.VITE_API_URL;

        const res = await axios.post(API_URL, {
          message: msg,
        });
      const botText = res.data.response ?? "No response received.";
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { role: "bot", text: botText, time: formatTime(), loading: false }
            : m
        ),
      }));
    } catch {
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? {
                role: "bot",
                text: "⚠️ Unable to connect to the backend server. Please try again in a few seconds.",
                time: formatTime(),
                loading: false,
              }
            : m
        ),
      }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function newChat() {
    const s = createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function deleteSession(id) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const s = createSession();
        setActiveId(s.id);
        return [s];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = activeSession.messages.length === 0;

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon"><BotIcon /></div>
            <span className="brand-name">CareerAI</span>
          </div>
          <button className="icon-btn" onClick={newChat} title="New chat">
            <NewChatIcon />
          </button>
        </div>

        <div className="sidebar-section-label">Recent Chats</div>

        <nav className="session-list">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${s.id === activeId ? "session-active" : ""}`}
              onClick={() => setActiveId(s.id)}
            >
              <span className="session-title">{s.title}</span>
              <button
                className="session-delete"
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                title="Delete conversation"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-badge">
            <StarIcon /> AI-Powered Career Advisor
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="main-area">

        {/* Topbar */}
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen((v) => !v)} title="Toggle sidebar">
            <MenuIcon />
          </button>
          <div className="topbar-center">
            <span className="topbar-title">AI Career Counselor</span>
            <span className="topbar-badge">Beta</span>
          </div>
          <button className="new-chat-btn" onClick={newChat}>
            <NewChatIcon /> New Chat
          </button>
        </header>

        {/* Messages */}
        <div className="messages-area">
          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-icon"><BotIcon /></div>
              <h2 className="welcome-heading">Your AI Career Counselor</h2>
              <p className="welcome-sub">
                Get personalized career advice, resume tips, interview prep, and job market insights — powered by AI.
              </p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {activeSession.messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="input-bar">
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about careers, skills, resume tips, interview prep…"
              value={input}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className={`send-btn ${input.trim() && !loading ? "send-active" : ""}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
