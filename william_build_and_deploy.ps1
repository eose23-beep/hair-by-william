Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "     WILLIAM PORTFOLIO - THE CINEMATIC OVERHAUL (V19)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Force directory switch to project root
$TargetProjectFolder = "C:\Users\SysMigrator\william-site"
if (Test-Path $TargetProjectFolder) {
    Set-Location $TargetProjectFolder
    Write-Host "[+] Working directory safely locked to: $TargetProjectFolder" -ForegroundColor Green
} else {
    Write-Host "[-] FATAL: Project directory $TargetProjectFolder not found." -ForegroundColor Red
    exit
}

# 2. Cleanup old configurations
Write-Host "[*] Cleaning up base directory file leaks..." -ForegroundColor Yellow
Remove-Item "C:\Users\SysMigrator\tailwind.config.js" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\SysMigrator\postcss.config.js" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\SysMigrator\vite.config.js" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\SysMigrator\index.html" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\SysMigrator\package-lock.json" -Force -ErrorAction SilentlyContinue

Write-Host "[*] Erasing default Vite styling overrides..." -ForegroundColor Yellow
if (Test-Path "src/App.css") {
    Set-Content -Path "src/App.css" -Value "" -Force
}

Write-Host "[*] Purging cached build assets..." -ForegroundColor Yellow
Remove-Item "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

# CRITICAL FIX: Ensure encoding variable is perfectly defined and named
$utf8NoBom = New-Object System.Text.UTF8Encoding($False)

# 3. Build index.html
Write-Host "[*] Injecting HTML & High-End Fonts..." -ForegroundColor Yellow
$indexHtml = @'
<!DOCTYPE html>
<html lang="en" class="dark bg-slate-950 scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>William | Master Hair Extensions & Hair Artistry El Paso</title>
    
    <!-- Load Editorial Serif & Clean Sans Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Inter:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-950 text-white min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-200">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@
[System.IO.File]::WriteAllText("$PWD\index.html", $indexHtml, $utf8NoBom)

# 4. Write main.jsx
Write-Host "[*] Building rendering gateway..." -ForegroundColor Yellow
$mainCode = @'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
'@
[System.IO.File]::WriteAllText("$PWD\src\main.jsx", $mainCode, $utf8NoBom)

# 5. Write Configurations
Write-Host "[*] Rebuilding system styles..." -ForegroundColor Yellow
$viteConfig = @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
'@
[System.IO.File]::WriteAllText("$PWD\vite.config.js", $viteConfig, $utf8NoBom)

$tailwindConfig = @'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pan-slow': 'panImage 30s linear infinite alternate',
      },
      keyframes: {
        panImage: {
          '0%': { transform: 'scale(1.05) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(-2%, -2%)' },
        }
      }
    },
  },
  plugins: [],
}
'@
[System.IO.File]::WriteAllText("$PWD\tailwind.config.js", $tailwindConfig, $utf8NoBom)

$postcssConfig = @'
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
}
'@
[System.IO.File]::WriteAllText("$PWD\postcss.config.js", $postcssConfig, $utf8NoBom)

# 6. Write CSS
$cssContent = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .glass-panel {
    background: rgba(10, 15, 30, 0.45);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}
'@
[System.IO.File]::WriteAllText("$PWD\src\index.css", $cssContent, $utf8NoBom)

# 7. Write the App.jsx Payload
Write-Host "[*] Deploying premium portfolio payload..." -ForegroundColor Yellow
$reactCode = @'
import React, { useState } from 'react';
import { 
  MapPin, Phone, Star, Clock, Award, Sparkles, Scissors, ArrowRight, TrendingUp, ChevronRight, Calendar, Copy, Sliders
} from 'lucide-react';

