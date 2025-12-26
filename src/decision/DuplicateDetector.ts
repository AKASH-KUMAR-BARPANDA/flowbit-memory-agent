import { Invoice } from "../types/Invoice";

interface SeenInvoice {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
}

export class DuplicateDetector {
    private seen: SeenInvoice[] = [];

    isDuplicate(invoice: Invoice): boolean {
        return this.seen.some(prev =>
            prev.vendor === invoice.vendor &&
            prev.invoiceNumber === invoice.invoiceNumber &&
            this.isDateClose(prev.invoiceDate, invoice.invoiceDate)
        );
    }

    record(invoice: Invoice): void {
        this.seen.push({
            vendor: invoice.vendor,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate
        });
    }

    private isDateClose(d1: string, d2: string): boolean {
        const date1 = new Date(d1).getTime();
        const date2 = new Date(d2).getTime();
        const diffDays = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
        return diffDays <= 2; // within 2 days
    }
}