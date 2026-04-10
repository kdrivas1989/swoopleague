import React from "react";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row" as const,
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    minHeight: 20,
    alignItems: "center" as const,
  },
  tableRowAlt: {
    flexDirection: "row" as const,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    minHeight: 20,
    alignItems: "center" as const,
    backgroundColor: "#f5f5f5",
  },
  cellName: { width: "15%", padding: 4 },
  cellEmail: { width: "17%", padding: 4 },
  cellClass: { width: "10%", padding: 4 },
  cellWing: { width: "12%", padding: 4 },
  cellSize: { width: "7%", padding: 4 },
  cellLoad: { width: "7%", padding: 4 },
  cellTurn: { width: "8%", padding: 4 },
  cellCountry: { width: "8%", padding: 4 },
  cellStatus: { width: "8%", padding: 4 },
  cellDate: { width: "8%", padding: 4 },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#999",
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
});

interface Registration {
  name: string;
  email: string;
  compClass: string | null;
  wingType: string | null;
  wingSize: string | null;
  wingLoading: string | null;
  degreeOfTurn: string | null;
  country: string | null;
  paymentStatus: string;
  createdAt: string;
}

interface EventInfo {
  name: string;
  startDate: string | null;
  endDate: string | null;
  locationName: string | null;
  locationCity: string | null;
}

export async function generateRegistrationPdf(
  event: EventInfo,
  registrations: Registration[]
): Promise<Buffer> {
  const dateStr = event.startDate
    ? `${event.startDate}${event.endDate ? ` - ${event.endDate}` : ""}`
    : "";
  const locationStr = [event.locationName, event.locationCity].filter(Boolean).join(", ");

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", orientation: "landscape", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, event.name),
        dateStr && React.createElement(Text, { style: styles.subtitle }, dateStr),
        locationStr && React.createElement(Text, { style: styles.subtitle }, locationStr),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${registrations.length} registration(s) — Generated ${new Date().toLocaleDateString()}`
        )
      ),
      // Table
      React.createElement(
        View,
        { style: styles.table },
        // Header row
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.cellName }, "Name"),
          React.createElement(Text, { style: styles.cellEmail }, "Email"),
          React.createElement(Text, { style: styles.cellClass }, "Class"),
          React.createElement(Text, { style: styles.cellWing }, "Wing"),
          React.createElement(Text, { style: styles.cellSize }, "Size"),
          React.createElement(Text, { style: styles.cellLoad }, "Load"),
          React.createElement(Text, { style: styles.cellTurn }, "Turn"),
          React.createElement(Text, { style: styles.cellCountry }, "Country"),
          React.createElement(Text, { style: styles.cellStatus }, "Status"),
          React.createElement(Text, { style: styles.cellDate }, "Date")
        ),
        // Data rows
        ...registrations.map((r, i) =>
          React.createElement(
            View,
            { key: i, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
            React.createElement(Text, { style: styles.cellName }, r.name),
            React.createElement(Text, { style: styles.cellEmail }, r.email),
            React.createElement(Text, { style: styles.cellClass }, r.compClass || "-"),
            React.createElement(Text, { style: styles.cellWing }, r.wingType || "-"),
            React.createElement(Text, { style: styles.cellSize }, r.wingSize || "-"),
            React.createElement(Text, { style: styles.cellLoad }, r.wingLoading || "-"),
            React.createElement(Text, { style: styles.cellTurn }, r.degreeOfTurn || "-"),
            React.createElement(Text, { style: styles.cellCountry }, r.country || "-"),
            React.createElement(Text, { style: styles.cellStatus }, r.paymentStatus),
            React.createElement(
              Text,
              { style: styles.cellDate },
              r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"
            )
          )
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, null, "USCPA Swoop League"),
        React.createElement(
          Text,
          { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}` }
        )
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
