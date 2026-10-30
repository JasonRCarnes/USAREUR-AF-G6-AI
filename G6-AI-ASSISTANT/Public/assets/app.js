"use strict";

// =========================================================
// USAREUR-AF G6 ENTERPRISE PORTAL (MOCK AI + LIVE FALLBACK)
// =========================================================

// Optional live backend endpoint. When unset, runs in Mock AI mode.
const API_URL = window.G6_API_URL || "";

// 1. G6 Functional Divisions Data
const g6Departments = [
  {
    code: "NETOPS",
    name: "Network Operations (DODIN-A)",
    desc: "Theater transport, boundary monitoring, maintenance windows, and service outage reporting.",
    prompt: "Provide an unclassified checklist for triaging a theater network transport outage and escalating through NETOPS."
  },
  {
    code: "CYBER / RMF",
    name: "Cybersecurity & Information Assurance",
    desc: "eMASS authorization packages, STIG/SCAP compliance, spillage containment, and IAVM tracking.",
    prompt: "Outline the step-by-step unclassified process for registering an eMASS RMF package toward an Authority to Operate (ATO)."
  },
  {
    code: "C4 / SATCOM",
    name: "Tactical Communications & SATCOM",
    desc: "SAR/GAR satellite bandwidth requests, COMSEC/KMI key management, and tactical radio deconfliction.",
    prompt: "How do I prepare a Satellite Access Request (SAR) and Gateway Access Request (GAR) for an upcoming theater exercise?"
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise Systems & Cloud Services",
    desc: "Mission application hosting, PPSM firewall port exceptions, and directory services coordination.",
    prompt: "What information is required to submit a Ports, Protocols, and Services Management (PPSM) firewall exception package?"
  },
  {
    code: "PLANS & ARCH",
    name: "Plans, Architecture & Modernization",
    desc: "C4ISR modernization alignment, coalition interoperability planning, and technical architecture reviews.",
    prompt: "Conduct an initial architecture and modernization alignment review for a new theater C2 capability."
  },
  {
    code: "GOVERNANCE",
    name: "IT Governance & Resources",
    desc: "Configuration Control Boards (CCB), IT investment validation, decision papers, and charter tracking.",
    prompt: "Prepare a Configuration Control Board (CCB) read-ahead, principal questions, and decision tracker."
  },
  {
    code: "DATA & AI",
    name: "Information Management & Analytics",
    desc: "Knowledge management portals, CUI marking standards, executive dashboards, and AI staff workflows.",
    prompt: "Summarize standard DoD Controlled Unclassified Information (CUI) marking and distribution guidance."
  },
  {
    code: "SERVICE DESK",
    name: "Service Management & User Support",
    desc: "NIPR/SIPR account onboarding workflows, DD Form 2875 SAAR validation, and smartcard/token support.",
    prompt: "What are the prerequisites and forms required to onboard a new user for NIPRNet and SIPRNet access?"
  }
];

// 2. Staff Task Prompts
const taskPrompts = {
  triage:
    "Help me triage an IT requirement. Ask for any essential missing information and recommend which G6 division owns the action.",
  decision:
    "Draft a decision paper using standard military staff-product format (Issue, Facts, Assumptions, COAs, Risk, Recommendation).",
  architecture:
    "Conduct an initial architecture and modernization alignment review. Identify PPSM, RMF, and transport dependencies.",
  governance:
    "Prepare a governance-board read-ahead, questions for principals, and a decision/action tracker.",
  exsum:
    "Draft an executive summary (EXSUM) with a BLUF, key facts, operational risks, and next actions.",
  coa:
    "Compare three feasible courses of action (Status Quo, Incremental Upgrade, Full Modernization), including benefits, risks, and resourcing."
};

