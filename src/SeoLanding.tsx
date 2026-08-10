import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SeoLanding() {
  useEffect(() => {
    // Inject SEO meta tags for this specific page
    document.title = "Top Architectural Design & Interior Renovation Studio | Studio Visionary";
    
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

  return (
    <div className="bg-[#111] min-h-screen text-white font-sans selection:bg-white/30 selection:text-white">
      {/* Hidden SEO Header - Semantically important for crawlers, visually clean */}
      <header className="p-8 border-b border-white/10">
        <h1 className="text-4xl md:text-6xl font-light tracking-tighter mb-4">
          Premium Architectural Design & Interior Renovation
        </h1>
        <p className="text-lg text-white/50 max-w-3xl font-light">
          Studio Visionary is a top-tier architectural firm and interior design studio. We specialize in luxury home renovations, commercial construction, real estate development, and comprehensive brand spatial identity. 
        </p>
      </header>

      <main className="p-8 space-y-16 max-w-5xl">
        {/* Core Competencies Section */}
        <section>
          <h2 className="text-2xl tracking-[0.2em] uppercase font-bold text-white/70 mb-8 border-l-2 border-white pl-4">
            Our Expertise in Construction & Development
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="bg-white/5 p-6 border border-white/10">
              <h3 className="text-xl font-medium mb-3">Custom Home Design & Build</h3>
              <p className="text-white/60 font-light leading-relaxed">
                As premier custom home builders, we handle every phase of residential architecture. From initial concept and architectural visualization to final construction, our luxury home remodeling services ensure your vision becomes a high-end reality.
              </p>
            </article>
            <article className="bg-white/5 p-6 border border-white/10">
              <h3 className="text-xl font-medium mb-3">Commercial Construction & Branding</h3>
              <p className="text-white/60 font-light leading-relaxed">
                Elevate your business with our commercial interior design and spatial branding. We partner with real estate developers and retail brands to construct immersive environments that drive customer engagement and reflect modern architectural principles.
              </p>
            </article>
          </div>
        </section>

        {/* Services SEO Block */}
        <section>
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
                <div className="w-1.5 h-1.5 bg-white/50"></div>
                {service}
              </li>
            ))}
          </ul>
        </section>

        {/* Lead Gen / Meta Ads Landing Hook */}
        <section className="bg-white text-black p-12 mt-16 border border-white/20">
          <h2 className="text-3xl md:text-5xl font-light tracking-tighter mb-4">
            Start Your Next Development Project
          </h2>
          <p className="text-black/60 mb-8 max-w-2xl text-lg">
            Whether you're looking for a top-rated interior designer for a home renovation or a full-scale architectural firm for a commercial build, contact us today to secure your consultation.
          </p>
          <button className="bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors">
            Request an Architectural Consultation
          </button>
        </section>
      </main>
    </div>
  );
}
