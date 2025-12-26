import { CorrectionMemory } from "./CorrectionMemory";
import { randomUUID } from "crypto";
import { db } from "./db";

export class CorrectionMemoryStore {

    findApplicable(trigger: string, vendor?: string): CorrectionMemory | null {
        const rows = db.prepare(
            `SELECT * FROM correction_memory WHERE trigger = ? AND active = 1`
        ).all(trigger);

        for (const row of rows) {
            const vendors = row.applicableVendors
                ? JSON.parse(row.applicableVendors)
                : null;

            if (!vendors || (vendor && vendors.includes(vendor))) {
                return {
                    ...row,
                    applicableVendors: vendors,
                    active: Boolean(row.active)
                };
            }
        }
        return null;
    }

    create(trigger: string, action: string, vendors?: string[]): CorrectionMemory {
        const memory: CorrectionMemory = {
            id: randomUUID(),
            type: "correction",
            trigger,
            action,
            applicableVendors: vendors,
            confidence: 0.55,
            usageCount: 1,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            decayRate: 0.02,
            active: true
        };

        db.prepare(`
      INSERT INTO correction_memory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            memory.id,
            memory.trigger,
            memory.action,
            JSON.stringify(memory.applicableVendors ?? null),
            memory.confidence,
            memory.usageCount,
            memory.createdAt,
            memory.lastUsedAt,
            memory.decayRate,
            memory.active ? 1 : 0
        );

        return memory;
    }

    reinforce(memory: CorrectionMemory): void {
        memory.confidence += (1 - memory.confidence) * 0.1;
        memory.usageCount += 1;
        memory.lastUsedAt = new Date().toISOString();

        db.prepare(`
      UPDATE correction_memory
      SET confidence = ?, usageCount = ?, lastUsedAt = ?
      WHERE id = ?
    `).run(
            memory.confidence,
            memory.usageCount,
            memory.lastUsedAt,
            memory.id
        );
    }
}