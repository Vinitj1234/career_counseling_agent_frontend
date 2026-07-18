import { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const SUGGESTIONS = [
  {
    icon: "📄",
    label: "Analyze My Resume",
    sub: "Get roles, salary & growth roadmap",
    prompt: `Analyze my resume and give a full career analysis — no follow-up questions.\n\nName: Vinit Jadhav\nEducation: B.Tech CSE, MIT Academy of Engineering (2028)\nSkills: Java, Spring Boot, Hibernate, MySQL, REST APIs, React (Basic), Git, HTML, CSS\nProjects: Hospital Management System (Spring Boot + MySQL), AI Career Counseling Companion (IBM watsonx + Granite)\nInternship: IBM SkillsBuild Virtual Internship\nCertifications: IBM AI Fundamentals, Java Programming\nAchievements: 250+ LeetCode DSA problems, hackathons\nGoal: Java Full Stack Developer specializing in Spring Boot & Cloud\n\nProvide: best-fit roles, expected salary (India), skill gaps, top certifications, and a 6-month roadmap.`,
  },
  {
    icon: "💰",
    label: "Highest-Paying Careers in 2026",
    sub: "Top roles by salary worldwide",
    prompt: "What are the highest-paying careers in 2026? Include expected salaries, required skills, and growth outlook.",
  },
  {
    icon: "🛣️",
    label: "Java Full Stack Roadmap",
    sub: "Step-by-step learning path",
    prompt: "Give me a complete step-by-step roadmap to become a Java Full Stack Developer specializing in Spring Boot and cloud technologies. Include skills, tools, certifications, and timeline.",
  },
  {
    icon: "🎯",
    label: "Interview Prep Tips",
    sub: "Crack your next tech interview",
    prompt: "How do I prepare for a Java Spring Boot developer interview? Give me common questions, topics to study, and tips to stand out.",
  },
  {
    icon: "☁️",
    label: "Best Cloud Certifications",
    sub: "AWS, Azure, GCP — which to pick?",
    prompt: "What are the best cloud certifications for a Java developer in 2026? Compare AWS, Azure, and GCP certifications by difficulty, cost, and career value.",
  },
  {
    icon: "📈",
    label: "Skill Gap Analysis",
    sub: "What skills am I missing?",
    prompt: "I am a Java Spring Boot developer with 0-2 years of experience. What are the most important skill gaps I should fill in 2026 to land a senior role or higher salary? Be specific.",
  },
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

const SidebarToggleIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <path d="M15 18l-6-6 6-6" />   /* chevron left = close */
      : <path d="M9 18l6-6-6-6" />}     /* chevron right = open */
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

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RegenerateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

function TypingDots() {
  return (
    <div className="typing-dots" aria-label="thinking">
      <span /><span /><span />
    </div>
  );
}

function parseMarkdown(md) {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks — inject header with language label + copy button
  html = html.replace(/```([\w]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const label = lang || "code";
    const escaped = code.trimEnd();
    return `<div class="code-block"><div class="code-header"><span class="code-lang">${label}</span><button class="code-copy-btn" data-code="${escaped.replace(/"/g, "&quot;")}">Copy code</button></div><pre><code>${escaped}</code></pre></div>`;
  });

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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className={`msg-copy-btn ${copied ? "msg-copy-copied" : ""}`} onClick={handleCopy} title="Copy response">
      {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
    </button>
  );
}

