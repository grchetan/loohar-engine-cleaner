const PDFDocument = require('pdfkit');

const generateInvoicePDF = (order, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // ---- HEADER ----
  doc.rect(0, 0, 595, 80).fill('#0a0a0a');
  doc.fillColor('#f5c518').fontSize(22).font('Helvetica-Bold')
    .text('LOHAR AUTO GARAGE', 40, 20, { align: 'left' });
  doc.fillColor('#ffffff').fontSize(9)
    .text('Professional Cleaning Solutions For Every Engine', 40, 48);
  doc.fillColor('#f5c518').fontSize(9)
    .text('INVOICE', 495, 30, { align: 'right' });

  doc.moveDown(3);

  // ---- INVOICE META ----
  doc.fillColor('#0a0a0a').fontSize(10).font('Helvetica');
  const col1 = 40, col2 = 320;
  doc.font('Helvetica-Bold').text('Invoice Details:', col1);
  doc.font('Helvetica')
    .text(`Invoice No: ${order.orderId}`, col1)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, col1)
    .text(`Payment: ${order.payment.method.toUpperCase()}`, col1)
    .text(`Status: ${order.payment.status.toUpperCase()}`, col1);

  doc.moveUp(5);
  doc.font('Helvetica-Bold').text('Bill To:', col2);
  doc.font('Helvetica')
    .text(order.shippingAddress?.fullName || 'Customer', col2)
    .text(order.shippingAddress?.line1 || '', col2)
    .text(`${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}`, col2)
    .text(order.shippingAddress?.phone || '', col2);

  if (order.gstNumber) {
    doc.moveDown(0.5).text(`GST No: ${order.gstNumber}`, col2);
    if (order.companyName) doc.text(`Company: ${order.companyName}`, col2);
  }

  doc.moveDown(2);

  // ---- TABLE HEADER ----
  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 24).fill('#f5c518');
  doc.fillColor('#0a0a0a').fontSize(10).font('Helvetica-Bold');
  doc.text('#', 48, tableTop + 7, { width: 25 });
  doc.text('Product', 75, tableTop + 7, { width: 230 });
  doc.text('Qty', 305, tableTop + 7, { width: 50 });
  doc.text('Unit Price', 355, tableTop + 7, { width: 90 });
  doc.text('Total', 445, tableTop + 7, { width: 110, align: 'right' });

  // ---- TABLE ROWS ----
  doc.font('Helvetica').fillColor('#333333').fontSize(10);
  let y = tableTop + 28;
  order.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(40, y - 4, 515, 22).fill('#fafafa');
    doc.fillColor('#0a0a0a');
    doc.text(i + 1, 48, y, { width: 25 });
    doc.text(item.name, 75, y, { width: 230 });
    doc.text(item.qty.toString(), 305, y, { width: 50 });
    doc.text(`₹${item.price}`, 355, y, { width: 90 });
    doc.text(`₹${item.price * item.qty}`, 445, y, { width: 110, align: 'right' });
    y += 24;
  });

  // ---- TOTALS ----
  y += 12;
  doc.moveTo(350, y).lineTo(555, y).strokeColor('#f5c518').stroke();
  y += 8;
  const addRow = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#333');
    doc.text(label, 355, y, { width: 140 });
    doc.text(`₹${value}`, 445, y, { width: 110, align: 'right' });
    y += 18;
  };
  addRow('Subtotal:', order.subtotal);
  addRow('Shipping:', order.shippingCharge);
  addRow('GST (18%):', order.gstAmount);
  if (order.couponDiscount) addRow(`Coupon (${order.coupon?.code}):`, `-${order.couponDiscount}`);
  doc.moveTo(350, y).lineTo(555, y).strokeColor('#f5c518').stroke();
  y += 6;
  addRow('TOTAL:', order.total, true);

  // ---- FOOTER ----
  doc.moveDown(4);
  doc.rect(40, doc.y, 515, 1).fill('#f5c518');
  doc.moveDown(0.5);
  doc.fillColor('#666').fontSize(8).font('Helvetica')
    .text('Thank you for choosing Lohar Auto Garage. For support: info@loharautogarage.com', { align: 'center' })
    .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });

  doc.end();
};

module.exports = { generateInvoicePDF };