// 3. Knowledge Base Entries (Used for both Knowledge Center & Mock AI Engine)
const knowledgeBase = [
  {
    id: "KB-01",
    division: "C4 / SATCOM",
    title: "SATCOM SAR / GAR Submission Workflow",
    keywords: ["satcom", "sar", "gar", "satellite", "bandwidth", "step", "tactical", "radio"],
    summary:
      "1. Validate terminal type, frequency band, and mission window.\n2. Submit Satellite Access Request (SAR) via JIST at least 30 days prior to exercise start.\n3. Coordinate Gateway Access Authorization (GAA) with the theater STEP site prior to transmission.",
    reference: "G6 C4 Tactical Communications SOP (Unclassified Demonstration)"
  },
  {
    id: "KB-02",
    division: "CYBER / RMF",
    title: "Classified Spillage & Cyber Incident Containment",
    keywords: ["spill", "spillage", "incident", "cyber", "breach", "contain", "isolate", "csoc"],
    summary:
      "1. DO NOT power off the affected workstation (preserves volatile memory).\n2. Physically disconnect network cables and disable wireless interfaces.\n3. Secure the physical area and notify your unit ISSM and Theater Cyber Operations Desk immediately.\n4. Document workstation asset tags and timeline on the incident worksheet.",
    reference: "CJCSI 6510.01 / Theater Cyber Incident Response Guide"
  },
  {
    id: "KB-03",
    division: "ENTERPRISE",
    title: "PPSM Firewall Port & Protocol Exemption",
    keywords: ["firewall", "port", "ppsm", "protocol", "exemption", "acl", "boundary", "ip"],
    summary:
      "1. Verify port/protocol alignment against the DISA PPSM Category Assurance List (CAL).\n2. Document source/destination IPs, directionality, transport protocol (TCP/UDP), and mission justification.\n3. Obtain ISSM cybersecurity endorsement and submit to G6 Enterprise Boundary Management.",
    reference: "DoDI 8551.01 / G6 Boundary Protection Standard"
  },
  {
    id: "KB-04",
    division: "CYBER / RMF",
    title: "eMASS RMF Authority to Operate (ATO) Package",
    keywords: ["rmf", "ato", "emass", "stig", "scap", "authorization", "security", "ia"],
    summary:
      "1. Categorize system impact level and register record in eMASS.\n2. Apply applicable DISA STIGs and upload SCAP/vulnerability scan artifacts.\n3. Develop Plan of Action and Milestones (POA&M) for open findings.\n4. Submit package to the Security Control Assessor (SCA) for Authorizing Official (AO) review.",
    reference: "DoDI 8510.01 Risk Management Framework (RMF)"
  },
  {
    id: "KB-05",
    division: "C4 / SATCOM",
    title: "COMSEC & KMI Cryptographic Key Requests",
    keywords: ["comsec", "crypto", "kmi", "skl", "key", "custodian", "da 1687"],
    summary:
      "1. Verify valid COMSEC Custodian appointment on DA Form 1687.\n2. Submit key requests via Key Management Infrastructure (KMI) at least 14 days prior to mission execution.\n3. Ensure Two-Person Integrity (TPI) procedures are enforced for all physical fill operations.",
    reference: "AR 380-40 / Theater COMSEC Management SOP"
  },
  {
    id: "KB-06",
    division: "SERVICE DESK",
    title: "NIPRNet / SIPRNet Account Onboarding (DD Form 2875)",
    keywords: ["account", "nipr", "sipr", "token", "saar", "2875", "password", "cac", "onboarding"],
    summary:
      "1. Complete DD Form 2875 (System Authorization Access Request) with supervisor and security manager signatures.\n2. Attach current DoD Cyber Awareness Challenge certificate (within 365 days).\n3. For SIPRNet, verify active Secret clearance in DISS and complete PKI token issuance appointment.",
    reference: "AR 25-2 / Enterprise Service Desk Onboarding Guide"
  }
];

// 4. Governance Tracker Sample Rows
const trackerItems = [
  { id: "G6-2026-104", div: "PLANS & ARCH", title: "Theater Tactical Mesh Network Modernization", stage: "Architecture Review", status: "In Progress" },
  { id: "G6-2026-108", div: "CYBER / RMF", title: "Coalition Mission Partner Portal eMASS ATO Renewal", stage: "SCA Validation", status: "On Track" },
  { id: "G6-2026-112", div: "ENTERPRISE", title: "Logistics Data Service PPSM Boundary Exception", stage: "ISSM Endorsement", status: "Pending Review" },
  { id: "G6-2026-119", div: "C4 / SATCOM", title: "Exercise Dynamic Front SATCOM SAR/GAR Allocation", stage: "STEP Coordination", status: "Approved" },
  { id: "G6-2026-125", div: "GOVERNANCE", title: "Q1 Configuration Control Board (CCB) Charter Update", stage: "Directorate Staffing", status: "On Track" }
];

