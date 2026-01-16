import React, { forwardRef } from 'react';
import { BookingData, BookingSummary, HOTEL_LOGO } from '../types';

interface LivePreviewProps {
  data: BookingData;
  summary: BookingSummary;
}

const LivePreview = forwardRef<HTMLDivElement, LivePreviewProps>(({ data, summary }, ref) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const displayRoomType = data.roomType.toUpperCase();
  const formatMoney = (amount: number) => `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="bg-gray-800 text-white p-4 text-center shrink-0">
        <h3 className="text-sm font-medium tracking-widest uppercase">Vista Previa</h3>
      </div>
      
      {/* Scrollable Container */}
      <div className="flex-1 bg-gray-200 p-4 md:p-8 overflow-y-auto flex justify-center">
        
        {/* Paper simulation - EXACT SIZE & CONTENT */}
        <div 
          ref={ref} 
          id="capture-target"
          className="bg-white shadow-lg shrink-0 text-black font-sans relative flex flex-col"
          style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }} 
        >
          {/* Header / Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="text-center text-[#1a237e] mb-2 w-full flex flex-col items-center">
               <div className="font-serif text-xs font-bold tracking-widest text-blue-900">H O T E L</div>
               <div className="font-serif text-3xl font-bold tracking-widest mt-1 text-blue-900">TALAVERA</div>
               
               {/* Decorative line */}
               <div className="w-12 h-px bg-blue-900 my-2"></div>
               
               {/* REMOVED: Decorative triangles that looked like fractions */}
            </div>
            
            {/* Logo Image */}
            <div className="mt-2">
              <img src={HOTEL_LOGO} alt="Hotel Talavera Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Intro */}
          <div className="mb-6 text-sm text-justify">
            ESTIMADO HUÉSPED, para Hotel Talavera le es grato confirmar su reservación con los siguientes datos:
          </div>

          {/* Details */}
          <div className="space-y-4 text-sm mb-8">
            <div className="flex gap-2">
              <span className="font-bold">Número de reservación:</span>
              <span className="font-bold">{summary.folio}</span>
            </div>

            <div>
              <div className="font-bold mb-1">Huésped:</div>
              <div className="ml-4 uppercase">{data.firstName} {data.lastName}</div>
            </div>

            <div className="ml-4 space-y-1">
               <div>
                 <span className="font-bold">Fecha de llegada:</span> {formatDate(data.checkIn)} <span className="font-bold text-red-700">Check in:</span> <span className="font-bold text-red-700 underline">15:00 HRS</span>
               </div>
               <div>
                 <span className="font-bold">Fecha de salida:</span> {formatDate(data.checkOut)} <span className="font-bold text-red-700">Check out:</span> <span className="font-bold text-red-700 underline">13:00 HRS</span>
               </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <span>•</span>
                <span className="font-bold">TIPO DE HABITACION:</span>
                <span>{displayRoomType}</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span className="font-bold">COSTO POR NOCHE:</span>
                <span className="font-bold">{formatMoney(summary.pricePerNight)}</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span className="font-bold">TOTAL, DE 1 HABITACION POR {summary.nights} NOCHE:</span>
                <span className="font-bold">{formatMoney(summary.totalCost)}</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span className="font-bold">DESAYUNO CONTINENTAL INCLUIDO:</span>
                <span className="font-bold text-red-700">(CAFÉ, PAN Y FRUTA)</span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="mb-6">
            <h4 className="font-bold border-b border-black inline-block mb-2 text-sm">POLITICAS DE RESERVACIÓN</h4>
            <div className="text-xs space-y-2 text-justify leading-relaxed">
              <p>
                Le proporcionamos el número de cuenta bancaria para realizar el depósito correspondiente a la primera noche de su hospedaje
              </p>
              <p>
                <span className="font-bold text-red-700">5 días previos</span> a su llegada, en caso de <span className="font-bold">TRANSFERENCIA</span> favor de capturar como referencia su <span className="font-bold">NÚMERO DE RESERVA</span> y enviar el comprobante a <span className="text-blue-700 underline">hoteltalaveratez@gmail.com</span> o vía WhatsApp al número <span className="font-bold">231-145-6385</span> favor de considerar la fecha límite que se le indique para realizar su pago a fin de garantizar su reservación.
              </p>
            </div>
          </div>

          {/* Bank Info */}
          <div className="text-center font-bold text-xs mb-6 space-y-1">
            <div>BANORTE</div>
            <div>HOTEL TALAVERA SA DE CV</div>
            <div>CLABE: 072672011703632434</div>
          </div>

          {/* Cancellation */}
          <div className="text-xs mb-6 text-justify">
            <span className="font-bold">POLÍTICAS DE CANCELACIÓN.</span> Para cancelar una reservación favor de considerar <span className="font-bold text-red-700">72 horas</span> previas a la fecha de llegada, de lo contrario no hay reembolso.
          </div>

          {/* Invoice */}
          <div className="text-xs mb-8 text-justify">
            <div className="font-bold mb-1">¿Requiere FACTURA?</div>
            <div>
              De ser así por favor envíe vía WhatsApp al número <span className="font-bold">231-145-6385</span> su <span className="font-bold">CONSTANCIA DE SITUACIÓN FISCAL.</span>
            </div>
            <div className="mt-2">
              Hotel Talavera agradece su preferencia, ¡Esperamos que disfrute su estancia!
            </div>
          </div>

          {/* Footer / Privacy */}
          <div className="mt-auto pt-4 text-[7px] text-gray-500 text-justify leading-tight">
            Aviso de Privacidad: De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, en los artículos 3, Fracciones II y VII, y 33, así como la denominación del capítulo II, del Título Segundo, de la Ley Federal de Transparencia y Acceso a la Información Pública Gubernamental, le informamos que toda su información personal en nuestras bases de datos no está a la venta ni disponible para su comercialización con terceros.
          </div>

        </div>
      </div>
    </div>
  );
});

export default LivePreview;
