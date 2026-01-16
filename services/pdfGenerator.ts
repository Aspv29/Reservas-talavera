import { jsPDF } from 'jspdf';
import { BookingData, BookingSummary, HOTEL_LOGO } from '../types';

export const generateConfirmationPDF = async (data: BookingData, summary: BookingSummary) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helpers
  const formatMoney = (amount: number) => `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  let y = 20;

  // --- HEADER ---
  // Blue Color: #1a237e (RGB: 26, 35, 126)
  doc.setTextColor(26, 35, 126); 
  
  // Title Text (Centered)
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("H O T E L", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(18);
  doc.text("TALAVERA", pageWidth / 2, y, { align: "center", charSpace: 1.5 });
  
  // Decorative line under TALAVERA
  const cx = pageWidth / 2;
  doc.setDrawColor(26, 35, 126); 
  doc.setLineWidth(0.5);
  doc.line(cx - 25, y + 2, cx + 25, y + 2);
  
  // REMOVED: The triangle characters that looked like fractions
  // y += 7;
  // doc.setFontSize(8);
  // doc.text("▼ ▼ ▼ ▼ ▼ ▼", pageWidth / 2, y, { align: "center", charSpace: 1 });
  
  // --- LOGO IMAGE ---
  // Centered below the header
  const logoSize = 22; 
  y += 8; // Adjusted spacing since triangles are gone
  
  try {
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(HOTEL_LOGO, 'PNG', logoX, y, logoSize, logoSize);
  } catch (e) {
    console.error("Error adding logo:", e);
  }
  
  // Move Y down past the logo for the body text
  y += logoSize + 10;

  // --- INTRO ---
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont("helvetica", "normal"); // Using Helvetica as standard sans-serif
  doc.setFontSize(10);
  
  const intro = "ESTIMADO HUÉSPED, para Hotel Talavera le es grato confirmar su reservación con los siguientes datos:";
  doc.text(intro, margin, y, { maxWidth: contentWidth });
  y += 10;

  // --- DETAILS ---
  // Helper to draw mixed color lines
  // segments: [{text, color?, bold?, underline?}]
  const drawRichText = (x: number, y: number, segments: any[]) => {
    let currentX = x;
    segments.forEach(seg => {
      doc.setFont("helvetica", seg.bold ? "bold" : "normal");
      if (seg.color === 'red') doc.setTextColor(200, 0, 0);
      else if (seg.color === 'blue') doc.setTextColor(0, 0, 200);
      else doc.setTextColor(0, 0, 0);

      doc.text(seg.text, currentX, y);
      
      const width = doc.getTextWidth(seg.text);
      if (seg.underline) {
        doc.setDrawColor(seg.color === 'red' ? 200 : 0, 0, seg.color === 'blue' ? 200 : 0);
        doc.setLineWidth(0.3);
        doc.line(currentX, y + 1, currentX + width, y + 1);
      }
      currentX += width; // Simple spacing
    });
  };

  const lineSpacing = 7;

  // Folio
  drawRichText(margin, y, [
    { text: "Número de reservación: ", bold: true },
    { text: summary.folio, bold: true }
  ]);
  y += lineSpacing + 4;

  // Guest
  drawRichText(margin, y, [{ text: "Huésped:", bold: true }]);
  y += lineSpacing;
  // Indented guest name
  drawRichText(margin + 10, y, [{ text: `${data.firstName} ${data.lastName}`.toUpperCase(), bold: false }]);
  y += lineSpacing + 4;

  // Arrival
  drawRichText(margin + 10, y, [
    { text: "Fecha de llegada: ", bold: true },
    { text: `${formatDate(data.checkIn)} `, bold: false },
    { text: "Check in: ", bold: true, color: 'red' },
    { text: "15:00 HRS", bold: true, color: 'red', underline: true }
  ]);
  y += lineSpacing;

  // Departure
  drawRichText(margin + 10, y, [
    { text: "Fecha de salida: ", bold: true },
    { text: `${formatDate(data.checkOut)} `, bold: false },
    { text: "Check out: ", bold: true, color: 'red' },
    { text: "13:00 HRS", bold: true, color: 'red', underline: true }
  ]);
  y += lineSpacing + 8;

  // Bullets
  const bullet = "•  ";
  
  // Room Type
  drawRichText(margin, y, [
    { text: bullet + "TIPO DE HABITACION: ", bold: true },
    { text: data.roomType.toUpperCase(), bold: false }
  ]);
  y += lineSpacing + 4;

  // Price
  drawRichText(margin, y, [
    { text: bullet + "COSTO POR NOCHE: ", bold: true },
    { text: formatMoney(summary.pricePerNight), bold: true }
  ]);
  y += lineSpacing + 4;

  // Total
  drawRichText(margin, y, [
    { text: bullet + `TOTAL, DE 1 HABITACION POR ${summary.nights} NOCHE: `, bold: true },
    { text: formatMoney(summary.totalCost), bold: true }
  ]);
  y += lineSpacing + 4;

  // Breakfast
  drawRichText(margin, y, [
    { text: bullet + "DESAYUNO CONTINENTAL INCLUIDO: ", bold: true },
    { text: "(CAFÉ, PAN Y FRUTA)", bold: true, color: 'red' }
  ]);
  y += lineSpacing + 10;

  // --- POLICIES ---
  
  // Reservation Policy
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text("POLITICAS DE RESERVACIÓN", margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1, margin + 55, y + 1); // Underline header
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  // We need to construct the paragraph manually to handle inline red text
  // This is a simplified approximation for jsPDF as it doesn't support rich text wrapping easily.
  // We will print line by line based on estimated width.
  
  const p1_lines = [
    "Le proporcionamos el número de cuenta bancaria para realizar el depósito correspondiente a la primera noche",
    "de su hospedaje"
  ];
  p1_lines.forEach(line => { doc.text(line, margin, y); y += 4; });
  
  // "5 días previos..." line
  drawRichText(margin, y, [
    { text: "5 días previos", color: 'red', bold: true },
    { text: " a su llegada, en caso de ", color: 'black' },
    { text: "TRANSFERENCIA", bold: true },
    { text: " favor de capturar como referencia su" }
  ]);
  y += 4;
  
  drawRichText(margin, y, [
    { text: "NÚMERO DE RESERVA", bold: true },
    { text: " y enviar el comprobante a " },
    { text: "hoteltalaveratez@gmail.com", color: 'blue', underline: true },
    { text: " o vía WhatsApp al número" }
  ]);
  y += 4;
  
  drawRichText(margin, y, [
    { text: "231-145-6385", bold: true },
    { text: " favor de considerar la fecha límite que se le indique para realizar su pago a fin de garantizar su" }
  ]);
  y += 4;
  doc.text("reservación.", margin, y);
  
  y += 10;

  // BANK INFO
  doc.setFont("helvetica", "bold");
  doc.text("BANORTE", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text("HOTEL TALAVERA SA DE CV", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text("CLABE: 072672011703632434", pageWidth / 2, y, { align: "center" });
  y += 10;

  // CANCELLATION
  doc.setFont("helvetica", "normal");
  drawRichText(margin, y, [
    { text: "POLÍTICAS DE CANCELACIÓN. ", bold: true },
    { text: "Para cancelar una reservación favor de considerar " },
    { text: "72 horas", color: 'red', bold: true },
    { text: " previas a la fecha de" }
  ]);
  y += 4;
  doc.text("llegada, de lo contrario no hay reembolso.", margin, y);
  y += 8;

  // INVOICE
  doc.setFont("helvetica", "bold");
  doc.text("¿Requiere FACTURA?", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  
  drawRichText(margin, y, [
    { text: "De ser así por favor envíe vía WhatsApp al número " },
    { text: "231-145-6385", bold: true },
    { text: " su " },
    { text: "CONSTANCIA DE SITUACIÓN FISCAL.", bold: true }
  ]);
  y += 4;
  doc.text("Hotel Talavera agradece su preferencia, ¡Esperamos que disfrute su estancia!", margin, y);
  
  // FOOTER (Privacy)
  y = pageHeight - 35; // Stick to bottom
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const privacy = "Aviso de Privacidad: De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, en los artículos 3, Fracciones II y VII, y 33, así como la denominación del capítulo II, del Título Segundo, de la Ley Federal de Transparencia y Acceso a la Información Pública Gubernamental, le informamos que toda su información personal en nuestras bases de datos no está a la venta ni disponible para su comercialización con terceros.";
  const splitPrivacy = doc.splitTextToSize(privacy, contentWidth);
  doc.text(splitPrivacy, margin, y);

  doc.save(`Reservacion_${summary.folio}.pdf`);
};
