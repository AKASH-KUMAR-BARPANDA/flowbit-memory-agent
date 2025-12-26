import { MemoryBase } from "./MemoryBase";

export interface VendorPatterns {
    fieldAliases?: Record<string, string>;
    vatIncluded?: boolean;
    currencyHints?: string[];
    skuMappings?: Record<string, string>;
    skontoTerms?: string;
}

export interface VendorMemory extends MemoryBase {
    vendorName: string;
    patterns: VendorPatterns;
}