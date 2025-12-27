
import { Invoice } from "../types/Invoice";
import { AgentOutput, AuditStep } from "../types/AgentOutput";
import { CorrectionMemoryStore } from "../memory/CorrectionMemoryStore";
import { VendorMemoryStore } from "../memory/VendorMemoryStore";
import { DuplicateDetector } from "./DuplicateDetector";

export class InvoiceProcessor {
    constructor(
        private vendorMemoryStore: VendorMemoryStore,
        private correctionMemoryStore: CorrectionMemoryStore,
        private duplicateDetector: DuplicateDetector
    ) {}

    process(invoice: Invoice): AgentOutput {
        const auditTrail: AuditStep[] = [];
        const proposedCorrections: string[] = [];
        const normalizedInvoice: Record<string, any> = {};
        let confidenceScore = 0;
        let requiresHumanReview = false;
        let reasoning = "";
        let vendorMemoryApplied = false;
        let correctionMemoryApplied = false;


        //  DUPLICATE CHECK (FIRST)
        if (this.duplicateDetector.isDuplicate(invoice)) {
            return {
                normalizedInvoice: {},
                proposedCorrections: [],
                requiresHumanReview: true,
                reasoning: "Possible duplicate invoice detected",
                confidenceScore: 0,
                memoryUpdates: [],
                auditTrail: [
                    {
                        step: "decide",
                        timestamp: new Date().toISOString(),
                        details: "Duplicate detected: same vendor, invoice number, close date"
                    }
                ]
            };
        }

// record invoice if not duplicate
        this.duplicateDetector.record(invoice);

        //  RECALL
        const vendorMemory = this.vendorMemoryStore.findByVendor(invoice.vendor);
        auditTrail.push({
            step: "recall",
            timestamp: new Date().toISOString(),
            details: vendorMemory
                ? `Found vendor memory for ${invoice.vendor}`
                : `No vendor memory found for ${invoice.vendor}`
        });

        //  APPLY
        if (vendorMemory?.patterns.fieldAliases) {
            for (const [alias, targetField] of Object.entries(
                vendorMemory.patterns.fieldAliases
            )) {
                if (invoice.rawText.includes(alias)) {
                    normalizedInvoice[targetField] = "EXTRACTED_FROM_RAW_TEXT";
                    proposedCorrections.push(
                        `Mapped ${alias} → ${targetField} using vendor memory`
                    );
                    confidenceScore = vendorMemory.confidence;
                }
            }

            auditTrail.push({
                step: "apply",
                timestamp: new Date().toISOString(),
                details: "Applied vendor field alias memory"
            });
        }

        //  CORRECTION MEMORY CHECK (VAT)
        if (invoice.rawText.toLowerCase().includes("vat")) {
            const correction = this.correctionMemoryStore.findApplicable(
                "VAT_INCLUDED",
                invoice.vendor
            );

            if (correction) {
                proposedCorrections.push(correction.action);
                confidenceScore = Math.max(confidenceScore, correction.confidence);

                auditTrail.push({
                    step: "apply",
                    timestamp: new Date().toISOString(),
                    details: `Applied correction memory: ${correction.action}`
                });

                if (correction.confidence >= 0.6) {
                    this.correctionMemoryStore.reinforce(correction);
                    auditTrail.push({
                        step: "learn",
                        timestamp: new Date().toISOString(),
                        details: "Reinforced correction memory (VAT)"
                    });
                }
            }
        }

        //  DECIDE
        if (confidenceScore >= 0.6) {
            requiresHumanReview = false;

            if (vendorMemoryApplied) {
                reasoning = `Vendor memory applied with confidence ${confidenceScore.toFixed(2)}`;
            } else if (correctionMemoryApplied) {
                reasoning = `Correction memory applied with confidence ${confidenceScore.toFixed(2)}`;
            } else {
                reasoning = "High confidence decision";
            }

            // 🔁 LEARN: reinforce only what was used
            if (vendorMemoryApplied && vendorMemory) {
                this.vendorMemoryStore.reinforce(vendorMemory);
                auditTrail.push({
                    step: "learn",
                    timestamp: new Date().toISOString(),
                    details: `Reinforced vendor memory for ${invoice.vendor}`
                });
            }
        } else {
            requiresHumanReview = true;
            reasoning = "No high-confidence memory applicable";
        }

        auditTrail.push({
            step: "decide",
            timestamp: new Date().toISOString(),
            details: requiresHumanReview
                ? "Escalated for human review"
                : "Auto-correct applied"
        });

        return {
            normalizedInvoice,
            proposedCorrections,
            requiresHumanReview,
            reasoning,
            confidenceScore,
            memoryUpdates: [],
            auditTrail
        };
    }
}