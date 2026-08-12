import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { QuizFunnel } from './components/QuizFunnel';

export default function SeoLanding() {
  useEffect(() => {
    document.title = "Free Design Consultation & Quote | Studio Visionary";
    
    const metaDesc = document.createElement('meta');
    metaDesc.name = "description";
    metaDesc.content = "Leading architectural firm specializing in modern home renovation, custom interior design, commercial construction, real estate development, and branding.";
    document.head.appendChild(metaDesc);
    const metaKeywords = document.createElement('meta');
    metaKeywords.name = "keywords";
    metaKeywords.content = "architectural design, interior design, home renovation, custom home builders, commercial construction, real estate development, spatial branding, architectural visualization, 3D rendering, modern architecture, luxury home remodeling";
    document.head.appendChild(metaKeywords);
    
    return () => {
      document.head.removeChild(metaDesc);
      document.head.removeChild(metaKeywords);
    };
  }, []);

  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#111] min-h-screen text-white font-sans selection:bg-white/30 selection:text-white pb-20 relative overflow-hidden">
      {/* Subtle Background Image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#111]/90 mix-blend-multiply z-10" />
        <img 
          src="/og-image.jpg" 
          alt="" 
          className="w-full h-full object-cover opacity-10 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-transparent to-[#111] z-20" />
      </div>

      <header className="p-6 md:p-8 border-b border-white/10 sticky top-0 bg-[#111]/90 backdrop-blur-md z-50 flex justify-between items-center relative">
        <div className="max-w-[1400px] w-full mx-auto flex justify-between items-center">
          <div className="text-xs font-bold tracking-widest uppercase">
            STUDIO VISIONARY
          </div>
          <div className="flex gap-4 text-[10px] font-bold tracking-widest uppercase text-white/50">
            <a href="https://www.instagram.com/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://www.linkedin.com/in/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </header>
      
      <main className="w-full relative z-10">
        <section className="w-full max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start min-h-[80vh]">
          <div className="flex flex-col pt-4 lg:pt-12">
            <div className="self-start px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 mb-6">
              Planning a renovation or new build?
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter mb-6 leading-[1.1] text-[#1a3a6e]">
              Get a Free 30-Minute Design Consultation + Initial Quote
            </h1>
            <p className="text-lg text-white/50 font-light mb-10 max-w-xl">
              Tell us about your project in 3 quick taps. We'll review your answers before the call and come prepared with ideas, a timeline, and an initial quote — free.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/80 font-light">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" />
                <span>Free 30-minute consultation with the studio</span>
              </li>
              <li className="flex items-center gap-3 text-white/80 font-light">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" />
                <span>Initial quote prepared after your call</span>
              </li>
              <li className="flex items-center gap-3 text-white/80 font-light">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" />
                <span>Residential, commercial, and brand-driven spaces</span>
              </li>
              <li className="flex items-center gap-3 text-white/80 font-light">
                <CheckCircle2 className="w-5 h-5 text-white/40 shrink-0" />
                <span>3D architectural visualization expertise</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full">
            <QuizFunnel />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40 tracking-widest uppercase relative z-10">
        <p>&copy; {new Date().getFullYear()} Studio Visionary. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-white transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
