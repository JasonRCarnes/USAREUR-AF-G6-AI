
"use strict";

// ==========================================
// G6 AI INFORMATION ASSISTANT
// Frontend application
// ==========================================

// Configure this when your backend is deployed.
// Example: https://your-backend.example.com/api/chat
const API_URL = window.G6_API_URL || "/api/chat";

const form = document.getElementById("chat-form");
const input = document.getElementById("question");
const sendButton = document.getElementById("send");
const historyBox = document.getElementById("chat-history");
const statusBox = document.getElementById("status");
const clearButton = document.getElementById("clear-chat");

let history = [];
let selectedTask = "auto";
let busy = false;

// ==========================================
// TASK PROMPTS
// ==========================================

const taskPrompts = {
  triage:
    "Help me triage an IT requirement. Ask for any essential missing information.",

  decision:
    "Draft a decision paper using the standard staff-product format. Identify missing facts and assumptions.",

  architecture:
    "Conduct an initial architecture and modernization alignment review. Identify dependencies and required technical reviews.",

  governance:
    "Prepare a governance-board read-ahead, questions for principals, and a decision/action tracker.",

  exsum:
    "Draft an executive summary with a BLUF, key facts, risks, and next actions.",

  coa:
    "Compare feasible courses of action, including benefits, risks, resourcing, dependencies, and decision authority."
};

// ==========================================
// MESSAGE DISPLAY
// ==========================================

function addMessage(role, text, sources = []) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("strong");
  heading.textContent =
    role === "user" ? "You" : "G6 Assistant";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  article.append(heading, paragraph);

  if (role === "assistant" && sources.length) {
    const sourceBox = document.createElement("div");
    sourceBox.className = "sources";

    const label = document.createElement("strong");
    label.textContent = "References";

    sourceBox.appendChild(label);

    for (const source of sources) {
      try {
        const url = new URL(source.url);

        if (url.protocol !== "https:") continue;

        const link = document.createElement("a");

        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.title || url.hostname;

        sourceBox.appendChild(link);

        if (source.version || source.date || source.owner) {
          const meta = document.createElement("small");

          meta.className = "source-meta";

          meta.textContent = [
            source.owner,
            source.version
              ? `Version: ${source.version}`
              : "",
            source.date
              ? `Date: ${source.date}`
              : ""
          ].filter(Boolean).join(" · ");

          sourceBox.appendChild(meta);
        }

      } catch {
        // Ignore invalid reference URLs.
      }
    }

    if (sourceBox.querySelector("a")) {
      article.appendChild(sourceBox);
    }
  }

  historyBox.appendChild(article);
  historyBox.scrollTop = historyBox.scrollHeight;
}

// ==========================================
// APPLICATION STATUS
// ==========================================

function setBusy(value) {
  busy = value;

  sendButton.disabled = value;
  input.disabled = value;

  sendButton.textContent = value
    ? "Working..."
    : "Ask assistant →";

  statusBox.textContent = value
    ? "Reviewing available information..."
    : "Ready · Verify important conclusions";
}

// ==========================================
// CHAT REQUEST
// ==========================================

async function submitQuestion(question) {

  if (busy || !question.trim()) return;

  const cleanQuestion = question.trim();

  if (cleanQuestion.length > 2000) {
    statusBox.textContent =
      "Please keep questions under 2,000 characters.";
    return;
  }

  addMessage("user", cleanQuestion);

  // Include the latest user message in the request history.
  const requestHistory = [
    ...history,
    { role: "user", content: cleanQuestion }
  ].slice(-8);

  history.push({
    role: "user",
    content: cleanQuestion
  });

  input.value = "";

  setBusy(true);

  try {

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        question: cleanQuestion,
        history: requestHistory,
        task: selectedTask
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        `Server error (${response.status}).`
      );
    }

    const answer =
      typeof data.answer === "string"
        ? data.answer
        : "No answer was returned.";

    const sources =
      Array.isArray(data.sources)
        ? data.sources
        : [];

    addMessage("assistant", answer, sources);

    history.push({
      role: "assistant",
      content: answer
    });

    history = history.slice(-8);

    statusBox.textContent = sources.length
      ? `${sources.length} reference(s) returned · Human review required`
      : "No references returned · Treat as assessment only";

  } catch (error) {

    console.error("G6 Assistant request failed:", error);

    let message;

    if (error instanceof TypeError) {
      message =
        "Unable to reach the AI service. Check the backend URL, network connection, and server availability.";
    } else {
      message = error.message;
    }

    addMessage(
      "assistant",
      `Request unsuccessful: ${message}`
    );

    statusBox.textContent = "Request failed";

  } finally {

    setBusy(false);
    input.focus();

  }
}

// ==========================================
// FORM SUBMISSION
// ==========================================

form.addEventListener("submit", (event) => {

  event.preventDefault();

  submitQuestion(input.value);

});

// ==========================================
// TASK SELECTION
// ==========================================

document.querySelectorAll("[data-task]").forEach((button) => {

  button.addEventListener("click", () => {

    const task = button.dataset.task;

    if (!taskPrompts[task]) return;

    selectedTask = task;

    input.value = taskPrompts[task];

    input.focus();

    statusBox.textContent =
      `Selected task: ${
        button.querySelector("strong").textContent
      }`;

  });

});

// ==========================================
// NEW CHAT
// ==========================================

clearButton.addEventListener("click", () => {

  if (busy) return;

  history = [];
  selectedTask = "auto";

  historyBox.replaceChildren();

  addMessage(
    "assistant",
    "New conversation. What would you like help with?"
  );

  statusBox.textContent = "New conversation";

  input.value = "";

  input.focus();

});

// ==========================================
// ENTER TO SEND
// SHIFT + ENTER FOR NEW LINE
// ==========================================

input.addEventListener("keydown", (event) => {

  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {

    event.preventDefault();

    form.requestSubmit();

  }

});

// ==========================================
// INITIALIZATION
// ==========================================

if (
  !form ||
  !input ||
  !sendButton ||
  !historyBox ||
  !statusBox ||
  !clearButton
) {
  console.error(
    "G6 Assistant initialization failed: Required HTML elements are missing."
  );
}