export default function App() {
  const [activeEstimateTab, setActiveEstimateTab] = useState('extensions');
  const [extensionLength, setExtensionLength] = useState('20');
  const [customColor, setCustomColor] = useState(false);
  const [addHighlights, setAddHighlights] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [copiedText, setCopiedText] = useState(false);
  
  const [consultStep, setConsultStep] = useState(0);
  const [hairType, setHairType] = useState('medium'); 
  const [currentHairLength, setCurrentHairLength] = useState('mid'); 
  const [desiredLook, setDesiredLook] = useState('thick-long'); 

  const galleryItems = [
    {
      title: "Seamless Volume Extensions",
      desc: "Premium nano-bead technique for maximum thickness.",
      before: "https://images.unsplash.com/photo-1595853035070-59a39fe84de3?q=80&w=600&auto=format&fit=crop",
      after: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Platinum Custom Color Melt",
      desc: "Perfect hand-painted balayage with zero line of demarcation.",
      before: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop",
      after: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Brazilian Blowout Elite",
      desc: "Frizz-free mirror shine lasting up to 12 weeks.",
      before: "https://images.unsplash.com/photo-1565438127461-2e698889aa36?q=80&w=600&auto=format&fit=crop",
      after: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=600&auto=format&fit=crop"
    }
  ];

  const testimonials = [
    {
      name: "Sophia L.",
      text: "William is the absolute best for hair extensions in El Paso. I've been coming to him for 3 years, and his seamless nano-bead technique is flawless. Highly recommend Suite 13-C!",
      stars: 5,
      role: "Client since 2023"
    },
    {
      name: "Mariana G.",
      text: "The Platinum Color Melt William did literally went viral on my social media. It grew out so naturally, without any demarcation lines. He is a master of his craft.",
      stars: 5,
      role: "Color Melt Client"
    }
  ];

  const calculatePrice = () => {
    let base = 600;
    if (extensionLength === '24') base += 250;
    if (extensionLength === '20') base += 100;
    if (addHighlights) base += 150;
    return `${base}+`;
  };

  const calculateConsultPrice = () => {
    let price = 500;
    if (hairType === 'thick') price += 150;
    if (currentHairLength === 'short') price += 200; 
    if (desiredLook === 'thick-long') price += 200;
    if (desiredLook === 'extreme-long') price += 400;
    return price;
  };

  const copyBookingText = () => {
    const text = `Hi William! I used your online builder to customize my look. I'd love to request an appointment. Look customized: ${extensionLength}" Extensions${addHighlights ? ' with custom blending' : ''}. Thank you!`;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative w-full h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Cinematic Slow-Pan Background Image (Replaces janky 3D ball) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
          <img 
            src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=2000&auto=format&fit=crop" 
            alt="Cinematic Hair Artistry" 
            className="w-full h-full object-cover opacity-50 animate-pan-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-500/20 backdrop-blur-md">
            <Scissors size={14} />
            <span>LV Hair Salon • Suite 13-C</span>
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-serif font-light tracking-tight text-white drop-shadow-2xl">
            WILLIAM
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            El Paso's premier destination for seamless nano-bead extensions, dimensional color melts, and precision artistry.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="tel:+19159207823" className="px-8 py-4 bg-amber-500 text-slate-950 font-bold rounded-full hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2">
              <Phone size={18} /> Call (915) 920-7823
            </a>
            <a href="#portfolio" className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 flex items-center gap-2">
              View Transformations <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 space-y-16 pb-24">
        
        {/* 2. BRAND STATS / INFO STRIP */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Award size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-white">27+ Years</h3>
              <p className="text-sm text-slate-400 uppercase tracking-widest">Master Experience</p>
            </div>
          </div>
          
          <div className="hidden md:block w-px h-16 bg-white/10" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-white">Certified</h3>
              <p className="text-sm text-slate-400 uppercase tracking-widest">Brazilian Blowout</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-16 bg-white/10" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-slate-200">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="text-xl font-serif text-white">LV Salon 13-C</h3>
              <p className="text-sm text-slate-400 uppercase tracking-widest">5411 N Mesa, El Paso</p>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE SPLIT SLIDER */}
        <section id="portfolio" className="glass-panel rounded-[2.5rem] p-6 sm:p-12 shadow-2xl">
          <div className="text-center space-y-4 mb-10">
            <h2 className="text-4xl sm:text-5xl font-serif font-light text-white">The Art of Transformation</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Drag the golden slider to reveal the seamless transition.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4 flex flex-col gap-3">
              {galleryItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setActiveGalleryIndex(idx); setSliderPosition(50); }}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group ${
                    activeGalleryIndex === idx ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className={`text-xs ${activeGalleryIndex === idx ? 'text-amber-400' : 'text-slate-500'} mb-1 uppercase tracking-widest`}>Look 0{idx + 1}</p>
                  <h3 className="font-serif text-xl text-slate-100">{item.title}</h3>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 select-none">
                {/* Before Image */}
                <div className="absolute inset-0 w-full h-full">
                  <img src={galleryItems[activeGalleryIndex].before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-slate-300">Before</div>
                </div>

                {/* After Image */}
                <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
                  <img src={galleryItems[activeGalleryIndex].after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-6 right-6 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full text-xs font-bold uppercase tracking-widest">After</div>
                </div>

                <input type="range" min="0" max="100" value={sliderPosition} onChange={handleSliderChange} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />

                {/* Golden Divider */}
                <div className="absolute top-0 bottom-0 w-[2px] bg-amber-500 pointer-events-none z-20 shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ left: `${sliderPosition}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-slate-900 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-amber-500 text-sm">↔</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXTENSION CONFIGURATOR */}
        <section className="glass-panel rounded-[2.5rem] p-6 sm:p-12 shadow-2xl">
          <div className="text-center space-y-4 mb-10">
            <h2 className="text-4xl sm:text-5xl font-serif font-light text-white">Virtual Studio Estimator</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Configure your desired length and color profile to generate an instant baseline quote.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold tracking-widest text-amber-400 uppercase flex items-center gap-2"><Sliders size={16}/> Target Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {['16', '20', '24'].map((len) => (
                    <button key={len} onClick={() => setExtensionLength(len)} className={`py-4 rounded-xl text-lg font-serif transition-all ${extensionLength === len ? 'bg-amber-500/20 border border-amber-500 text-white' : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'}`}>
                      {len}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold tracking-widest text-amber-400 uppercase flex items-center gap-2"><Sparkles size={16}/> Color Blending</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setAddHighlights(false)} className={`p-5 rounded-xl border text-left transition-all ${!addHighlights ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                    <div className="font-bold text-slate-100">Solid Tone</div>
                    <span className="text-xs text-slate-400 mt-1 block">Seamless base match.</span>
                  </button>
                  <button onClick={() => setAddHighlights(true)} className={`p-5 rounded-xl border text-left transition-all ${addHighlights ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                    <div className="font-bold text-slate-100">Dimensional</div>
                    <span className="text-xs text-slate-400 mt-1 block">Custom highlights added.</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
              <span className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-4">Estimated Investment</span>
              <p className="text-7xl font-serif text-white tracking-tight">${calculatePrice()}</p>
              
              <button onClick={copyBookingText} className="mt-8 w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2">
                <Copy size={18} /> {copiedText ? 'Copied to Clipboard!' : 'Copy Config for Booking'}
              </button>
              <p className="text-xs text-slate-500 mt-4 max-w-xs mx-auto">Copy this configuration to easily text William and secure your spot.</p>
            </div>
          </div>
        </section>

        {/* 5. FOOTER */}
        <footer className="text-center pt-8 border-t border-white/10">
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">
            William • LV Hair Salon © 2026
          </p>
        </footer>

      </main>
    </div>
  );
}
'@
[System.IO.File]::WriteAllText("$PWD\src\App.jsx", $reactCode, $utf8NoBom)

Write-Host "[+] SUCCESS! Cinematic Video Overhaul (V19) successfully deployed." -ForegroundColor Green
Write-Host "[*] Booting server..." -ForegroundColor Green
npm run dev -- --open