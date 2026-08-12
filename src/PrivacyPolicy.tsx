import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Studio Visionary";
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
          Privacy Policy
        </h1>
        
        <div className="space-y-8 text-white/70 font-light leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-medium mb-4">1. Information We Collect</h2>
            <p>
              When you interact with our website, book a consultation, or fill out our project inquiry forms, we may collect the following information:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Name and contact information (including email address and phone number)</li>
              <li>Project details, budgets, and timelines submitted via our forms</li>
              <li>Usage data, IP addresses, and browsing information via analytics and tracking tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>To provide, operate, and maintain our website and services</li>
              <li>To communicate with you regarding your project inquiries, consultation bookings, and quotes</li>
              <li>To improve our website, marketing efforts, and user experience</li>
              <li>To send administrative information, such as confirmations and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">3. Third-Party Services & Tracking (Meta Pixel)</h2>
            <p>
              We use third-party services to facilitate our operations and marketing. This includes <strong>Calendly</strong> for scheduling consultations and the <strong>Meta (Facebook) Pixel</strong> for analytics and targeted advertising. These third parties may use cookies, web beacons, and other tracking technologies to collect information about your activity on our site and other websites to provide you with targeted advertising based upon your interests. 
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">4. Data Sharing and Protection</h2>
            <p>
              We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties without your consent, except to trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential. We implement reasonable security measures to maintain the safety of your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">5. Your Rights & Consent</h2>
            <p>
              By using our site, you consent to our website's Privacy Policy. You have the right to request access to the personal data we hold about you, or request that we delete it. If you wish to exercise these rights or opt-out of certain tracking, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-medium mb-4">6. Contact Us</h2>
            <p>
              If there are any questions regarding this privacy policy, you may contact us using the information provided on our website or by reaching out to your primary Studio Visionary contact.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="max-w-[1400px] w-full mx-auto px-6 md:px-8 mt-auto py-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40 tracking-widest uppercase relative z-10">
        <p>&copy; {new Date().getFullYear()} Studio Visionary. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
