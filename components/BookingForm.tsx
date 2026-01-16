import React, { useState, useEffect } from 'react';
import { BookingData, RoomType, getRoomPrice } from '../types';
import { Calendar as CalendarIcon, User, CreditCard, LogIn, LogOut, FileText, Download, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  data: BookingData;
  onChange: (data: BookingData) => void;
  onGenerate: () => void;
  onGenerateImage: () => void;
  isValid: boolean;
  isGenerating: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ data, onChange, onGenerate, onGenerateImage, isValid, isGenerating }) => {
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const handleChange = (field: keyof BookingData, value: string) => {
    const newData = { ...data, [field]: value };
    
    // Auto-adjust Check-out if it becomes invalid (before check-in)
    if (field === 'checkIn' && newData.checkOut && newData.checkOut <= value) {
        const d = new Date(value + 'T00:00:00'); // Safe parsing
        d.setDate(d.getDate() + 1);
        newData.checkOut = d.toISOString().split('T')[0];
    }
    
    onChange(newData);
  };

  // --- Calendar Logic ---

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Parse YYYY-MM-DD to local Date object (ignoring time)
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };
  
  // Format YYYY-MM-DD to DD/MM/YYYY for display inputs
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const checkInDate = parseDate(data.checkIn);
  const checkOutDate = parseDate(data.checkOut);

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format to YYYY-MM-DD manually to avoid timezone issues
    const year = clickedDate.getFullYear();
    const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(clickedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;

    if (!data.checkIn || (data.checkIn && data.checkOut)) {
      // Start new selection
      onChange({ ...data, checkIn: dateString, checkOut: '' });
    } else if (data.checkIn && !data.checkOut) {
      // Logic for second click
      if (clickedDate < (checkInDate as Date)) {
        // User clicked before checkin, make this the new checkin
        onChange({ ...data, checkIn: dateString });
      } else if (dateString === data.checkIn) {
        // User clicked same date, ignore
      } else {
        // Valid checkout
        onChange({ ...data, checkOut: dateString });
      }
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full" />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let isSelected = false;
      let isRange = false;
      let isStart = false;
      let isEnd = false;

      if (data.checkIn === dateStr) {
        isSelected = true;
        isStart = true;
      }
      if (data.checkOut === dateStr) {
        isSelected = true;
        isEnd = true;
      }
      
      if (checkInDate && checkOutDate && dateObj > checkInDate && dateObj < checkOutDate) {
        isRange = true;
      }

      let btnClass = "h-9 w-full flex items-center justify-center text-sm rounded-full transition-all relative z-10 ";
      
      if (isSelected) {
        btnClass += "bg-gold-600 text-white font-bold hover:bg-gold-700 shadow-md ";
      } else if (isRange) {
        btnClass += "bg-gold-100 text-gold-800 rounded-none "; // Square for range
      } else {
        btnClass += "text-gray-700 hover:bg-gray-100 ";
      }

      // Rounded corners for range edges
      if (isStart && checkOutDate) btnClass += "rounded-r-none rounded-l-full ";
      if (isEnd && checkInDate) btnClass += "rounded-l-none rounded-r-full ";

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={btnClass}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-gold-100 p-2 rounded-lg">
           <FileText className="w-6 h-6 text-gold-700" />
        </div>
        <h2 className="text-xl font-serif font-bold text-gray-800">Datos de Reserva</h2>
      </div>

      <div className="space-y-6">
        
        {/* Guest Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User size={16} /> Nombre(s)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
              placeholder="Ej. Juan Carlos"
              value={data.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido(s)</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
              placeholder="Ej. Pérez"
              value={data.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>
        </div>

        {/* Reservation Date (Hidden logic: usually today, but editable) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <CalendarIcon size={16} /> Fecha de Emisión
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
            value={data.reservationDate}
            onChange={(e) => handleChange('reservationDate', e.target.value)}
          />
        </div>

        {/* Stay Dates & Interactive Calendar */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
             <CalendarIcon className="text-gold-600" size={18} />
             <span className="font-bold text-gray-700">Seleccionar Estancia</span>
          </div>

          {/* Inputs for precise control - READ ONLY to prevent native picker conflict */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Llegada</label>
              <input
                type="text"
                readOnly
                placeholder="Seleccione abajo"
                className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-gold-400 outline-none cursor-default"
                value={formatDisplayDate(data.checkIn)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Salida</label>
              <input
                type="text"
                readOnly
                placeholder="Seleccione abajo"
                className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-gold-400 outline-none cursor-default"
                value={formatDisplayDate(data.checkOut)}
              />
            </div>
          </div>

          {/* Visual Calendar */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <span className="font-serif font-bold text-lg text-gray-800">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {renderCalendar()}
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2 text-center">
             Seleccione primero la fecha de llegada, luego la fecha de salida.
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <CreditCard size={16} /> Tipo de Habitación
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all appearance-none bg-white"
              value={data.roomType}
              onChange={(e) => handleChange('roomType', e.target.value as RoomType)}
            >
              {Object.values(RoomType).map((type) => {
                 // Calculate price for this option based on currently selected CheckIn date
                 const price = getRoomPrice(type, data.checkIn);
                 return (
                    <option key={type} value={type}>
                      {type} - ${price.toFixed(2)}
                    </option>
                 );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <p className="text-right text-sm text-gold-700 font-semibold mt-2">
            Precio actual: ${getRoomPrice(data.roomType, data.checkIn).toFixed(2)} MXN
          </p>
        </div>

        {/* Validation Warning */}
        {!isValid && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>Por favor complete todos los campos (Nombre, Apellido, Fechas) para habilitar las descargas.</span>
          </div>
        )}

        {/* Action Buttons - Visually Distinct */}
        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          
          {/* PDF Button - Red Theme */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2
              ${!isValid || isGenerating
                ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 hover:shadow-red-200 hover:-translate-y-0.5'
              }`}
          >
             {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
             <span>{isGenerating ? 'Procesando...' : 'Descargar PDF'}</span>
          </button>
          
          {/* Image Button - Blue/Brand Theme */}
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={!isValid || isGenerating}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2
              ${!isValid || isGenerating
                ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-900 hover:shadow-blue-200 hover:-translate-y-0.5'
              }`}
          >
             {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
             <span>{isGenerating ? 'Procesando...' : 'Descargar Imagen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;