"use client";

import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";

import { getClientExportCompany } from "@/lib/export/client-company";
import { CompanyLetterhead } from "@/lib/export/letterhead";
import type { ExportCompany } from "@/lib/export/types";

export type InvoiceLine = {
  description: string;
  quantity: string | number;
  unitPrice: string;
  amount: string;
};

export type InvoiceData = {
  number: string;
  issueDate: string;
  dueDate?: string | null;
  clientName: string;
  clientAddress?: string | null;
  lines: InvoiceLine[];
  subtotal: string;
  tax?: string | null;
  total: string;
  notes?: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#011A32", fontFamily: "Helvetica" },
  invoiceTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  metaColumn: { width: "48%" },
  label: { fontSize: 8, color: "#56697F", marginBottom: 3 },
  value: { fontSize: 10, marginBottom: 5 },
  table: { borderStyle: "solid", borderWidth: 0.5, borderColor: "#C9D2DC" },
  row: { flexDirection: "row", minHeight: 24, alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: "#E5EAF0" },
  header: { backgroundColor: "#011A32", color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
  description: { flex: 1, padding: 6 },
  quantity: { width: 60, padding: 6, textAlign: "right" },
  amount: { width: 100, padding: 6, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 210, paddingVertical: 3 },
  totalLabel: { color: "#56697F" },
  grandTotal: { fontFamily: "Helvetica-Bold", fontSize: 12, borderTopWidth: 1, borderTopColor: "#011A32", paddingTop: 6 },
  notes: { marginTop: 18, color: "#56697F", lineHeight: 1.35 },
});

function InvoicePdfDocument({ invoice, company }: { invoice: InvoiceData; company: ExportCompany }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CompanyLetterhead company={company} />
        <Text style={styles.invoiceTitle}>Invoice {invoice.number}</Text>
        <View style={styles.meta}>
          <View style={styles.metaColumn}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.value}>{invoice.clientName}</Text>
            {invoice.clientAddress && <Text style={styles.value}>{invoice.clientAddress}</Text>}
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.label}>Issue date</Text>
            <Text style={styles.value}>{invoice.issueDate}</Text>
            {invoice.dueDate && <Text style={styles.value}>Due {invoice.dueDate}</Text>}
          </View>
        </View>
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.description}>Description</Text>
            <Text style={styles.quantity}>Qty</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          {invoice.lines.map((line, index) => (
            <View style={styles.row} key={`${line.description}-${index}`}>
              <Text style={styles.description}>{line.description}</Text>
              <Text style={styles.quantity}>{line.quantity}</Text>
              <Text style={styles.amount}>{line.amount}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{invoice.subtotal}</Text>
          </View>
          {invoice.tax && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text>{invoice.tax}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total</Text>
            <Text>{invoice.total}</Text>
          </View>
        </View>
        {invoice.notes && <Text style={styles.notes}>{invoice.notes}</Text>}
      </Page>
    </Document>
  );
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "invoice";
}

export async function downloadInvoicePdf(invoice: InvoiceData) {
  const company = await getClientExportCompany();
  const blob = await pdf(<InvoicePdfDocument invoice={invoice} company={company} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(`invoice-${invoice.number}`)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

