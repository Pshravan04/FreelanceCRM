import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Client, InvoiceItem } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export function generateInvoicePDF(invoice: Invoice, client: Client, items: InvoiceItem[]) {
  const doc = new jsPDF();
  
  // Brand / Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', 14, 22);
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 14, 32);
  doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 14, 38);
  if (invoice.due_date) {
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 14, 44);
  }
  
  // Status
  doc.text(`Status: ${invoice.status}`, 14, 50);

  // Bill To
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Bill To:', 120, 32);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(client.name, 120, 38);
  if (client.company) doc.text(client.company, 120, 44);
  if (client.email) doc.text(client.email, 120, 50);

  // Items Table
  const tableData = items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  
  const labelX = 140;
  const valueX = 196; // Right align to the table edge

  let currentY = finalY + 10;
  
  if (invoice.subtotal !== invoice.total) {
    doc.text('Subtotal:', labelX, currentY);
    doc.text(formatCurrency(invoice.subtotal), valueX, currentY, { align: 'right' });
    currentY += 6;
  }
  
  if (invoice.tax && invoice.tax > 0) {
    doc.text(`Tax:`, labelX, currentY);
    doc.text(formatCurrency(invoice.tax), valueX, currentY, { align: 'right' });
    currentY += 6;
  }

  if (invoice.discount && invoice.discount > 0) {
    doc.text(`Discount:`, labelX, currentY);
    doc.text('-' + formatCurrency(invoice.discount), valueX, currentY, { align: 'right' });
    currentY += 6;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', labelX, currentY + 2);
  doc.text(formatCurrency(invoice.total), valueX, currentY + 2, { align: 'right' });

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', 14, finalY + 10);
    
    const splitNotes = doc.splitTextToSize(invoice.notes, 100);
    doc.text(splitNotes, 14, finalY + 16);
  }

  // Save PDF
  doc.save(`Invoice_${invoice.invoice_number}.pdf`);
}
