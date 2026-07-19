const PDFDocument = require('pdfkit');

const generateInvoicePdf = (order, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the document to the stream (usually res)
  doc.pipe(stream);

  // --- HEADER ---
  doc
    .fillColor('#333333')
    .fontSize(20)
    .text('ApexCart E-Commerce', 50, 45)
    .fontSize(10)
    .text('123 Innovation Way, Suite 500', 50, 65)
    .text('Silicon Valley, CA 94025', 50, 80)
    .text('support@apexcart.com', 50, 95)
    .fontSize(20)
    .text('INVOICE', 400, 45, { align: 'right' })
    .fontSize(9)
    .text(`Invoice Number: INV-${order._id.toString().toUpperCase().slice(-6)}`, 400, 70, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 85, { align: 'right' })
    .text(`Order Status: ${order.orderStatus.toUpperCase()}`, 400, 100, { align: 'right' });

  doc.moveDown(2);
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();

  // --- CLIENT DETAILS ---
  doc
    .fontSize(12)
    .text('Bill To:', 50, 145)
    .fontSize(10)
    .text(order.billingAddress.street, 50, 165)
    .text(`${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zipCode}`, 50, 180)
    .text(order.billingAddress.country, 50, 195)
    .text(`Phone: ${order.billingAddress.phone}`, 50, 210)
    
    .fontSize(12)
    .text('Ship To:', 300, 145)
    .fontSize(10)
    .text(order.shippingAddress.street, 300, 165)
    .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 300, 180)
    .text(order.shippingAddress.country, 300, 195)
    .text(`Phone: ${order.shippingAddress.phone}`, 300, 210);

  doc.moveDown(2);

  // --- ITEMS TABLE ---
  let tableTop = 250;
  
  // Table Header
  doc
    .fontSize(10)
    .text('Item Description', 50, tableTop, { bold: true })
    .text('Price', 280, tableTop, { width: 80, align: 'right' })
    .text('Qty', 370, tableTop, { width: 50, align: 'right' })
    .text('Total', 450, tableTop, { width: 100, align: 'right' });

  doc.strokeColor('#e6e6e6').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let position = tableTop + 25;
  order.orderItems.forEach((item) => {
    // Truncate name if too long
    const itemName = item.name.length > 30 ? item.name.substring(0, 27) + '...' : item.name;
    
    doc
      .fontSize(9)
      .text(itemName, 50, position)
      .text(`$${item.price.toFixed(2)}`, 280, position, { width: 80, align: 'right' })
      .text(item.quantity.toString(), 370, position, { width: 50, align: 'right' })
      .text(`$${(item.price * item.quantity).toFixed(2)}`, 450, position, { width: 100, align: 'right' });

    position += 20;
  });

  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, position + 5).lineTo(550, position + 5).stroke();

  // --- TOTALS ---
  let totalsPosition = position + 20;
  const subTotal = order.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  doc
    .fontSize(9)
    .text('Subtotal:', 350, totalsPosition, { width: 100, align: 'right' })
    .text(`$${subTotal.toFixed(2)}`, 450, totalsPosition, { width: 100, align: 'right' });

  if (order.discountAmount > 0) {
    totalsPosition += 15;
    doc
      .text('Discount:', 350, totalsPosition, { width: 100, align: 'right' })
      .text(`-$${order.discountAmount.toFixed(2)}`, 450, totalsPosition, { width: 100, align: 'right' });
  }

  totalsPosition += 15;
  doc
    .text('Tax (15%):', 350, totalsPosition, { width: 100, align: 'right' })
    .text(`$${order.taxPrice.toFixed(2)}`, 450, totalsPosition, { width: 100, align: 'right' });

  totalsPosition += 15;
  doc
    .text('Shipping:', 350, totalsPosition, { width: 100, align: 'right' })
    .text(`$${order.shippingPrice.toFixed(2)}`, 450, totalsPosition, { width: 100, align: 'right' });

  totalsPosition += 20;
  doc
    .fontSize(12)
    .text('Total Paid:', 350, totalsPosition, { width: 100, align: 'right', bold: true })
    .text(`$${order.totalPrice.toFixed(2)}`, 450, totalsPosition, { width: 100, align: 'right', bold: true });

  // --- FOOTER ---
  doc
    .fontSize(10)
    .fillColor('#777777')
    .text('Thank you for shopping with ApexCart!', 50, 700, { align: 'center', width: 500 })
    .text('If you have any questions about this invoice, contact our support team.', 50, 715, { align: 'center', width: 500 });

  doc.end();
};

module.exports = generateInvoicePdf;
