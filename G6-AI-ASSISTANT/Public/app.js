
"use strict";

const form = document.getElementById("chat-form");
const input = document.getElementById("question");
const sendButton = document.getElementById("send");
const historyBox = document.getElementById("chat-history");
const statusBox = document.getElementById("status");
const clearButton = document.getElementById("clear-chat");

let history = [];
let selectedTask = "auto";
let busy = false;

function addMessage(role, text, sources = []) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("strong");
  heading.textContent = role === "user" ? "You" : "G6 Assistant";

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
            source.version ? `Version: ${source.version}` : "",
            source.date ? `Date: ${source.date}` : ""
          ].filter(Boolean).join(" · ");
          sourceBox.appendChild(meta);
        }
      } catch {
        // Do not render malformed reference URLs.
      }
    }

    if (sourceBox.querySelector("a")) {
      article.appendChild(sourceBox);
    }
  }

  historyBox.appendChild(article);
  historyBox.scrollTop = historyBox.scrollHeight;
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  input.disabled = value;
  sendButton.textContent = value ? "Working..." : "Ask assistant →";
  statusBox.textContent = value
    ? "Reviewing available information..."
    : "Ready · Verify important conclusions";
}

async function submitQuestion(question) {
  if (busy || !question.trim()) return;

  const cleanQuestion = question.trim();

  if (cleanQuestion.length > 2000) {
    statusBox.textContent = "Please keep questions under 2,000 characters.";
    return;
  }

  const previousHistory = history.slice(-8);
  addMessage("user", cleanQuestion);
  history.push({ role: "user", content: cleanQuestion });
  input.value = "";
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: cleanQuestion,
        history: previousHistory,
        task: selectedTask
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "The assistant could not complete the request."
      );
    }

    const answer = typeof data.answer === "string"
      ? data.answer
      : "No answer was returned.";

    const sources = Array.isArray(data.sources) ? data.sources : [];

    addMessage("assistant", answer, sources);
    history.push({ role: "assistant", content: answer });
    history = history.slice(-8);

    statusBox.textContent = sources.length
      ? `${sources.length} reference(s) returned · Human review required`
      : "No references returned · Treat as assessment only";
  } catch (error) {
    addMessage(
      "assistant",
      `I couldn't complete the request. ${error.message} Please try again.`
    );
    statusBox.textContent = "Request failed";
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(input.value);
});

document.querySelectorAll("[data-task]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedTask = button.dataset.task;
    input.value = {
      triage: "Help me triage an IT requirement. Ask for any essential missing information.",
      decision: "Draft a decision paper using the standard staff-product format. Identify missing facts and assumptions.",
      architecture: "Conduct an initial architecture and modernization alignment review. Identify dependencies and required technical reviews.",
      governance: "Prepare a governance-board read-ahead, questions for principals, and a decision/action tracker.",
      exsum: "Draft an executive summary with a BLUF, key facts, risks, and next actions.",
      coa: "Compare feasible courses of action, including benefits, risks, resourcing, dependencies, and decision authority."
    }[selectedTask] || "";

    input.focus();
    statusBox.textContent =
      `Selected task: ${button.querySelector("strong").textContent}`;
  });
});

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
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