// =========================================================
// VIEW NAVIGATION & INITIALIZATION
// =========================================================

let history = [];
let selectedTask = "auto";
let busy = false;

const viewTitles = {
  dashboard: "Enterprise Command Overview",
  workspaces: "G6 Functional Division Workspaces",
  assistant: "G6 AI Central Assistant",
  documents: "Staff Product & Template Generator",
  knowledge: "G6 SOP & Practical Workflow Directory",
  tracker: "Governance & Action Tracker",
  about: "System Architecture & Security Scope"
};

function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `view-${viewName}`);
  });

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === viewName);
  });

  const titleEl = document.getElementById("page-title");
  if (titleEl && viewTitles[viewName]) {
    titleEl.textContent = viewTitles[viewName];
  }

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("open");
}

function renderDepartments() {
  const dashGrid = document.getElementById("dashboard-dept-grid");
  const fullGrid = document.getElementById("full-dept-grid");

  const buildCard = (dept) => {
    const card = document.createElement("div");
    card.className = "dept-card";
    card.innerHTML = `
      <div>
        <div class="dept-header">
          <span class="dept-code">${dept.code}</span>
        </div>
        <h4>${dept.name}</h4>
        <p>${dept.desc}</p>
      </div>
      <div class="dept-actions">
        <button class="secondary ask-dept-btn" type="button">Ask Division AI →</button>
      </div>
    `;
    card.querySelector(".ask-dept-btn").addEventListener("click", () => {
      switchView("assistant");
      const input = document.getElementById("question");
      input.value = dept.prompt;
      input.focus();
      submitQuestion(dept.prompt);
    });
    return card;
  };

  if (dashGrid) {
    dashGrid.replaceChildren(...g6Departments.slice(0, 4).map(buildCard));
  }
  if (fullGrid) {
    fullGrid.replaceChildren(...g6Departments.map(buildCard));
  }
}

function renderKnowledgeBase(filterText = "") {
  const kbGrid = document.getElementById("kb-grid");
  if (!kbGrid) return;

  const clean = filterText.trim().toLowerCase();
  const filtered = knowledgeBase.filter(
    (item) =>
      !clean ||
      item.title.toLowerCase().includes(clean) ||
      item.division.toLowerCase().includes(clean) ||
      item.keywords.some((k) => k.includes(clean))
  );

  kbGrid.replaceChildren(
    ...filtered.map((item) => {
      const card = document.createElement("div");
      card.className = "dept-card";
      card.innerHTML = `
        <div>
          <div class="dept-header">
            <span class="dept-code">${item.division}</span>
            <small class="muted">${item.id}</small>
          </div>
          <h4>${item.title}</h4>
          <p style="white-space: pre-line; margin-top: 6px;">${item.summary}</p>
        </div>
        <div class="dept-actions">
          <small class="muted">${item.reference}</small>
        </div>
      `;
      return card;
    })
  );
}

