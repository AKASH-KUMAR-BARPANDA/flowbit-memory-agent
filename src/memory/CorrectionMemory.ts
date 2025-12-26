import { MemoryBase } from "./MemoryBase";

export interface CorrectionMemory extends MemoryBase {
    trigger: string;
    action: string;
    applicableVendors?: string[];
}