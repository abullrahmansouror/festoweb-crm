import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;

  // ── COLORS ─────────────────────────────────────────────
  const teal:  [number,number,number] = [13, 148, 136];   // #0d9488
  const black: [number,number,number] = [15, 15, 15];
  const dark:  [number,number,number] = [50, 50, 50];
  const muted: [number,number,number] = [120, 120, 120];
  const light: [number,number,number] = [230, 230, 230];
  const white: [number,number,number] = [255, 255, 255];

  // ── TOP HEADER BAR ─────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 0, W, 28, 'F');

  // Brand name — left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...white);
  doc.text('Festoweb', margin, 18);

  // Contact info — right side of header
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
  doc.text(`# ${invoice.invoice_number || ''}`, margin, y + 7);

  // ── DATE — right side ──────────────────────────────────
  const issuedDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : invoice.date
    ? new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

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
  y += 18;
  doc.setDrawColor(...light);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);

  // ── BILL TO ────────────────────────────────────────────
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...teal);
  doc.text('BILL TO', margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...black);
  const clientName = invoice.clients?.full_name || invoice.client_name || '-';
  doc.text(clientName, margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...dark);

  const clientCompany = invoice.clients?.company_name || '';
  const clientPhone   = invoice.clients?.phone || '';
  const clientEmail   = invoice.clients?.email || '';
  const clientAddress = invoice.clients?.address || '';

  if (clientCompany) { doc.text(clientCompany, margin, y); y += 5; }
  if (clientPhone)   { doc.text(clientPhone,   margin, y); y += 5; }
  if (clientEmail)   { doc.text(clientEmail,   margin, y); y += 5; }
  if (clientAddress) { doc.text(clientAddress, margin, y); y += 5; }

  // ── ITEMS TABLE ────────────────────────────────────────
  const tableStartY = y + 8;
  const items = invoice.invoice_items || [];
  const currency = invoice.currency || 'SAR';

  // Build body — if no items, use description + amount as single row
  const tableBody = items.length > 0
    ? items.map((item: any) => [
        item.description || '-',
        String(item.quantity ?? 1),
        `${currency} ${Number(item.unit_price || 0).toLocaleString()}`,
        `${currency} ${Number(item.total ?? (item.unit_price * item.quantity) || 0).toLocaleString()}`,
      ])
    : [[
        invoice.description || 'Service',
        '1',
        `${currency} ${Number(invoice.amount || 0).toLocaleString()}`,
        `${currency} ${Number(invoice.amount || 0).toLocaleString()}`,
      ]];

  autoTable(doc, {
    startY: tableStartY,
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
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    tableLineWidth: 0,
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // ── TOTALS ─────────────────────────────────────────────
  const subtotal  = Number(invoice.subtotal  || invoice.amount || 0);
  const taxRate   = Number(invoice.tax_rate  || 0);
  const taxAmount = Number(invoice.tax_amount || (subtotal * taxRate / 100));
  const total     = Number(invoice.total     || subtotal + taxAmount);

  const totalsX = W - margin - 80;
  let ty = finalY + 8;

  // Subtotal row
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

  ty += 4;
  doc.setDrawColor(...light);
  doc.line(totalsX, ty, W - margin, ty);

  ty += 6;
  // Total box
  doc.setFillColor(...teal);
  doc.roundedRect(totalsX - 2, ty - 5, W - margin - totalsX + 4, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text('Total', totalsX + 2, ty + 1.5);
  doc.text(`${currency} ${total.toLocaleString()}`, W - margin - 2, ty + 1.5, { align: 'right' });

  // ── NOTE ───────────────────────────────────────────────
  const noteText = invoice.notes || invoice.note || '';
  let bottomY = ty + 20;

  if (noteText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...teal);
    doc.text('NOTE', margin, bottomY);
    bottomY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(noteText, W - margin * 2 - 85);
    doc.text(lines, margin, bottomY);
    bottomY += lines.length * 5 + 5;
  }

  // ── DIVIDER BEFORE FOOTER ──────────────────────────────
  const footerDivY = 270;
  doc.setDrawColor(...light);
  doc.setLineWidth(0.4);
  doc.line(margin, footerDivY, W - margin, footerDivY);

  // ── THANK YOU MESSAGE ──────────────────────────────────
  const thankMsg = invoice.thank_you_message || 'Thank you for your business! We look forward to working with you again.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const thankLines = doc.splitTextToSize(thankMsg, W - margin * 2);
  doc.text(thankLines, W / 2, 276, { align: 'center' });

  // ── FOOTER ─────────────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 285, W, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text('Festoweb  ·  +966 506 724 880  ·  contact@festoweb.com', W / 2, 292, { align: 'center' });

  doc.save(`FestoWeb-Invoice-${invoice.invoice_number || 'draft'}.pdf`);
}
