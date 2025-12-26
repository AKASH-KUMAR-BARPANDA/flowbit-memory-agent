# 🧠 Memory-Driven Invoice Agent

**AI Agent Development Assignment – Flowbit Private Limited**

An intelligent invoice automation system that learns from human corrections to reduce manual overhead over time. Unlike stateless systems, this agent uses a persistent memory loop to build trust and automate recurring patterns safely.

---

## 🚀 Project Overview

Invoice automation systems repeatedly encounter the same corrections (e.g., vendor-specific labels or VAT patterns). Most systems treat each invoice as a stateless input, wasting human effort. 

**This System:**
* **Learns** from human decisions and persists them.
* **Remains Explainable** through a detailed audit trail.
* **Applies Memory Safely** using strict confidence thresholds.
* **Survives Restarts** by utilizing a SQLite-backed memory layer.

---

## 🛠️ Tech Stack
* **Language:** TypeScript (Strict mode)
* **Runtime:** Node.js
* **Database:** SQLite (for persistent, auditable memory)
* **Key Principles:** Learned Memory, Explainability, Safe Automation

---

## 📐 System Architecture

1.  **Invoice Input:** Raw data ingestion.
2.  **Memory Recall:** Retrieving Vendor and Correction memories.
3.  **Memory Apply:** Normalizing data and proposing adjustments.
4.  **Decision Engine:** Determining automation level based on confidence.
5.  **Learning Loop:** Reinforcement of successful actions + time-based decay.
6.  **Persistence:** SQLite storage (memory.db) to ensure learning isn't lost.

---

## ⚖️ Decision Logic & Safety

The system **never blindly trusts memory**. Decisions are governed by the following thresholds:

| Confidence | Action |
| :--- | :--- |
| **< 0.5** | **Escalate:** Requires immediate human intervention. |
| **0.5 – 0.6** | **Suggest + Review:** Propose a fix for human approval. |
| **≥ 0.6** | **Auto-correct:** Automatically fix and flag for visibility. |
| **≥ 0.8** | **Auto-apply:** High-trust straight-through processing. |

### 🛡️ Safety Rules
* **Duplicates:** Flagged immediately; learning is blocked to prevent contradictory data.
* **Memory Decay:** Memories lose confidence over time if not used.
* **Reinforcement:** Only memory that is actually applied and successful is reinforced.

---

## 🧠 Memory Types Implemented

* **Vendor Memory:** Tracks vendor-specific patterns (e.g., mapping `Leistungsdatum` to `serviceDate`).
* **Correction Memory:** Generic patterns (e.g., "Prices include VAT") reusable across multiple vendors.
* **Resolution Memory:** Implicit feedback where approvals increase confidence and rejections penalize it.

---

## 📋 Output Contract
Every processed invoice returns a structured JSON object for full auditability:

```json
{
  "normalizedInvoice": {},
  "proposedCorrections": [],
  "requiresHumanReview": true,
  "reasoning": "Explanation of decision",
  "confidenceScore": 0.0,
  "memoryUpdates": [],
  "auditTrail": [
    {
      "step": "recall|apply|decide|learn",
      "timestamp": "...",
      "details": "..."
    }
  ]
}
