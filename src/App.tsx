/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence, animate, useMotionValue } from 'motion/react';
import { ArrowRight, Menu, ChevronLeft, ChevronRight, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ProjectStarter } from './components/ProjectStarter';
import { Preloader } from './components/Preloader';

const PROJECTS = [
  {
    id: 1,
    title: 'Forest Glass Residence',
    type: 'Residential Renovation',
    location: 'New York',
    sqft: '2,800 sq ft',
    scope: 'Concept Design + Visualization',
    image: 'https://picsum.photos/seed/interior_living/1920/1080',
    spec: '01'
  },
  {
    id: 2,
    title: 'Lumina Retail Flagship',
    type: 'Commercial',
    location: 'Los Angeles',
    sqft: '4,500 sq ft',
    scope: 'Space Planning + Renderings',
    image: 'https://picsum.photos/seed/interior_kitchen/1920/1080',
    spec: '02'
  },
  {
    id: 3,
    title: 'Oakwood Hospitality',
    type: 'Hospitality',
    location: 'Chicago',
    sqft: '12,000 sq ft',
    scope: 'Architectural Visualization',
    image: 'https://picsum.photos/seed/interior_bed/1920/1080',
    spec: '03'
  },
  {
    id: 4,
    title: 'Horizon Office HQ',
    type: 'Commercial Renovation',
    location: 'Seattle',
    sqft: '8,200 sq ft',
    scope: 'Concept Design + Drawings',
    image: 'https://picsum.photos/seed/interior_bath/1920/1080',
    spec: '04'
  }
];

const SERVICES = [
  {
    id: '01',
    category: 'Concept Design',
    desc: 'Initial architectural vision for residential and commercial spaces including spatial studies, massing concepts, and design direction.',
    image: 'https://picsum.photos/seed/conceptdesign/800/600',
    prompt: 'A minimalist architectural concept design sketch, clean lines, modern residential building, blueprint style, high contrast, professional architectural visualization.'
  },
  {
    id: '02',
    category: 'Space Planning & Layout',
    desc: 'Functional planning of layouts including floor plans, circulation improvements, and spatial organization for homes and commercial environments.',
    image: 'https://picsum.photos/seed/spaceplanning/800/600',
    prompt: 'Top-down view of a modern open-concept floor plan, architectural layout, clean minimal lines, monochrome with subtle shading, professional space planning.'
  },
  {
    id: '03',
    category: 'Architectural Visualization',
    desc: 'High-fidelity 3D modeling and photorealistic renderings that allow clients to experience their space before construction.',
    image: 'https://picsum.photos/seed/archviz/800/600',
    prompt: 'Photorealistic 3D architectural rendering of a modern concrete and glass home exterior at twilight, warm interior lighting, hyper-realistic, high-end real estate.'
  },
  {
    id: '04',
    category: 'Architectural Drawings',
    desc: 'Development of dimensioned floor plans, elevations, and sections used to communicate the project clearly to contractors and builders.',
    image: 'https://picsum.photos/seed/archdrawings/800/600',
    prompt: 'Detailed architectural elevation drawing of a modern commercial building, technical lines, dimension lines, clean white background, professional drafting.'
  },
  {
    id: '05',
    category: 'Presentation Packages',
    desc: 'Comprehensive visual presentations including renderings, diagrams, and design boards used for client approvals, investor presentations, or marketing materials.',
    image: 'https://picsum.photos/seed/presentation/800/600',
    prompt: 'A beautifully arranged architectural presentation board, material samples, concrete, wood, fabric swatches, and small architectural sketches, top-down flatlay, soft lighting.'
  },
  {
    id: '06',
    category: 'Brand & Interior Design',
    desc: 'When working with a brand, we handle the interior design of the project from vision to reality, including the branding and marketing usage for the build.',
    image: 'https://picsum.photos/seed/branddesign/800/600',
    prompt: 'A modern retail interior space with cohesive branding, sleek minimalist design, warm lighting, professional architectural photography.'
  }
];