function MessageBubble({ msg, onRegenerate }) {
  const isBot = msg.role === "bot";
  const contentRef = useRef(null);

  // Wire up code-block copy buttons after render
  useEffect(() => {
    if (!contentRef.current) return;
    const btns = contentRef.current.querySelectorAll(".code-copy-btn");
    btns.forEach((btn) => {
      btn.onclick = () => {
        const code = btn.getAttribute("data-code");
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "Copied!";
          btn.classList.add("code-copy-copied");
          setTimeout(() => { btn.textContent = "Copy code"; btn.classList.remove("code-copy-copied"); }, 2000);
        });
      };
    });
  });

  if (!isBot) {
    return (
      <div className="user-turn">
        <div className="user-bubble">
          <span className="bubble-text">{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-turn">
      <div className="bot-avatar"><BotIcon /></div>
      <div className="bot-content">
        {msg.loading ? (
          <TypingDots />
        ) : (
          <>
            <div
              ref={contentRef}
              className={`bubble-md${msg.fresh ? " bubble-fade-in" : ""}`}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
            />
            <div className={`bot-actions${msg.fresh ? " bubble-fade-in" : ""}`}>
              <CopyButton text={msg.text} />
              {onRegenerate && (
                <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate response">
                  <RegenerateIcon /> Regenerate
                </button>
              )}
              <span className="bubble-time">{msg.time}</span>
            </div>
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

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [sessions, setSessions] = useState(() => [createSession()]);
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null); // { name, text }
  const [fileLoading, setFileLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  // Keep-alive ping every 10 minutes so Render free tier stays warm
  useEffect(() => {
    const ping = () => axios.get(API_URL.replace("/api/chat", "/actuator/health")).catch(() => {});
    ping(); // ping immediately on mount
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const messagesAreaRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  // Only smooth-scroll when a new message is actually added
  useEffect(() => {
    const msgs = activeSession?.messages ?? [];
    const prev = prevMsgCountRef.current;
    prevMsgCountRef.current = msgs.length;

    if (msgs.length <= prev) return; // switched chat or no new message

    const el = messagesAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeSession?.messages?.length, activeId]);

  function updateSession(id, updater) {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setFileLoading(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      setAttachedFile({ name: file.name, text });
      inputRef.current?.focus();
    } catch {
      alert("Could not read file. Please try a different PDF or text file.");
    } finally {
      setFileLoading(false);
    }
  }

  async function sendMessage(text) {
    const baseMsg = (text ?? input).trim();
    const currentFile = attachedFile; // capture before clearing
    const msg = currentFile
      ? `[Resume attached: ${currentFile.name}]\n\n${currentFile.text}\n\n${baseMsg || "Analyze my resume above and give a full career analysis — roles, salary, skill gaps, certifications, and a 6-month roadmap."}`
      : baseMsg;
    if (!msg || loading) return;
    setInput("");
    setAttachedFile(null);
    setLoading(true);
    setServerStatus("waking");

    if (activeSession.messages.length === 0) {
      updateSession(activeId, (s) => ({
        ...s,
        title: (currentFile ? `📄 ${currentFile.name}` : baseMsg).slice(0, 38),
      }));
    }

    // Show a clean label in the chat bubble instead of the full raw PDF dump
    const displayText = currentFile
      ? `📄 ${currentFile.name}${baseMsg ? `\n\n${baseMsg}` : ""}`
      : msg;
    const userMsg = { role: "user", text: displayText, time: formatTime() };
    const placeholderId = `ph-${Date.now()}`;
    const botPlaceholder = { role: "bot", text: "", time: "", loading: true, id: placeholderId };

    updateSession(activeId, (s) => ({
      ...s,
      messages: [...s.messages, userMsg, botPlaceholder],
    }));

    try {
      const res = await axios.post(API_URL, { message: msg });
      const botText = res.data.response ?? "No response received.";
      setServerStatus("ready");

      // Render full formatted response immediately with a fade-in
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { role: "bot", text: botText, time: formatTime(), loading: false, fresh: true }
            : m
        ),
      }));
    } catch {
      setServerStatus("idle");
      updateSession(activeId, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? {
                role: "bot",
                text: "⚠️ Unable to connect to the server. Please check your connection and try again.",
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
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">
              <UserIcon />
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">Guest User</span>
              <span className="sidebar-profile-status">● Online</span>
            </div>
          </div>
          <div className="sidebar-footer-badge">
            <StarIcon /> AI-Powered Career Advisor
          </div>
        </div>
        {/* Sidebar edge toggle — ChatGPT style */}
        <button
          className="sidebar-edge-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <SidebarToggleIcon open={sidebarOpen} />
        </button>
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
        <div className="messages-area" ref={messagesAreaRef}>
          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-icon"><BotIcon /></div>
              <h2 className="welcome-heading">Your AI Career Counselor</h2>
              <p className="welcome-sub">
                Get personalized career advice, resume tips, interview prep, and job market insights — powered by AI.
              </p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} className="suggestion-chip" onClick={() => sendMessage(s.prompt)}>
                    <span className="chip-icon">{s.icon}</span>
                    <span className="chip-body">
                      <span className="chip-label">{s.label}</span>
                      <span className="chip-sub">{s.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {activeSession.messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  onRegenerate={
                    msg.role === "bot" && !msg.loading && i === activeSession.messages.length - 1
                      ? () => {
                          const lastUser = [...activeSession.messages].reverse().find((m) => m.role === "user");
                          if (lastUser) sendMessage(lastUser.text);
                        }
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="input-bar">
          {/* Attached file chip */}
          {attachedFile && (
            <div className="file-chip">
              <span className="file-chip-icon">📄</span>
              <span className="file-chip-name">{attachedFile.name}</span>
              <button className="file-chip-remove" onClick={() => setAttachedFile(null)} title="Remove file">
                <XIcon />
              </button>
            </div>
          )}
          <div className="input-wrap">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              className={`attach-btn ${fileLoading ? "attach-loading" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || fileLoading}
              title="Attach PDF or TXT resume"
            >
              {fileLoading ? <span className="attach-spinner" /> : <PaperclipIcon />}
            </button>
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={attachedFile ? "Add a message or just hit send to analyze…" : "Ask about careers, or attach your resume PDF…"}
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
              className={`send-btn ${(input.trim() || attachedFile) && !loading ? "send-active" : ""}`}
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !attachedFile) || loading}
              title="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line · PDF/TXT supported</p>
        </div>
      </main>
    </div>
  );
}
