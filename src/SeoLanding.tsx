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
    <div className="bg-[#111] min-h-screen text-white font-sans selection:bg-white/30 selection:text-white pb-20">
      <header className="p-6 md:p-8 border-b border-white/10 sticky top-0 bg-[#111]/90 backdrop-blur-md z-50">
        <div className="max-w-[1400px] mx-auto text-xs font-bold tracking-widest uppercase">
          STUDIO VISIONARY
        </div>
      </header>
      
      <main className="w-full">
        <section className="w-full max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start min-h-[80vh]">
          <div className="flex flex-col pt-4 lg:pt-12">
            <div className="self-start px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 mb-6">
              Planning a renovation or new build?
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter mb-6 leading-[1.1]">
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

        <section className="max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16 mt-12 border-t border-white/10">
          <h2 className="text-2xl tracking-[0.2em] uppercase font-bold text-white/70 mb-8 border-l-2 border-white pl-4">
            Our Expertise in Construction & Development
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="bg-white/5 p-8 border border-white/10 rounded-[2rem]">
              <h3 className="text-xl font-medium mb-3">Custom Home Design & Build</h3>
              <p className="text-white/60 font-light leading-relaxed">
                As premier custom home builders, we handle every phase of residential architecture. From initial concept and architectural visualization to final construction, our luxury home remodeling services ensure your vision becomes a high-end reality.
              </p>
            </article>
            <article className="bg-white/5 p-8 border border-white/10 rounded-[2rem]">
              <h3 className="text-xl font-medium mb-3">Commercial Construction & Branding</h3>
              <p className="text-white/60 font-light leading-relaxed">
                Elevate your business with our commercial interior design and spatial branding. We partner with real estate developers and retail brands to construct immersive environments that drive customer engagement and reflect modern architectural principles.
              </p>
            </article>
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16">
          <h2 className="text-2xl tracking-[0.2em] uppercase font-bold text-white/70 mb-8 border-l-2 border-white pl-4">
            Comprehensive Architectural Services
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "3D Architectural Rendering",
              "Luxury Interior Decorating",
              "Home Addition & Extension",
              "Kitchen & Bath Remodeling",
              "Structural Engineering Consultation",
              "Permit & Zoning Acquisition",
              "Sustainable & Green Building",
              "Landscape Architecture",
              "Retail Space Optimization"
            ].map((service, i) => (
              <li key={i} className="flex items-center gap-3 text-white/80 font-medium">
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                {service}
              </li>
            ))}
          </ul>
        </section>

        <section className="max-w-[1400px] mx-auto mt-8">
          <div className="bg-white text-black p-12 md:p-24 border border-white/20 text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-light tracking-tighter mb-4 max-w-2xl">
              Start Your Next Development Project
            </h2>
            <p className="text-black/60 mb-8 max-w-xl text-lg">
              Whether you're looking for a top-rated interior designer for a home renovation or a full-scale architectural firm for a commercial build, answer three quick questions to secure your free consultation and quote.
            </p>
            <button 
              onClick={scrollToQuiz}
              className="bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors"
            >
              Get My Free Consultation
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