const CLIENT_TYPES = [
  'Homeowners',
  'Business Owners',
  'Builders & Contractors'
];

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration: 2.5, ease: "easeOut" });
    return animation.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

// IndexedDB Helper for caching large images
const DB_NAME = 'StudioVisionaryDB';
const STORE_NAME = 'serviceImages';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveImageToDB = async (id: string, dataUrl: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(dataUrl, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const loadImagesFromDB = async (): Promise<Record<string, string>> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    const keysRequest = store.getAllKeys();
    
    request.onsuccess = () => {
      keysRequest.onsuccess = () => {
        const result: Record<string, string> = {};
        const keys = keysRequest.result as string[];
        const values = request.result as string[];
        keys.forEach((key, index) => {
          result[key] = values[index];
        });
        resolve(result);
      };
    };
    request.onerror = () => reject(request.error);
  });
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [clientTypeIndex, setClientTypeIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);
  const [isProjectStarterOpen, setIsProjectStarterOpen] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      // Load cached images from IndexedDB
      try {
        const currentImages = await loadImagesFromDB();
        if (Object.keys(currentImages).length > 0) {
          setGeneratedImages(currentImages);
        }
      } catch (e) {
        console.error('Failed to load cached images from DB', e);
      }
    };

    loadImages();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClientTypeIndex((prev) => (prev + 1) % CLIENT_TYPES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % PROJECTS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);

  // Keyboard navigation for slideshow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen font-sans bg-[#0a0a0a] text-white selection:bg-white selection:text-black pb-12 ${isLoading ? 'h-screen overflow-hidden' : ''}`}>
      <AnimatePresence>
        {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      {/* Floating Glass Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <div className="text-xs font-bold tracking-widest uppercase cursor-pointer" onClick={() => scrollTo('home')}>
            STUDIO VISIONARY
          </div>
          <div className="flex items-center gap-8 text-[10px] font-bold tracking-widest uppercase">
            <button onClick={() => scrollTo('home')} className="hover:text-white/60 transition-colors hidden md:block">HOME</button>
            <button onClick={() => scrollTo('projects')} className="hover:text-white/60 transition-colors hidden md:block">PROJECTS</button>
            <button onClick={() => scrollTo('services')} className="hover:text-white/60 transition-colors hidden md:block">SERVICES</button>
            <button onClick={() => scrollTo('process')} className="hover:text-white/60 transition-colors hidden md:block">PROCESS</button>
            <button onClick={() => scrollTo('about')} className="hover:text-white/60 transition-colors hidden md:block">ABOUT</button>
            <button onClick={() => setIsProjectStarterOpen(true)} className="hover:text-white/60 transition-colors hidden md:block">START A PROJECT</button>
            <button aria-label="Menu" className="md:hidden"><Menu className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* Modular Grid Layout */}
      <main id="home" className="pt-32 px-4 md:px-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-auto">
          
          {/* Module 1: Title & Manifesto (4 cols) */}
          <div className="col-span-1 md:col-span-4 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[400px] md:min-h-[60vh] relative group overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                  VISION
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] mb-6">
                Architecture,<br/>Identity,<br/>Experience
              </h1>
              <p className="text-base font-medium text-white/90 leading-relaxed max-w-sm mb-4">
                Designing spaces and brands that tell a unified story.
              </p>
              <p className="text-sm font-light text-white/50 leading-relaxed max-w-sm mb-6">
                VSN Studios is a multidisciplinary design studio that combines architectural design, spatial visualization, and brand thinking to create environments that communicate identity and atmosphere.
                <br/><br/>
                We collaborate with homeowners, businesses, and builders to design spaces that are not only functional, but meaningful experiences.
              </p>
              <p className="text-[10px] font-medium tracking-widest uppercase text-white/40">
                Residential Renovations &bull; Commercial Spaces &bull; Spatial Branding
              </p>
            </div>
            
            <div className="mt-12 relative z-10 flex flex-wrap gap-4">
              <button onClick={() => scrollTo('projects')} className="group/btn flex items-center gap-3 text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">
                VIEW PROJECTS
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
              <button onClick={() => setIsProjectStarterOpen(true)} className="group/btn flex items-center gap-3 text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">
                START A PROJECT
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Module 2: Video Render (8 cols) */}
          <div className="col-span-1 md:col-span-8 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[60vh] overflow-hidden shadow-2xl group">
            <div className="absolute top-8 left-8 z-10">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                TIMELAPSE RENDER
              </div>
            </div>
            <div className="absolute bottom-8 right-8 z-10 flex gap-2">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                REALTIME
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                SCALE 1:100
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black">
              <video 
                src="/render.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              {/* Subtle gradient overlay to ensure text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-[#121212]/30 pointer-events-none" />
            </div>
          </div>

          {/* Module 3: About (3 cols) */}
          <div id="about" className="col-span-1 md:col-span-3 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-8">
                ABOUT STUDIO
              </div>
              <p className="text-lg font-medium tracking-tight leading-snug mb-6">
                Studio Visionary is an architectural design and visualization studio focused on transforming ideas into thoughtful, buildable spaces.
              </p>
              <p className="text-sm font-light text-white/50 leading-relaxed mb-4">
                We work with homeowners, businesses, and builders to reimagine environments, refine spatial layouts, and visualize architectural concepts before construction begins.
              </p>
              <p className="text-sm font-light text-white/50 leading-relaxed">
                Our process combines architectural thinking, digital modeling, and visualization to help projects move from vision to reality with clarity and confidence.
              </p>
            </div>
          </div>

          {/* Module 4: Slideshow (6 cols) */}
          <div id="projects" className="col-span-1 md:col-span-6 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[300px] overflow-hidden group shadow-2xl">
            <div className="absolute top-8 left-8 z-20">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                SELECTED WORKS
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                src={PROJECTS[currentSlide].image}
                alt={PROJECTS[currentSlide].title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            
            {/* Slideshow Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button 
                onClick={prevSlide}
                aria-label="Previous Project"
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextSlide}
                aria-label="Next Project"
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Info */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-3xl font-medium tracking-tight mb-2">
                    {PROJECTS[currentSlide].title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-white/70 mb-2">
                    <span className="text-white">{PROJECTS[currentSlide].type}</span>
                    <span>&bull;</span>
                    <span>{PROJECTS[currentSlide].location}</span>
                    <span>&bull;</span>
                    <span>{PROJECTS[currentSlide].sqft}</span>
                  </div>
                  <p className="text-sm font-light text-white/50">
                    Scope: {PROJECTS[currentSlide].scope}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                  SPEC 0{PROJECTS[currentSlide].id}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentSlide + 1) / PROJECTS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Module 5: Trust (3 cols) */}
          <div className="col-span-1 md:col-span-3 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-8">
                DESIGNED FOR REAL SPACES
              </div>
              <p className="text-sm font-light text-white/60 leading-relaxed">
                Every project is developed with both design and construction in mind. By combining architectural planning with visualization tools, we help clients understand their space before building begins. This reduces uncertainty and supports better decision-making throughout the design process.
              </p>
            </div>
          </div>

          {/* Module 6: Trust Metrics Banner (12 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-12 bg-[#121212] rounded-[2rem] border border-white/5 p-6 md:p-8 overflow-hidden relative shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            {/* Cyber/Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212] pointer-events-none" />
            
            <div className="relative z-10 flex items-center gap-8 md:gap-16 w-full md:w-auto justify-between md:justify-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Projects</span>
                <div className="text-4xl md:text-5xl font-light tracking-tighter font-mono text-white">
                  <AnimatedNumber value={150} />+
                </div>
              </div>
              <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Years</span>
                <div className="text-4xl md:text-5xl font-light tracking-tighter font-mono text-white">
                  <AnimatedNumber value={12} />
                </div>
              </div>
              <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Awards</span>
                <div className="text-4xl md:text-5xl font-light tracking-tighter font-mono text-white">
                  <AnimatedNumber value={24} />
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1 w-full overflow-hidden md:border-l border-white/10 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                className="flex gap-8 text-sm md:text-base font-bold tracking-widest uppercase text-white/60 whitespace-nowrap items-center"
              >
                <span>HOMEOWNERS</span><span className="text-white/20">&bull;</span>
                <span>BRANDS</span><span className="text-white/20">&bull;</span>
                <span>DEVELOPERS</span><span className="text-white/20">&bull;</span>
                <span>CONTRACTORS</span><span className="text-white/20">&bull;</span>
                {/* Duplicate for seamless loop */}
                <span>HOMEOWNERS</span><span className="text-white/20">&bull;</span>
                <span>BRANDS</span><span className="text-white/20">&bull;</span>
                <span>DEVELOPERS</span><span className="text-white/20">&bull;</span>
                <span>CONTRACTORS</span><span className="text-white/20">&bull;</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Services Section */}
          <motion.section 
            id="services"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-8 col-span-1 md:col-span-6 bg-white text-black rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col"
          >
            <div className="flex flex-col justify-between items-start mb-8">
              <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase mb-6">
                <span>03</span>
                <div className="w-8 h-[1px] bg-black"></div>
                <span>SERVICES</span>
              </div>
              <div className="text-left flex flex-col items-start w-full">
                <h2 className="text-3xl md:text-4xl font-medium tracking-tight uppercase mb-4">
                  We offer wide range<br/><span className="text-black/40">of services</span>
                </h2>
                <div className="flex flex-col text-xs font-medium text-black/60 uppercase tracking-widest">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span>Design services for</span>
                    <div className="relative inline-grid grid-cols-1 grid-rows-1 text-black">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={clientTypeIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="col-start-1 row-start-1"
                        >
                          {CLIENT_TYPES[clientTypeIndex]}
                        </motion.span>
                      </AnimatePresence>
                      {/* Invisible placeholder to maintain width based on longest word */}
                      <span className="invisible col-start-1 row-start-1">Builders & Contractors</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-black/40 tracking-[0.2em]">
                    Residential &bull; Commercial &bull; Development
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-t border-black/10 flex-grow">
              {SERVICES.map((service, idx) => {
                const isActive = activeService === idx;
                return (
                  <div
                    key={service.id}
                    className="border-b border-black/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveService(isActive ? -1 : idx)}
                      className="w-full py-5 flex items-center justify-between text-left group transition-colors hover:bg-black/5 px-2 md:px-4"
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        <span className="text-sm font-medium text-black/40 group-hover:text-black transition-colors">{service.id}</span>
                        <span className="text-lg md:text-xl font-medium tracking-tight uppercase">{service.category}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 shrink-0">
                        {isActive ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-2 md:px-4 pb-6 pt-2 flex flex-col gap-4">
                            <p className="text-sm font-medium leading-relaxed text-black/70">
                              {service.desc}
                            </p>
                            <div className="w-full h-[160px] rounded-xl overflow-hidden relative bg-black/5 shrink-0">
                              <img 
                                src={generatedImages[service.id] || service.image} 
                                className="absolute inset-0 w-full h-full object-cover" 
                                alt={service.category} 
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Featured Project Section */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-8 col-span-1 md:col-span-6 flex"
          >
            <div className="relative w-full h-full min-h-[500px] rounded-[2rem] overflow-hidden group shadow-2xl flex-grow">
              {/* Note: Upload your image to the public folder and update this src to "/your-image-name.jpg" */}
              <img 
                src="/featuredwork.png?v=2" 
                alt="SYLVA CIRCLE" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/40 transition-colors duration-700 group-hover:bg-black/20" />
              
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-white">
                  <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">FEATURED PROJECT</span>
                  <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">2780 SQFT</span>
                </div>
                
                <div className="text-center mt-auto mb-8">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.85] text-white">
                    SYLVA<br/>CIRCLE
                  </h2>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md text-[10px] uppercase tracking-widest font-medium text-white">Architecture</span>
                    <span className="px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md text-[10px] uppercase tracking-widest font-medium text-white">Interior</span>
                  </div>
                  <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Process, Client Types & Deliverables Section */}
          <motion.section 
            id="process"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-8 col-span-1 md:col-span-12 flex flex-col gap-12"
          >
            {/* Section Header */}
            <div className="text-center md:text-left max-w-3xl px-4 md:px-0">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight mb-4">
                How We Turn Vision Into Built Environments
              </h2>
              <p className="text-base md:text-lg font-light text-white/60 leading-relaxed">
                Architecture, brand thinking, and visualization working together to shape meaningful spaces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Process */}
              <div className="group relative bg-[#121212] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:-translate-y-1 hover:border-white/10">
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-12 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    OUR DESIGN PROCESS
                  </div>
                  <div className="space-y-8">
                    {[
                      { step: '01', title: 'Discovery', desc: 'Understanding the vision, lifestyle needs, brand identity, or project opportunity.' },
                      { step: '02', title: 'Concept Development', desc: 'Translating ideas into spatial concepts, architectural form, and layout strategies.' },
                      { step: '03', title: 'Visualization', desc: 'Creating photorealistic renderings that allow the environment to be experienced before construction.' },
                      { step: '04', title: 'Design Refinement', desc: 'Refining materials, proportions, lighting, and spatial relationships.' },
                      { step: '05', title: 'Final Deliverables', desc: 'Providing drawings and visual materials that guide construction and implementation.' }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-6">
                        <div className="text-xl md:text-2xl font-mono font-medium text-white/30 pt-0.5 transition-colors duration-500 group-hover:text-white/50">{item.step}</div>
                        <div>
                          <h4 className="text-lg font-medium mb-2 transition-colors duration-500 group-hover:text-white">{item.title}</h4>
                          <p className="text-sm font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Client Types */}
              <div className="group relative bg-[#121212] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:-translate-y-1 hover:border-white/10">
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-12 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    WHO WE WORK WITH
                  </div>
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-2xl font-medium mb-3 transition-colors duration-500 group-hover:text-white">Homeowners</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Transforming homes through thoughtful renovations, spatial redesign, and architectural visualization.</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-medium mb-3 transition-colors duration-500 group-hover:text-white">Business Owners & Brands</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Designing environments for restaurants, retail, hospitality, and branded experiences where space and identity work together.</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-medium mb-3 transition-colors duration-500 group-hover:text-white">Builders & Developers</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Supporting builders with architectural concepts, visualization, and clear design communication for project presentations.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div className="group relative bg-[#121212] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:-translate-y-1 hover:border-white/10">
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-10 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    PROJECT DELIVERABLES
                  </div>
                  <ul className="space-y-6">
                    {[
                      'Concept Floor Plans',
                      '3D Massing Models',
                      'Exterior Architectural Renderings',
                      'Interior Spatial Visualizations',
                      'Design Presentation Boards',
                      'Dimensioned Architectural Drawings'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-base font-medium text-white/70 transition-colors duration-500 group-hover:text-white/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/30 transition-colors duration-500 group-hover:bg-white/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Contact */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-8 mb-24 col-span-1 md:col-span-12"
          >
            <div id="contact" onClick={() => setIsProjectStarterOpen(true)} className="w-full bg-white text-black rounded-[2rem] p-8 md:p-12 flex flex-col justify-between min-h-[300px] relative hover:scale-[0.98] transition-transform duration-300 cursor-pointer group shadow-2xl">
              <div>
                <div className="px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-[10px] font-bold tracking-widest uppercase text-black/50 inline-block mb-8">
                  INITIATE
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1]">
                  Start a<br/>Project
                </h2>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-8">
                <p className="text-base font-medium text-black/60 max-w-sm leading-relaxed">
                  Engage with our studio to begin developing your architectural vision.
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold tracking-widest uppercase">Start Your Project</span>
                  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center group-hover:-rotate-45 transition-transform duration-300 shadow-lg">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="col-span-1 md:col-span-12 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40 tracking-widest uppercase">
            <p>&copy; {new Date().getFullYear()} Studio Visionary. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </footer>

        </div>
      </main>

      <ProjectStarter 
        isOpen={isProjectStarterOpen} 
        onClose={() => setIsProjectStarterOpen(false)} 
      />
    </div>
  );
}
