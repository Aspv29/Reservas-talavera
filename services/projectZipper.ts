import JSZip from 'jszip';

// Helper to escape backticks for the template strings below if necessary
// (Not strictly needed if we are careful, but good practice)

const PACKAGE_JSON = `{
  "name": "hotel-talavera-confirmation",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.292.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}`;

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`;

const TS_CONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

const TS_CONFIG_NODE = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#c68652" />
    <title>Hotel Talavera - Confirmation System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              serif: ['Playfair Display', 'serif'],
            },
            colors: {
              gold: {
                50: '#fbf8f1',
                100: '#f5efe0',
                200: '#eaddc2',
                300: '#dec29a',
                400: '#d2a373',
                500: '#c68652',
                600: '#ba6e45',
                700: '#9b563b',
                800: '#7f4536',
                900: '#663a2e',
              }
            }
          }
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export const downloadSourceCode = async (
  files: Record<string, string>
) => {
  const zip = new JSZip();

  // Root configuration files
  zip.file("package.json", PACKAGE_JSON);
  zip.file("vite.config.ts", VITE_CONFIG);
  zip.file("tsconfig.json", TS_CONFIG);
  zip.file("tsconfig.node.json", TS_CONFIG_NODE);
  zip.file("index.html", INDEX_HTML);
  zip.file(".gitignore", "node_modules\ndist\n.DS_Store");

  // Public folder
  const publicFolder = zip.folder("public");
  if (files['manifest.json']) publicFolder?.file("manifest.json", files['manifest.json']);
  if (files['sw.js']) publicFolder?.file("sw.js", files['sw.js']);

  // Source folder
  const src = zip.folder("src");
  
  // Map index.tsx to main.tsx for standard Vite convention
  if (files['index.tsx']) src?.file("main.tsx", files['index.tsx']);
  if (files['App.tsx']) src?.file("App.tsx", files['App.tsx']);
  if (files['types.ts']) src?.file("types.ts", files['types.ts']);
  
  // Components
  const components = src?.folder("components");
  if (files['components/BookingForm.tsx']) components?.file("BookingForm.tsx", files['components/BookingForm.tsx']);
  if (files['components/LivePreview.tsx']) components?.file("LivePreview.tsx", files['components/LivePreview.tsx']);
  
  // Services
  const services = src?.folder("services");
  if (files['services/pdfGenerator.ts']) services?.file("pdfGenerator.ts", files['services/pdfGenerator.ts']);

  // Pages
  const pages = src?.folder("pages");
  if (files['pages/index.tsx']) pages?.file("index.tsx", files['pages/index.tsx']);

  // Generate ZIP
  const content = await zip.generateAsync({ type: "blob" });
  
  // Trigger download
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = "hotel-talavera-source.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};