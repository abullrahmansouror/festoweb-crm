import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF();
  const primary = [99, 102, 241];

  // Header background
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, 210, 40, 'F');

  // Agency name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FestoWeb', 15, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('Digital Agency', 15, 27);
  doc.text('festoweb.com | Saudi Arabia', 15, 33);

  // Invoice label
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary as [number, number, number]);
  doc.text('INVOICE', 150, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text(`#${invoice.invoice_number}`, 195, 27, { align: 'right' });

  // Client info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoice.clients?.full_name || '-', 15, 63);
  if (invoice.clients?.company_name) doc.text(invoice.clients.company_name, 15, 69);

  // Invoice details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Issue Date:', 130, 55);
  doc.text('Due Date:', 130, 62);
  doc.text('Status:', 130, 69);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.created_at).toLocaleDateString(), 165, 55);
  doc.text(invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-', 165, 62);
  doc.text(invoice.status.toUpperCase(), 165, 69);

  // Items table
  const items = invoice.invoice_items || [];
  autoTable(doc, {
    startY: 82,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items.map((item: any) => [
      item.description,
      item.quantity,
      `${invoice.currency} ${Number(item.unit_price).toLocaleString()}`,
      `${invoice.currency} ${Number(item.total).toLocaleString()}`,
    ]),
    headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`${invoice.currency} ${Number(invoice.subtotal).toLocaleString()}`, 195, finalY, { align: 'right' });
  doc.text(`VAT (${invoice.tax_rate}%):`, 140, finalY + 7);
  doc.text(`${invoice.currency} ${Number(invoice.tax_amount).toLocaleString()}`, 195, finalY + 7, { align: 'right' });

  doc.setDrawColor(...primary as [number, number, number]);
  doc.line(140, finalY + 11, 195, finalY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primary as [number, number, number]);
  doc.text('Total:', 140, finalY + 18);
  doc.text(`${invoice.currency} ${Number(invoice.total).toLocaleString()}`, 195, finalY + 18, { align: 'right' });

  // Thank you
  if (invoice.thank_you_message) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(invoice.thank_you_message, 105, finalY + 35, { align: 'center' });
  }

  doc.save(`FestoWeb-Invoice-${invoice.invoice_number}.pdf`);
}
