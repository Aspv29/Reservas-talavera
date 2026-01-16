import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookingData, BookingSummary, RoomType, getRoomPrice } from './types';
import BookingForm from './components/BookingForm';
import LivePreview from './components/LivePreview';
import { generateConfirmationPDF } from './services/pdfGenerator';
import { downloadSourceCode } from './services/projectZipper';
import { Building2, Download, Code } from 'lucide-react';
import html2canvas from 'html2canvas';

// Hardcoded file contents for the zipper functionality
// In a real dev environment, these would be read from the file system,
// but here we must provide them to the zipper utility.
import { HOTEL_LOGO } from './types'; // We'll just import the logo to ensure types works, but for strings we need raw content.

// We need to fetch the raw text of the files to zip them. 
// Since we are in a browser environment simulating a file system, 
// we will rely on fetching the module scripts if possible, or 
// use a predefined map if strict fetching fails.
// For this environment, we will construct the map from the known file states provided by the user context.

// NOTE: To save space and ensure accuracy, we will fetch these files relative to the current URL
// assuming the host serves them raw, OR we pass the known content string. 
// Given the limitations, we will try to fetch the files using `fetch`.

const FILES_TO_FETCH = [
  'index.tsx',
  'App.tsx',
  'types.ts',
  'metadata.json',
  'manifest.json',
  'sw.js',
  'services/pdfGenerator.ts',
  'components/BookingForm.tsx',
  'components/LivePreview.tsx',
  'pages/index.tsx'
];

const App: React.FC = () => {
  // Initialize state with default values (today's date for reservation)
  const today = new Date().toISOString().split('T')[0];
  
  const [bookingData, setBookingData] = useState<BookingData>({
    firstName: '',
    lastName: '',
    reservationDate: today,
    checkIn: '',
    checkOut: '',
    roomType: RoomType.STANDARD
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  // Ref for the LivePreview component
  const previewRef = useRef<HTMLDivElement>(null);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  // Calculate summary derived state
  const summary = useMemo<BookingSummary>(() => {
    // 1. Calculate Folio: Lastname + CheckIn(DDMMYYYY)
    let folio = "---";
    if (bookingData.lastName && bookingData.checkIn) {
      const cleanLastName = bookingData.lastName.trim().toUpperCase().replace(/\s+/g, '');
      const [y, m, d] = bookingData.checkIn.split('-');
      folio = `${cleanLastName}${d}${m}${y}`;
    }

    // 2. Calculate Nights
    let nights = 0;
    if (bookingData.checkIn && bookingData.checkOut) {
      const start = new Date(bookingData.checkIn);
      const end = new Date(bookingData.checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      nights = diffDays > 0 ? diffDays : 0;
    }

    // 3. Price (Dynamic based on month of CheckIn)
    const pricePerNight = getRoomPrice(bookingData.roomType, bookingData.checkIn);
    const totalCost = nights * pricePerNight;

    return {
      folio,
      nights,
      pricePerNight,
      totalCost
    };
  }, [bookingData]);

  // Validation
  const isValid = useMemo(() => {
    return (
      bookingData.firstName.trim().length > 0 &&
      bookingData.lastName.trim().length > 0 &&
      bookingData.reservationDate !== '' &&
      bookingData.checkIn !== '' &&
      bookingData.checkOut !== '' &&
      summary.nights > 0
    );
  }, [bookingData, summary.nights]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
        try {
            await generateConfirmationPDF(bookingData, summary);
        } catch (error) {
            console.error(error);
            alert("Error al generar el PDF");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  const handleGenerateImage = async () => {
    if (!previewRef.current) return;
    
    setIsGenerating(true);
    try {
        // Use html2canvas to capture the DOM element
        const canvas = await html2canvas(previewRef.current, {
            scale: 2, // Higher quality
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Convert to data URL
        const image = canvas.toDataURL("image/png");
        
        // Create link and download
        const link = document.createElement('a');
        link.href = image;
        link.download = `Reservacion_${summary.folio}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Image generation failed", error);
        alert("Error al generar la imagen");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownloadSource = async () => {
    setIsZipping(true);
    try {
      const fileContents: Record<string, string> = {};
      
      // In this specific environment, we will fetch the files that make up the app.
      // NOTE: This assumes the server serves the raw files at these paths.
      // If this fails (e.g. strict bundling), we would need to embed the strings.
      // Assuming a standard dev server structure:
      
      await Promise.all(FILES_TO_FETCH.map(async (path) => {
        try {
          const response = await fetch(`./${path}`);
          if (response.ok) {
            const text = await response.text();
            fileContents[path] = text;
          } else {
            console.warn(`Could not fetch ${path}`);
          }
        } catch (e) {
          console.warn(`Error fetching ${path}`, e);
        }
      }));

      // If fetching fails (common in some bundlers), we might need fallback.
      // However, usually '.' works for public files. For source, it depends.
      // Let's check if we got index.tsx.
      if (!fileContents['index.tsx']) {
         alert("No se pudo acceder al código fuente directamente desde el navegador. (Restricción de seguridad del entorno)");
         return;
      }

      await downloadSourceCode(fileContents);
    } catch (error) {
      console.error("Zip generation failed", error);
      alert("Error al comprimir el proyecto");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex flex-col font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-gold-600 w-8 h-8" />
            <div>
              <h1 className="text-xl font-serif font-bold text-gray-900 leading-none">HOTEL TALAVERA</h1>
              <p className="text-xs text-gold-600 tracking-wider">SYSTEMA DE RESERVACIONES</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Download Source Code Button */}
             <button
               onClick={handleDownloadSource}
               disabled={isZipping}
               className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gold-600 transition-colors text-sm"
               title="Descargar código fuente"
             >
                <Code size={16} />
                <span>{isZipping ? 'Comprimiendo...' : 'Código'}</span>
             </button>

             {deferredPrompt && (
               <button 
                 onClick={handleInstallClick}
                 className="flex items-center gap-2 bg-gold-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gold-700 transition-colors shadow-sm"
               >
                 <Download size={16} />
                 <span className="hidden sm:inline">Instalar App</span>
               </button>
             )}
             <div className="hidden sm:block text-sm text-gray-500">
               {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Form */}
          <div className="h-full">
             <BookingForm 
                data={bookingData} 
                onChange={setBookingData}
                onGenerate={handleGeneratePDF}
                onGenerateImage={handleGenerateImage}
                isValid={isValid}
                isGenerating={isGenerating}
             />
          </div>

          {/* Right Column: Preview */}
          <div className="h-full min-h-[500px] lg:min-h-0">
             <LivePreview 
                ref={previewRef}
                data={bookingData} 
                summary={summary} 
             />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center text-sm text-gray-400">
          <div>&copy; {new Date().getFullYear()} Hotel Talavera. Todos los derechos reservados.</div>
          <button 
             onClick={handleDownloadSource}
             className="md:hidden flex items-center gap-1 text-xs text-gray-400 underline"
          >
             Descargar Código Fuente
          </button>
        </div>
      </footer>

    </div>
  );
};

export default App;