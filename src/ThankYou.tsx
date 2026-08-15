import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThankYou() {
  const [params, setParams] = useState({ name: '', email: '', projectType: '' });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setParams({
      name: urlParams.get('name') || '',
      email: urlParams.get('email') || '',
      projectType: urlParams.get('projectType') || ''
    });
    
    document.title = "Thank You | Studio Visionary";
  }, []);

  // When the visitor books inside the embedded Calendly, log the booking to Netlify Forms
  // so it shows up on their lead in Studio (matched by email; enriched server-side).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (typeof e.origin !== 'string' || !e.origin.endsWith('calendly.com')) return;
      const data = e.data;
      if (!data || data.event !== 'calendly.event_scheduled') return;
      const urlParams = new URLSearchParams(window.location.search);
      const body = new URLSearchParams();
      body.append('form-name', 'booking');
      body.append('bot-field', '');
      body.append('name', urlParams.get('name') || '');
      body.append('email', urlParams.get('email') || '');
      body.append('event_uri', data.payload?.event?.uri || '');
      body.append('invitee_uri', data.payload?.invitee?.uri || '');
      body.append('page', window.location.pathname);
      try {
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          keepalive: true
        });
      } catch (err) {}
      if ((window as any).fbq) (window as any).fbq('track', 'Schedule');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const firstName = params.name.split(' ')[0] || 'there';
  const embedDomain = typeof window !== 'undefined' ? window.location.host : 'vsndesignstudio.com';
  const calendlyUrl = `https://calendly.com/nextvisionarydesign/30min?hide_gdpr_banner=1&embed_domain=${encodeURIComponent(embedDomain)}&embed_type=Inline&name=${encodeURIComponent(params.name)}&email=${encodeURIComponent(params.email)}`;

  return (
    <div className="bg-[#111] min-h-screen text-white font-sans selection:bg-white/30 selection:text-white pb-20 relative overflow-hidden flex flex-col">
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
          <a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">
            STUDIO VISIONARY
          </a>
          <div className="flex gap-4 text-[10px] font-bold tracking-widest uppercase text-white/50">
            <a href="https://www.instagram.com/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://www.linkedin.com/in/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </header>
      
      <main className="w-full flex-grow flex items-center justify-center relative z-10 p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl bg-[#121212] rounded-[2rem] border border-[#1a3a6e] p-6 md:p-12 flex flex-col items-center text-center shadow-[0_0_40px_rgba(26,58,110,0.2)]"
        >
          <div className="w-16 h-16 bg-[#1a3a6e]/20 rounded-full flex items-center justify-center mb-6 border border-[#1a3a6e]/50">
            <CheckCircle2 className="w-8 h-8 text-[#1a3a6e]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tighter mb-4 text-white">
            You're in, {firstName}.
          </h1>
          <p className="text-lg text-white/60 font-light mb-10 max-w-xl mx-auto">
            Book your free 30-minute consultation now and we'll come prepared with ideas for your {params.projectType.toLowerCase() || 'project'}.
          </p>
          
          <div className="w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden bg-white/5 border border-white/10">
            <iframe 
              src={calendlyUrl} 
              width="100%" 
              height="100%" 
              frameBorder="0"
              title="Book Consultation"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
