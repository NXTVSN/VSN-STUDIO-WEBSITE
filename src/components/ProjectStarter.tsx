import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Calendar, User, Mail, Phone, MessageSquare, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useState, useRef } from 'react';

interface ProjectStarterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectStarter({ isOpen, onClose }: ProjectStarterProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const submittedRef = useRef(false);

  const submitLead = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'lead',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
      }).toString(),
    }).catch(() => {});
    const fbq = (window as any).fbq;
    if (fbq) fbq('track', 'Lead', {}, { eventID: eventId });
  };

  const nextStep = () =>
    setStep(s => {
      if (s === 2) submitLead();
      return Math.min(s + 1, 4);
    });
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData({ name: '', email: '', phone: '', description: '' });
      setImages([]);
      submittedRef.current = false;
    }, 300); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 md:top-10 md:right-10 text-white/70 hover:text-white transition-colors z-[130] bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl bg-[#121212] rounded-[1.5rem] md:rounded-[2rem] border border-white/10 overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto md:min-h-[600px] md:max-h-[90vh] relative mt-12 md:mt-0"
          >
            {/* Left Sidebar - Progress */}
            <div className="w-full md:w-1/3 bg-white/5 p-6 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 shrink-0">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-12">
                  Project Initiation
                </div>
                
                <div className="space-y-8">
                  {[
                    { num: 1, title: 'Contact Details' },
                    { num: 2, title: 'Space & Uploads' },
                    { num: 3, title: 'Consultation' },
                  ].map((s) => (
                    <div key={s.num} className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.num ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
                        {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                      </div>
                      <div className={`text-sm font-medium transition-colors ${step >= s.num ? 'text-white' : 'text-white/40'}`}>
                        {s.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <h3 className="text-xl font-medium text-white mb-2">Free 30-Min Consultation</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Every new project begins with a complimentary consultation to discuss your vision, timeline, and receive an initial quote.
                </p>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="w-full md:w-2/3 p-6 md:p-12 flex flex-col relative shrink-0 min-h-[500px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-grow flex flex-col justify-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8">Let's start with the basics.</h2>
                    <div className="space-y-6">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-grow flex flex-col justify-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8">Tell us about your space.</h2>
                    <div className="space-y-6">
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-white/30" />
                        <textarea
                          placeholder="Describe your existing space and your vision for the project..."
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                        />
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-white/70 mb-3">Upload Images of Existing Space</div>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-white/40 mb-3" />
                          <div className="text-sm text-white/60 text-center">
                            Click to browse or drag and drop<br/>
                            <span className="text-xs text-white/40">JPG, PNG up to 10MB</span>
                          </div>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                          />
                        </div>

                        {images.length > 0 && (
                          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                            {images.map((img, i) => (
                              <div key={i} className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative group">
                                <img src={img} alt="Uploaded space" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setImages(images.filter((_, index) => index !== i))}
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-grow flex flex-col justify-center"
                  >
                    <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Book your consultation.</h2>
                    <p className="text-white/50 mb-8">
                      Select a time for your free 30-minute consultation. We'll discuss your project details and provide an initial quote.
                    </p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <Calendar className="w-12 h-12 text-white/40 mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">Schedule via Calendly</h3>
                      <p className="text-sm text-white/50 mb-6 max-w-xs">
                        Click below to open our calendar and secure your preferred time slot.
                      </p>
                      <button 
                        onClick={() => window.open('https://calendly.com/nextvisionarydesign/30min', '_blank')}
                        className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-colors flex items-center gap-2"
                      >
                        Open Calendar <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-grow flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Request Submitted</h2>
                    <p className="text-white/50 max-w-md mx-auto mb-8">
                      Thank you for sharing your project details. We've received your information and will be ready for our consultation call.
                    </p>
                    <button 
                      onClick={handleClose}
                      className="bg-white text-black px-8 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-colors"
                    >
                      Return to Site
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Footer */}
              {step < 4 && (
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    className={`text-sm font-bold tracking-widest uppercase flex items-center gap-2 transition-colors ${step === 1 ? 'text-transparent pointer-events-none' : 'text-white/50 hover:text-white'}`}
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  
                  <button
                    onClick={nextStep}
                    disabled={
                      (step === 1 && (!formData.name || !formData.email || !formData.phone)) ||
                      (step === 2 && !formData.description)
                    }
                    className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {step === 3 ? 'Complete' : 'Next'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