function renderTracker() {
  const tbody = document.getElementById("tracker-tbody");
  if (!tbody) return;

  tbody.replaceChildren(
    ...trackerItems.map((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${row.id}</strong></td>
        <td><span class="dept-code">${row.div}</span></td>
        <td>${row.title}</td>
        <td>${row.stage}</td>
        <td><span class="badge badge-green">${row.status}</span></td>
      `;
      return tr;
    })
  );
}

// =========================================================
// MOCK AI ENGINE & CHAT INTERFACE
// =========================================================

function generateMockResponse(question, task) {
  const q = question.toLowerCase();

  // 1. Check if a structured staff task matches
  if (task === "exsum" || q.includes("exsum") || q.includes("executive summary")) {
    return {
      answer:
        "UNCLASSIFIED // PUBLIC PROTOTYPE — EXECUTIVE SUMMARY (EXSUM)\n\n" +
        "1. BLUF: Recommend approval of the proposed G6 C4/IT initiative to enhance theater mission readiness while maintaining full RMF and PPSM compliance.\n\n" +
        "2. KEY FACTS:\n" +
        "   • Requirement aligns with USAREUR-AF G6 modernization priorities.\n" +
        "   • Boundary and cybersecurity reviews are required prior to operational cutover.\n\n" +
        "3. RISKS & MITIGATION:\n" +
        "   • Schedule risk during eMASS SCA validation; mitigate via early STIG baseline scans.\n\n" +
        "4. NEXT ACTIONS:\n" +
        "   • Route package to G6 Plans & Architecture and Cybersecurity for concurrence.",
      sources: [{ title: "G6 Staff Action Officer Handbook (Mock Reference)", owner: "G6 Governance" }]
    };
  }

  if (task === "decision" || q.includes("decision paper")) {
    return {
      answer:
        "UNCLASSIFIED // PUBLIC PROTOTYPE — STAFF DECISION PAPER\n\n" +
        "SUBJECT: Decision on Proposed G6 Technical Requirement\n\n" +
        "1. PURPOSE: To obtain leadership decision on the recommended course of action.\n" +
        "2. FACTS BEARING ON THE PROBLEM:\n" +
        "   • Current capability requires modernization to meet theater interoperability targets.\n" +
        "3. ASSUMPTIONS:\n" +
        "   • Funding and DISA boundary approvals will be completed in Q2.\n" +
        "4. COURSES OF ACTION:\n" +
        "   • COA 1 (Status Quo): Lowest cost, high operational sustainment risk.\n" +
        "   • COA 2 (Phased Modernization - RECOMMENDED): Balances RMF compliance, cost, and mission capability.\n" +
        "5. RECOMMENDATION: Approve COA 2 and task G6 divisions to execute.",
      sources: [{ title: "AR 25-50 / G6 Decision Paper Template", owner: "G6 Directorate" }]
    };
  }

  if (task === "coa" || q.includes("courses of action") || q.includes("compare")) {
    return {
      answer:
        "UNCLASSIFIED // PUBLIC PROTOTYPE — COA COMPARISON MATRIX\n\n" +
        "• COA 1 (Maintain Baseline): Low funding impact | High obsolescence risk | No new ATO needed.\n" +
        "• COA 2 (Modular Upgrade - Recommended): Moderate funding | Low technical risk | Uses inherited RMF controls.\n" +
        "• COA 3 (Full Replacement): High funding | Extended 12-month schedule | Full new eMASS ATO required.\n\n" +
        "STAFF ASSESSMENT: COA 2 delivers 85% of the operational capability within the current fiscal cycle.",
      sources: [{ title: "G6 Plans & Architecture COA Guide", owner: "G6 Plans" }]
    };
  }

  // 2. Check Knowledge Base keyword match
  let bestItem = null;
  let bestScore = 0;

  for (const item of knowledgeBase) {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (bestItem && bestScore > 0) {
    return {
      answer: `[${bestItem.division}] ${bestItem.title}\n\n${bestItem.summary}\n\nNote: This is an unclassified prototype workflow summary. Verify against authoritative command SOPs.`,
      sources: [{ title: bestItem.reference, owner: bestItem.division }]
    };
  }

  // 3. Default Triage / General Response
  return {
    answer:
      "UNCLASSIFIED // G6 AI STAFF ASSESSMENT (MOCK ENGINE)\n\n" +
      `Requirement Received: "${question}"\n\n` +
      "Recommended G6 Coordination Path:\n" +
      "1. Requirement Triage: Validate operational need, suspense date, and funding source with G6 Plans & Architecture.\n" +
      "2. Cybersecurity & RMF: Confirm eMASS accreditation boundary and STIG applicability with the ISSM.\n" +
      "3. Network & Boundary: Verify transport bandwidth and PPSM port exceptions with NETOPS and Enterprise Services.\n\n" +
      "Tip: Select one of the 6 Staff Support Workflows on the right to generate a formal EXSUM, Decision Paper, or COA comparison.",
    sources: [{ title: "USAREUR-AF G6 Portal Demonstration Knowledge Base", owner: "G6 Enterprise" }]
  };
}

function addMessage(role, text, sources = []) {
  const historyBox = document.getElementById("chat-history");
  if (!historyBox) return;

  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("strong");
  heading.textContent = role === "user" ? "You" : "G6 AI Assistant";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  article.append(heading, paragraph);

  if (role === "assistant" && sources.length) {
    const sourceBox = document.createElement("div");
    sourceBox.className = "sources";
    sourceBox.textContent =
      "References: " +
      sources.map((s) => `${s.title} (${s.owner || "G6"})`).join(" · ");
    article.appendChild(sourceBox);
  }

  historyBox.appendChild(article);
  historyBox.scrollTop = historyBox.scrollHeight;
}

async function submitQuestion(questionText) {
  const input = document.getElementById("question");
  const statusBox = document.getElementById("status");
  const sendButton = document.getElementById("send");

  const clean = (questionText || "").trim();
  if (busy || !clean) return;

  addMessage("user", clean);
  if (input) input.value = "";

  busy = true;
  if (sendButton) sendButton.disabled = true;
  if (statusBox) statusBox.textContent = "Generating G6 advisory response...";

  try {
    if (API_URL) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean, history, task: selectedTask })
      });
      const data = await response.json();
      addMessage("assistant", data.answer || "No response returned.", data.sources || []);
    } else {
      await new Promise((r) => setTimeout(r, 300));
      const mock = generateMockResponse(clean, selectedTask);
      addMessage("assistant", mock.answer, mock.sources);
    }

    history.push({ role: "user", content: clean });
    history = history.slice(-8);
    if (statusBox) statusBox.textContent = "Ready · Mock AI Demonstration Mode (Human review required)";
  } catch (err) {
    addMessage("assistant", `Request error: ${err.message}`);
    if (statusBox) statusBox.textContent = "Error encountered";
  } finally {
    busy = false;
    if (sendButton) sendButton.disabled = false;
  }
}

// =========================================================
// DOCUMENT GENERATOR LOGIC
// =========================================================

function generateDocumentTemplate() {
  const type = document.getElementById("doc-type").value;
  const subject = document.getElementById("doc-subject").value.trim() || "[INSERT REQUIREMENT TITLE]";
  const unit = document.getElementById("doc-unit").value.trim() || "USAREUR-AF G6";
  const context = document.getElementById("doc-context").value.trim() || "Operational context and key facts to be supplied by action officer.";
  const dateStr = new Date().toISOString().slice(0, 10);

  const templates = {
    exsum: `UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT
DATE: ${dateStr}
ORIGINATOR: ${unit}
SUBJECT: EXECUTIVE SUMMARY — ${subject}

1. BOTTOM LINE UP FRONT (BLUF):
   Decision or awareness briefing regarding ${subject}.

2. KEY FACTS & CONTEXT:
   ${context}

3. CYBERSECURITY & ARCHITECTURE IMPACT:
   • RMF / eMASS: Verify existing ATO boundary inheritance prior to deployment.
   • Network / PPSM: Validate required ports and protocols against DISA CAL.

4. RECOMMENDED NEXT STEPS:
   • Coordinate division-level review across NETOPS, Cybersecurity, and Plans.
   • Present final package at the next G6 Configuration Control Board (CCB).

UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT`,

    decision: `UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT
DATE: ${dateStr}
ORIGINATOR: ${unit}
SUBJECT: DECISION PAPER — ${subject}

1. PURPOSE:
   To obtain command decision regarding ${subject}.

2. PROBLEM STATEMENT & CONTEXT:
   ${context}

3. COURSES OF ACTION (COAs):
   • COA 1 (Status Quo): Maintain legacy baseline; incurs higher operational risk.
   • COA 2 (Phased Implementation - RECOMMENDED): Delivers capability within current RMF and resource constraints.

4. STAFF COORDINATION:
   [ ] G6 NETOPS    [ ] G6 Cybersecurity (ISSM)    [ ] G6 Plans & Architecture

5. RECOMMENDATION:
   Approve COA 2.

UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT`,

    ppsm: `UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT
PPSM FIREWALL EXCEPTION JUSTIFICATION WORKSHEET
DATE: ${dateStr} | UNIT: ${unit}
SYSTEM / APPLICATION: ${subject}

1. OPERATIONAL JUSTIFICATION:
   ${context}

2. TRAFFIC PROFILE (PLACEHOLDER):
   • Source Enclave / Subnet: [Insert Non-Sensitive Lab/Demo Subnet]
   • Destination Enclave / Subnet: [Insert Target Subnet]
   • Protocol / Port: TCP 443 (HTTPS)
   • CAL Alignment: Compliant

3. SECURITY MITIGATIONS:
   • TLS 1.3 encryption enforced; host STIG compliance verified.

UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT`,

    satcom: `UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT
SATCOM SAR / GAR CONCEPT OF OPERATIONS
DATE: ${dateStr} | ORIGINATOR: ${unit}
EXERCISE / MISSION: ${subject}

1. MISSION OVERVIEW:
   ${context}

2. TERMINAL & BANDWIDTH PLANNING:
   • Primary Band: [UHF / Ku / Ka / X-Band]
   • Required Window: [Start DTG] to [End DTG]
   • STEP / Gateway Site: [Specify Theater Gateway]

3. COORDINATION CHECKLIST:
   [ ] SAR submitted in JIST (T-30 Days)
   [ ] COMSEC keys requested via KMI (T-14 Days)
   [ ] GAA verified prior to transmission

UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT`,

    spillage: `UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT
INITIAL CYBER / SPILLAGE TRIAGE WORKSHEET (DO NOT INCLUDE CLASSIFIED DETAILS)
DATE: ${dateStr} | REPORTING UNIT: ${unit}
INCIDENT REFERENCE: ${subject}

1. UNCLASSIFIED SUMMARY OF EVENT:
   ${context}

2. IMMEDIATE CONTAINMENT CHECKLIST:
   [X] System left powered ON (memory preserved)
   [X] Network cable physically disconnected; Wi-Fi disabled
   [X] Physical area secured
   [ ] Unit ISSM and Theater Cyber Operations Desk notified

UNCLASSIFIED // PUBLIC DEMONSTRATION DRAFT`
  };

  document.getElementById("doc-output").textContent = templates[type] || templates.exsum;
}

// =========================================================
// EVENT LISTENERS
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  renderDepartments();
  renderKnowledgeBase();
  renderTracker();

  // Sidebar navigation
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(el.dataset.nav);
    });
  });

  // View shortcut buttons
  document.querySelectorAll("[data-open-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.openView));
  });

  // Mobile menu button
  const mobileBtn = document.getElementById("mobile-menu-btn");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });
  }

  // Quick query chips on dashboard
  document.querySelectorAll("[data-quick-query]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.quickQuery;
      switchView("assistant");
      submitQuestion(q);
    });
  });

  // Task selector buttons in assistant view
  document.querySelectorAll("[data-task]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const task = btn.dataset.task;
      selectedTask = task;
      const input = document.getElementById("question");
      const label = document.getElementById("active-task-label");
      if (input && taskPrompts[task]) {
        input.value = taskPrompts[task];
        input.focus();
      }
      if (label) {
        label.textContent = `Mode: ${btn.querySelector("strong").textContent}`;
      }
    });
  });

  // Chat form submission
  const form = document.getElementById("chat-form");
  const input = document.getElementById("question");
  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitQuestion(input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }

  // Clear chat
  const clearBtn = document.getElementById("clear-chat");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      history = [];
      selectedTask = "auto";
      const historyBox = document.getElementById("chat-history");
      if (historyBox) historyBox.replaceChildren();
      addMessage("assistant", "New conversation started. Select a G6 division or staff task to begin.");
    });
  }

  // Knowledge base search filter
  const kbSearch = document.getElementById("kb-search");
  if (kbSearch) {
    kbSearch.addEventListener("input", (e) => renderKnowledgeBase(e.target.value));
  }

  // Document generator
  const genDocBtn = document.getElementById("generate-doc-btn");
  if (genDocBtn) {
    genDocBtn.addEventListener("click", generateDocumentTemplate);
  }

  const copyDocBtn = document.getElementById("copy-doc-btn");
  if (copyDocBtn) {
    copyDocBtn.addEventListener("click", () => {
      const text = document.getElementById("doc-output").textContent;
      navigator.clipboard.writeText(text);
      copyDocBtn.textContent = "Copied!";
      setTimeout(() => {
        copyDocBtn.textContent = "Copy Text";
      }, 1500);
    });
  }
});
