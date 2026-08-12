import React, { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service | Studio Visionary";
  }, []);

  return (
    <div className="bg-[#111] min-h-screen text-white font-sans pb-20 relative overflow-hidden flex flex-col">
      <header className="p-6 md:p-8 border-b border-white/10 sticky top-0 bg-[#111]/90 backdrop-blur-md z-50 flex justify-between items-center relative">
        <div className="max-w-[1400px] w-full mx-auto flex justify-between items-center">
          <a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">
            STUDIO VISIONARY
          </a>
          <a href="/" className="text-[10px] font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors">
            BACK TO HOME
          </a>
        </div>
      </header>
      
      <main className="w-full max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24 relative z-10 flex-grow">
        <h1 className="text-4xl md:text-5xl font-light tracking-tighter mb-12 text-[#1a3a6e]">
          Terms of Service
        </h1>
        
        <div className="space-y-8 text-white/70 font-light leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-medium mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Studio Visionary website, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">2. Consultations and Quotes</h2>
            <p>
              Our free 30-minute design consultations and initial quotes are provided for informational and planning purposes only. They do not constitute a legally binding contract to perform architectural or design work until a formal agreement is signed by both parties. Studio Visionary reserves the right to decline projects or consultations at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">3. Intellectual Property</h2>
            <p>
              All content on this website, including but not limited to 3D architectural visualizations, conceptual imagery, text, graphics, logos, and digital downloads, is the property of Studio Visionary and is protected by international copyright and intellectual property laws. You may not reproduce, distribute, or use these materials for commercial purposes without our express written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">4. User Submitted Information</h2>
            <p>
              By submitting project details, budgets, and timelines through our forms, you grant Studio Visionary the right to review and store this information for the purpose of evaluating your project. For details on how we handle your data, please review our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">5. Limitation of Liability</h2>
            <p>
              In no event shall Studio Visionary, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the website or our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="max-w-[1400px] w-full mx-auto px-6 md:px-8 mt-auto py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40 tracking-widest uppercase relative z-10">
        <p>&copy; {new Date().getFullYear()} Studio Visionary. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
