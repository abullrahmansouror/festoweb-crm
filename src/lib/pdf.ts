import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const black: [number,number,number] = [10, 10, 10];
  const gray: [number,number,number] = [120, 120, 120];
  const light: [number,number,number] = [220, 220, 220];

  // ── HEADER ─────────────────────────────────────────────
  // Big INVOICE title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...black);
  doc.text('INVOICE', 15, 22);

  // Invoice number below title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.text(`INVOICE NO.${invoice.invoice_number}`, 15, 30);

  // Festoweb logo (text-based) top-right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...black);
  doc.text('festoweb', W - 15, 20, { align: 'right' });
  // Lightning bolt symbol before logo
  doc.setFontSize(18);
  doc.setTextColor(80, 80, 230);
  doc.text('\u26A1', W - 15 - doc.getTextWidth('festoweb') - 3, 21, { align: 'right' });

  // Divider line
  doc.setDrawColor(...light);
  doc.setLineWidth(0.4);
  doc.line(15, 35, W - 15, 35);

  // ── ISSUED TO & DATES ──────────────────────────────────
  const colLeft = 15;
  const colRight = 120;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.text('ISSUED TO :', colLeft, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const clientName = invoice.clients?.full_name || '-';
  const clientCompany = invoice.clients?.company_name || '';
  const clientEmail = invoice.clients?.email || '';
  const clientPhone = invoice.clients?.phone || '';
  let cy = 52;
  doc.text(clientName, colLeft, cy); cy += 6;
  if (clientCompany) { doc.text(clientCompany, colLeft, cy); cy += 6; }
  if (clientPhone)   { doc.text(clientPhone, colLeft, cy);   cy += 6; }
  if (clientEmail)   { doc.text(clientEmail, colLeft, cy);   cy += 6; }

  // Dates right side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const issuedDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : '-';
  const dueDate    = invoice.due_date   ? new Date(invoice.due_date).toLocaleDateString('en-GB',   { day:'numeric', month:'long', year:'numeric' }) : '-';

  doc.text('Issued Date', colRight, 45);
  doc.text(':', colRight + 28, 45);
  doc.text(issuedDate, colRight + 32, 45);
  doc.text('Due Date', colRight, 52);
  doc.text(':', colRight + 28, 52);
  doc.text(dueDate, colRight + 32, 52);

  // ── ITEMS TABLE ────────────────────────────────────────
  const items = invoice.invoice_items || [];
  const currency = invoice.currency || 'SAR';

  autoTable(doc, {
    startY: 78,
    head: [['DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']],
    body: items.map((item: any) => [
      item.description || '-',
      item.quantity ?? 1,
      `${currency} ${Number(item.unit_price).toLocaleString()}`,
      `${currency} ${Number(item.total ?? (item.unit_price * item.quantity)).toLocaleString()}`,
    ]),
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: black,
      fontStyle: 'bold',
      fontSize: 9,
      lineWidth: { bottom: 0.5 },
      lineColor: black,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    tableLineWidth: 0,
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // Divider above totals
  doc.setDrawColor(...light);
  doc.line(110, finalY, W - 15, finalY);

  // ── TOTALS ─────────────────────────────────────────────
  const subtotal   = Number(invoice.subtotal  || 0);
  const taxAmount  = Number(invoice.tax_amount || (subtotal * (invoice.tax_rate || 0) / 100));
  const total      = Number(invoice.total     || subtotal + taxAmount);

  const totY = finalY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal', 130, totY);
  doc.text(`${currency} ${subtotal.toLocaleString()}`, W - 15, totY, { align: 'right' });

  doc.line(110, totY + 3, W - 15, totY + 3);

  doc.text('Tax', 130, totY + 10);
  doc.text(`${currency} ${taxAmount.toLocaleString()}`, W - 15, totY + 10, { align: 'right' });

  doc.line(110, totY + 13, W - 15, totY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.text('Total', 130, totY + 20);
  doc.text(`${currency} ${total.toLocaleString()}`, W - 15, totY + 20, { align: 'right' });

  doc.line(110, totY + 23, W - 15, totY + 23);

  // ── PAYMENT TO ─────────────────────────────────────────
  const payY = totY + 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.text('PAYMENT TO :', colLeft, payY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('FestoWeb', colLeft, payY + 7);
  if (invoice.bank_account_number) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Account No.   :   ${invoice.bank_account_number}`, colLeft, payY + 14);
  }
  if (invoice.bank_account_name) {
    doc.text(`Account Name  :   ${invoice.bank_account_name}`, colLeft, payY + 21);
  }

  // ── THANK YOU ─────────────────────────────────────────
  const thankY = payY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...black);
  doc.text('THANK YOU FOR', W - 15, thankY, { align: 'right' });
  doc.text('ORDERING FROM US', W - 15, thankY + 8, { align: 'right' });

  doc.save(`FestoWeb-Invoice-${invoice.invoice_number}.pdf`);
}
