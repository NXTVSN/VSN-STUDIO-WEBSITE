import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const PROJECT_TYPES = [
  'Home Renovation',
  'Custom Home / New Build',
  'Commercial Space',
  'Interior & Branding'
];

const BUDGETS = [
  'Under $25k',
  '$25k – $75k',
  '$75k – $200k',
  '$200k+',
  'Not sure yet'
];

const TIMELINES = [
  'As soon as possible',
  '1 – 3 months',
  '3 – 6 months',
  'Just exploring'
];

export function QuizFunnel() {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const isSubmitting = useRef(false);
  const currentStepRef = useRef(1);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  const handleOptionClick = (currentStep: number, type: string, value: string) => {
    if (currentStepRef.current !== currentStep) return;
    
    if (type === 'projectType') setProjectType(value);
    if (type === 'budget') setBudget(value);
    if (type === 'timeline') setTimeline(value);
    
    setStep(s => s + 1);
  };

  const isStep4Valid = name.length > 1 && /^\S+@\S+\.\S+$/.test(email) && phone.replace(/\D/g, '').length >= 7;

  const handleSubmit = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const description = `Project: ${projectType} | Budget: ${budget} | Timeline: ${timeline}`;
    
    const formData = new URLSearchParams();
    formData.append('form-name', 'lead');
    formData.append('bot-field', '');
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('project_type', projectType);
    formData.append('budget', budget);
    formData.append('timeline', timeline);
    formData.append('description', description);

    try {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (e) {}

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead');
    }

    window.location.href = `/thank-you?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&projectType=${encodeURIComponent(projectType)}`;
  };

  const getPercent = () => {
    if (step === 1) return 0;
    if (step === 2) return 33;
    if (step === 3) return 66;
    if (step === 4) return 100;
    return 100;
  };

  const progressPercent = getPercent();

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-8">What kind of project is it?</h3>
      <div className="space-y-3">
        {PROJECT_TYPES.map(opt => (
          <button
            key={opt}
            onClick={() => handleOptionClick(1, 'projectType', opt)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1a3a6e] active:bg-[#1a3a6e] hover:border-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all duration-300 flex justify-between items-center group"
          >
            <span className="text-sm font-medium text-white">{opt}</span>
            <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-8">What budget range are you working with?</h3>
      <div className="space-y-3">
        {BUDGETS.map(opt => (
          <button
            key={opt}
            onClick={() => handleOptionClick(2, 'budget', opt)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1a3a6e] active:bg-[#1a3a6e] hover:border-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all duration-300 flex justify-between items-center group"
          >
            <span className="text-sm font-medium text-white">{opt}</span>
            <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-8">When do you want to start?</h3>
      <div className="space-y-3">
        {TIMELINES.map(opt => (
          <button
            key={opt}
            onClick={() => handleOptionClick(3, 'timeline', opt)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1a3a6e] active:bg-[#1a3a6e] hover:border-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all duration-300 flex justify-between items-center group"
          >
            <span className="text-sm font-medium text-white">{opt}</span>
            <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">Ready for your quote?</h3>
      <p className="text-white/60 text-sm font-light mb-8">
        We'll confirm your free 30-minute consultation and prepare an initial quote for your {projectType.toLowerCase() || 'project'}.
      </p>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="sr-only">Name</label>
          <input 
            type="text" 
            placeholder="Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="sr-only">Email</label>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="sr-only">Phone</label>
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isStep4Valid}
        className="w-full bg-white text-black border border-transparent font-bold tracking-widest uppercase py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a3a6e] active:bg-[#1a3a6e] hover:text-white hover:border-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all duration-300 flex justify-center items-center gap-2 text-xs"
      >
        GET MY FREE CONSULTATION <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[10px] text-white/40 uppercase tracking-widest mt-4">
        Free &middot; No obligation &middot; Takes 30 seconds
      </p>
    </motion.div>
  );


  return (
    <div id="quiz" className="w-full bg-[#121212] rounded-[2rem] border border-[#1a3a6e] p-6 md:p-8 flex flex-col relative overflow-hidden shadow-2xl">
      {step < 5 && (
        <div className="w-full mb-8">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3">
            <span>{step === 4 ? 'Last Step' : `Question ${step} of 3`}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest mt-4 flex items-center gap-1 transition-colors"
            >
              &lsaquo; BACK
            </button>
          )}
        </div>
      )}

      <div className="relative flex-grow">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>
      </div>
    </div>
  );
}
