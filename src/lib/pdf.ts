import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;

  // ── COLORS ─────────────────────────────────────────────
  const teal:  [number,number,number] = [13, 148, 136];
  const black: [number,number,number] = [15, 15, 15];
  const dark:  [number,number,number] = [50, 50, 50];
  const muted: [number,number,number] = [120, 120, 120];
  const light: [number,number,number] = [230, 230, 230];
  const white: [number,number,number] = [255, 255, 255];

  // ── RESOLVE DATA (works for both flat & rich invoice) ──────
  const clientName    = invoice.clients?.full_name    || invoice.client_name    || '-';
  const clientCompany = invoice.clients?.company_name || invoice.company_name   || '';
  const clientPhone   = invoice.clients?.phone        || invoice.client_phone   || '';
  const clientEmail   = invoice.clients?.email        || invoice.client_email   || '';
  const currency      = invoice.currency              || 'SAR';
  const invoiceNum    = invoice.invoice_number        || '';
  const noteText      = invoice.notes                 || invoice.note           || '';
  const thankMsg      = invoice.thank_you_message     || 'Thank you for your business! We look forward to working with you again.';

  const issuedDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : invoice.date
    ? new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  // Build items rows
  const items = invoice.invoice_items || [];
  const tableBody: string[][] = items.length > 0
    ? items.map((item: any) => [
        item.description || '-',
        String(item.quantity ?? 1),
        `${currency} ${Number(item.unit_price || 0).toLocaleString()}`,
        `${currency} ${Number(item.total ?? ((item.unit_price || 0) * (item.quantity || 1))).toLocaleString()}`,
      ])
    : [[
        invoice.description || 'Service',
        '1',
        `${currency} ${Number(invoice.amount || 0).toLocaleString()}`,
        `${currency} ${Number(invoice.amount || 0).toLocaleString()}`,
      ]];

  // Totals
  const subtotal  = Number(invoice.subtotal   || invoice.amount || 0);
  const taxRate   = Number(invoice.tax_rate   || 0);
  const taxAmount = Number(invoice.tax_amount || (subtotal * taxRate / 100));
  const total     = Number(invoice.total      || subtotal + taxAmount);

  // ── TOP HEADER BAR ─────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...white);
  doc.text('Festoweb', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('+966 506 724 880', W - margin, 12, { align: 'right' });
  doc.text('contact@festoweb.com', W - margin, 19, { align: 'right' });

  // ── INVOICE LABEL + NUMBER ─────────────────────────────
  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...black);
  doc.text('INVOICE', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`# ${invoiceNum}`, margin, y + 7);

  // Date — right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text('Date', W - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(issuedDate, W - margin, y + 7, { align: 'right' });

  if (dueDate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text('Due Date', W - margin, y + 14, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(dueDate, W - margin, y + 21, { align: 'right' });
  }

  // ── DIVIDER ────────────────────────────────────────────
  y += 20;
  doc.setDrawColor(...light);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);

  // ── BILL TO ────────────────────────────────────────────
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...teal);
  doc.text('BILL TO', margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...black);
  doc.text(clientName, margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  if (clientCompany) { doc.text(clientCompany, margin, y); y += 5; }
  if (clientPhone)   { doc.text(clientPhone,   margin, y); y += 5; }
  if (clientEmail)   { doc.text(clientEmail,   margin, y); y += 5; }

  // ── ITEMS TABLE ────────────────────────────────────────
  autoTable(doc, {
    startY: y + 8,
    head: [['Service / Description', 'Qty', 'Unit Price', 'Total']],
    body: tableBody,
    headStyles: {
      fillColor: teal,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: dark,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // ── TOTALS ─────────────────────────────────────────────
  const totalsX = W - margin - 75;
  let ty = finalY + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text('Subtotal', totalsX, ty);
  doc.setTextColor(...dark);
  doc.text(`${currency} ${subtotal.toLocaleString()}`, W - margin, ty, { align: 'right' });

  ty += 6;
  doc.setTextColor(...muted);
  doc.text(`Tax (${taxRate}%)`, totalsX, ty);
  doc.setTextColor(...dark);
  doc.text(`${currency} ${taxAmount.toLocaleString()}`, W - margin, ty, { align: 'right' });

  ty += 3;
  doc.setDrawColor(...light);
  doc.line(totalsX, ty, W - margin, ty);

  ty += 5;
  doc.setFillColor(...teal);
  doc.roundedRect(totalsX - 2, ty - 4, W - margin - totalsX + 4, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text('TOTAL', totalsX + 2, ty + 2.5);
  doc.text(`${currency} ${total.toLocaleString()}`, W - margin - 2, ty + 2.5, { align: 'right' });

  // ── NOTE ───────────────────────────────────────────────
  if (noteText) {
    let ny = ty + 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...teal);
    doc.text('NOTE', margin, ny);
    ny += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(noteText, 110);
    doc.text(lines, margin, ny);
  }

  // ── DIVIDER + THANK YOU ────────────────────────────────
  doc.setDrawColor(...light);
  doc.setLineWidth(0.4);
  doc.line(margin, 265, W - margin, 265);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const thankLines = doc.splitTextToSize(thankMsg, W - margin * 2);
  doc.text(thankLines, W / 2, 271, { align: 'center' });

  // ── FOOTER BAR ─────────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 282, W, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('Festoweb  ·  +966 506 724 880  ·  contact@festoweb.com', W / 2, 291, { align: 'center' });

  doc.save(`FestoWeb-Invoice-${invoiceNum || 'draft'}.pdf`);
}
