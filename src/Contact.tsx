import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isSubmitting = useRef(false);

  useEffect(() => {
    document.title = "Contact | Studio Visionary";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const formData = new URLSearchParams();
    formData.append('form-name', 'contact');
    formData.append('bot-field', '');
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('projectDetails', projectDetails);

    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (e) {}

    setIsSubmitted(true);
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans selection:bg-white selection:text-black flex flex-col">
      <header className="p-6 md:p-8 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50 flex justify-between items-center relative">
        <div className="w-full flex justify-between items-center">
          <a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">
            STUDIO VISIONARY
          </a>
          <div className="flex gap-4 text-[10px] font-bold tracking-widest uppercase text-white/50">
            <a href="/" className="hover:text-white transition-colors">BACK TO HOME</a>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1600px] mx-auto p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">
        
        {/* Left Side - Image */}
        <div className="w-full h-[400px] lg:h-[80vh] sticky lg:top-32 rounded-[2rem] overflow-hidden bg-[#121212] border border-white/5">
          <img 
            src="/og-image.jpg" 
            alt="Studio Visionary Contact" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col pt-4 lg:pt-12 pb-20">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight mb-16 uppercase">
            CONTACT
          </h1>

          <div className="space-y-16">
            
            {/* Inquiries Section */}
            <div>
              <div className="border-b border-white/10 pb-4 mb-6">
                <h2 className="text-xs font-medium text-white/50 tracking-widest uppercase">
                  INQUIRIES
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-medium text-white/50 tracking-widest uppercase mb-2">
                    ALL PROJECT INQUIRIES
                  </h3>
                  <a href="mailto:nextvisionarydesign@gmail.com" className="text-lg md:text-xl font-medium hover:text-[#1a3a6e] transition-colors">
                    nextvisionarydesign@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* General Form Section */}
            <div>
              <div className="border-b border-white/10 pb-4 mb-8">
                <h2 className="text-xs font-medium text-white/50 tracking-widest uppercase">
                  OTHER INQUIRIES
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Message Sent</h3>
                    <p className="text-white/60 font-light text-sm">
                      We'll be in touch with you shortly.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    name="contact"
                    data-netlify="true"
                  >
                    <input type="hidden" name="form-name" value="contact" />
                    <input type="hidden" name="bot-field" />

                    <div>
                      <label htmlFor="name" className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                        NAME
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                        PHONE
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label htmlFor="projectDetails" className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                        PROJECT DETAILS
                      </label>
                      <textarea
                        id="projectDetails"
                        required
                        value={projectDetails}
                        onChange={(e) => setProjectDetails(e.target.value)}
                        rows={4}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-white transition-colors resize-none"
                        placeholder="Tell us about your project..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black px-6 py-4 mt-4 text-xs font-bold tracking-widest uppercase hover:bg-white/90 transition-colors flex justify-center items-center gap-2 group rounded-full"
                    >
                      SEND INQUIRY
                      <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
