import { VendorMemory } from "./VendorMemory";
import { randomUUID } from "crypto";
import { db } from "./db";

export class VendorMemoryStore {

    findByVendor(vendorName: string): VendorMemory | null {
        const row = db.prepare(
            `SELECT * FROM vendor_memory WHERE vendorName = ? AND active = 1`
        ).get(vendorName);

        if (!row) return null;

        return {
            ...row,
            patterns: JSON.parse(row.patterns),
            active: Boolean(row.active)
        };
    }

    createVendorMemory(
        vendorName: string,
        patterns: Partial<VendorMemory["patterns"]>
    ): VendorMemory {
        const memory: VendorMemory = {
            id: randomUUID(),
            type: "vendor",
            vendorName,
            patterns,
            confidence: 0.6,
            usageCount: 1,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            decayRate: 0.02,
            active: true
        };

        db.prepare(`
      INSERT INTO vendor_memory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            memory.id,
            memory.vendorName,
            JSON.stringify(memory.patterns),
            memory.confidence,
            memory.usageCount,
            memory.createdAt,
            memory.lastUsedAt,
            memory.decayRate,
            memory.active ? 1 : 0
        );

        return memory;
    }

    reinforce(memory: VendorMemory): void {
        memory.confidence += (1 - memory.confidence) * 0.1;
        memory.usageCount += 1;
        memory.lastUsedAt = new Date().toISOString();

        db.prepare(`
      UPDATE vendor_memory
      SET confidence = ?, usageCount = ?, lastUsedAt = ?
      WHERE id = ?
    `).run(
            memory.confidence,
            memory.usageCount,
            memory.lastUsedAt,
            memory.id
        );
    }

    penalize(memory: VendorMemory): void {
        memory.confidence -= 0.2;
        memory.lastUsedAt = new Date().toISOString();

        if (memory.confidence < 0.3) {
            memory.active = false;
        }

        db.prepare(`
      UPDATE vendor_memory
      SET confidence = ?, lastUsedAt = ?, active = ?
      WHERE id = ?
    `).run(
            memory.confidence,
            memory.lastUsedAt,
            memory.active ? 1 : 0,
            memory.id
        );
    }
}