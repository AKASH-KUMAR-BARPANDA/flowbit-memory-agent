import { VendorMemoryStore } from "../memory/VendorMemoryStore";
import { CorrectionMemoryStore } from "../memory/CorrectionMemoryStore";
import { InvoiceProcessor } from "../decision/InvoiceProcessor";
import { Invoice } from "../types/Invoice";
import { DuplicateDetector } from "../decision/DuplicateDetector";


const vendorStore = new VendorMemoryStore();
const correctionStore = new CorrectionMemoryStore();

const duplicateDetector = new DuplicateDetector();

const processor = new InvoiceProcessor(
    vendorStore,
    correctionStore,
    duplicateDetector
);

correctionStore.create(
    "VAT_INCLUDED",
    "Recompute net & VAT (prices include VAT)",
    ["Parts AG"]
);


console.log("\n=== PARTS AG – INVOICE RUN #1 ===");

const partsInvoice1: Invoice = {
    invoiceNumber: "INV-B-001",
    vendor: "Parts AG",
    invoiceDate: "2025-11-22",
    rawText: "Prices incl. VAT",
    lineItems: [
        {
            description: "Spare part",
            qty: 1,
            unitPrice: 119
        }
    ],
    total: 119,
    currency: "EUR"
};

let result = processor.process(partsInvoice1);
console.log(JSON.stringify(result, null, 2));


// 👤 Simulate human approval of VAT correction
const vatMemory = correctionStore.findApplicable(
    "VAT_INCLUDED",
    "Parts AG"
);

if (vatMemory) {
    correctionStore.reinforce(vatMemory);
    console.log("\nHuman approved VAT correction → confidence reinforced");
}

console.log("\n=== PARTS AG – INVOICE RUN #2 ===");

const partsInvoice2: Invoice = {
    ...partsInvoice1,
    invoiceNumber: "INV-B-002"
};

result = processor.process(partsInvoice2);
console.log(JSON.stringify(result, null, 2));

// 👤 Second human approval (realistic for recurring vendor)
const vatMemory2 = correctionStore.findApplicable(
    "VAT_INCLUDED",
    "Parts AG"
);

if (vatMemory2) {
    correctionStore.reinforce(vatMemory2);
    console.log("Human approved VAT correction again → confidence reinforced");
}

console.log("\n=== PARTS AG – INVOICE RUN #3 ===");

const partsInvoice3: Invoice = {
    ...partsInvoice1,
    invoiceNumber: "INV-B-003"
};

console.log(JSON.stringify(processor.process(partsInvoice3), null, 2));


console.log("\n=== DUPLICATE INVOICE TEST ===");

const duplicateInvoice: Invoice = {
    invoiceNumber: "INV-B-003", // same as previous
    vendor: "Parts AG",
    invoiceDate: "2025-11-23",  // close date
    rawText: "Prices incl. VAT",
    lineItems: [],
    total: 119,
    currency: "EUR"
};

console.log(JSON.stringify(processor.process(duplicateInvoice), null, 2));