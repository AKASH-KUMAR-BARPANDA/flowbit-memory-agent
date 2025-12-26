export type MemoryType = "vendor" | "correction" | "resolution";

export interface MemoryBase {
    id: string;
    type: MemoryType;
    confidence: number;       // 0.0 → 1.0
    usageCount: number;
    createdAt: string;
    lastUsedAt: string;
    decayRate: number;
    active: boolean;
}