/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence, animate, useMotionValue } from 'motion/react';
import { ArrowRight, Menu, ChevronLeft, ChevronRight, ArrowUpRight, Plus, Minus, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizModal } from './components/QuizModal';
import { Preloader } from './components/Preloader';

const PROJECTS = [
  {
    id: 1,
    title: 'Development',
    type: '3D Modeling & Renderings',
    location: 'California',
    sqft: '56 homes',
    scope: '3D Modeling, Renderings',
    image: '/project1.jpeg',
    spec: '01'
  },
  {
    id: 2,
    title: 'Basement Renovation',
    type: 'Residential',
    location: 'Staten Island, New York',
    sqft: '1,400 sq ft',
    scope: 'Full Interior Design + Build Out',
    image: '/project2.jpeg',
    spec: '02'
  },
  {
    id: 3,
    title: 'Golf Simulator',
    type: 'Branding & Interior Design',
    location: 'Brooklyn, New York',
    sqft: '4,500 sq ft',
    scope: 'Interior Design, Branding, 3D Modeling, Renderings',
    image: '/project3.jpg',
    spec: '03'
  },
  {
    id: 4,
    title: 'Kitchen Remodel',
    type: 'Interior Design',
    location: 'Staten Island, New York',
    sqft: '225 sq ft',
    scope: 'Full Design, Custom Millwork, Visualization',
    image: '/project4.jpeg',
    spec: '04'
  }
];

const SYLVA_IMAGES = [
  '/featuredwork.png?v=2',
  '/sylva2.jpeg',
  '/sylva3.jpeg',
  '/sylva4.jpeg'
];

const GALLERY_SECTIONS = [
  { id: "12", image: "/archive/archive-12.jpeg", span: "col-span-1 md:col-span-2 row-span-1 md:row-span-2" },
  { id: "03", image: "/archive/archive-03.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "19", image: "/archive/archive-19.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "05", image: "/archive/archive-05.jpeg", span: "col-span-1 md:col-span-2 row-span-1 md:row-span-1" },
  { id: "14", image: "/archive/archive-14 2.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-2" },
  { id: "17", image: "/archive/archive-17.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "09", image: "/archive/archive-09.jpeg", span: "col-span-1 md:col-span-2 row-span-1 md:row-span-2" },
  { id: "07", image: "/archive/archive-07.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "01", image: "/archive/archive-01.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "11", image: "/archive/archive-11.jpeg", span: "col-span-1 md:col-span-2 row-span-1 md:row-span-1" },
  { id: "16", image: "/archive/archive-16 2.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-2" },
  { id: "13", image: "/archive/archive-13.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "18", image: "/archive/archive-18.jpeg", span: "col-span-1 md:col-span-2 row-span-1 md:row-span-2" },
  { id: "06", image: "/archive/archive-06.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" },
  { id: "10", image: "/archive/archive-10.jpeg", span: "col-span-1 md:col-span-1 row-span-1 md:row-span-1" }
];

const SERVICES = [
  {
    id: '01',
    category: 'Concept Design',
    desc: 'Initial architectural vision, massing concepts, and strategic design direction.',
    image: 'https://picsum.photos/seed/conceptdesign/800/600',
    prompt: 'A minimalist architectural concept design sketch, clean lines, modern residential building, blueprint style, high contrast, professional architectural visualization.'
  },
  {
    id: '02',
    category: 'Space Planning & Layout',
    desc: 'Functional planning, flow optimization, and spatial organization for sophisticated environments.',
    image: 'https://picsum.photos/seed/spaceplanning/800/600',
    prompt: 'Top-down view of a modern open-concept floor plan, architectural layout, clean minimal lines, monochrome with subtle shading, professional space planning.'
  },
  {
    id: '03',
    category: 'Architectural Visualization',
    desc: 'Photorealistic 3D modeling allowing clients to experience spaces before construction.',
    image: 'https://picsum.photos/seed/archviz/800/600',
    prompt: 'Photorealistic 3D architectural rendering of a modern concrete and glass home exterior at twilight, warm interior lighting, hyper-realistic, high-end real estate.'
  },
  {
    id: '04',
    category: 'Architectural Drawings',
    desc: 'Dimensioned plans, elevations, and sections to clearly direct contractors and builders.',
    image: 'https://picsum.photos/seed/archdrawings/800/600',
    prompt: 'Detailed architectural elevation drawing of a modern commercial building, technical lines, dimension lines, clean white background, professional drafting.'
  },
  {
    id: '05',
    category: 'Presentation Packages',
    desc: 'Comprehensive visual boards and renderings for client approvals and investor pitches.',
    image: 'https://picsum.photos/seed/presentation/800/600',
    prompt: 'A beautifully arranged architectural presentation board, material samples, concrete, wood, fabric swatches, and small architectural sketches, top-down flatlay, soft lighting.'
  },
  {
    id: '06',
    category: 'Brand & Interior Design',
    desc: 'End-to-end interior design, seamlessly translating brand identity into physical built spaces.',
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
  const [openService, setOpenService] = useState<string | null>(null);
  const [activeProcessCard, setActiveProcessCard] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

  const [currentSylvaSlide, setCurrentSylvaSlide] = useState(0);

  const galleryRef = useRef<HTMLElement>(null);
  const { scrollYProgress: galleryScroll } = useScroll({
    target: galleryRef,
    offset: ["start end", "end start"]
  });

  const parallaxY1 = useTransform(galleryScroll, [0, 1], ["5%", "-10%"]);
  const parallaxY2 = useTransform(galleryScroll, [0, 1], ["10%", "-5%"]);
  const parallaxY3 = useTransform(galleryScroll, [0, 1], ["-5%", "10%"]);
  const parallaxY4 = useTransform(galleryScroll, [0, 1], ["8%", "-8%"]);

  const getParallaxY = (index: number) => {
    const mod = index % 4;
    if (mod === 0) return parallaxY1;
    if (mod === 1) return parallaxY2;
    if (mod === 2) return parallaxY3;
    return parallaxY4;
  };

  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);
  const [isProjectStarterOpen, setIsProjectStarterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const [isProcessDeckPaused, setIsProcessDeckPaused] = useState(false);

  useEffect(() => {
    if (isProcessDeckPaused) return;
    const timer = setInterval(() => {
      // We check window width to only shuffle on mobile, though the state updates globally.
      if (window.innerWidth < 768) {
        setActiveProcessCard((prev) => (prev + 1) % 3);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isProcessDeckPaused]);

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
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-5xl">
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
            <button onClick={() => scrollTo('gallery')} className="hover:text-white/60 transition-colors hidden md:block">IMAGERY</button>
            <button 
              onClick={() => setIsProjectStarterOpen(true)} 
              className="bg-[#0f2c59] text-white px-4 py-2 rounded-full hover:bg-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all hidden md:block shadow-lg border border-[#1a3a6e]"
            >
              START A PROJECT
            </button>
            <button aria-label="Menu" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[70] bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col pt-32 px-6 md:hidden"
          >
            <div className="flex flex-col gap-8 text-xl font-bold tracking-widest uppercase">
              <button 
                onClick={() => { scrollTo('home'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                HOME
              </button>
              <button 
                onClick={() => { scrollTo('projects'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                PROJECTS
              </button>
              <button 
                onClick={() => { scrollTo('services'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                SERVICES
              </button>
              <button 
                onClick={() => { scrollTo('process'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                PROCESS
              </button>
              <button 
                onClick={() => { scrollTo('about'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                ABOUT
              </button>
              <button 
                onClick={() => { scrollTo('gallery'); setIsMobileMenuOpen(false); }} 
                className="text-left text-white/70 hover:text-white transition-colors"
              >
                CONCEPTUAL IMAGERY
              </button>
              <button 
                onClick={() => { setIsProjectStarterOpen(true); setIsMobileMenuOpen(false); }} 
                className="bg-[#0f2c59] text-white px-6 py-4 rounded-full hover:bg-[#1a3a6e] transition-all text-center mt-4 border border-[#1a3a6e]"
              >
                START A PROJECT
              </button>
            </div>
            <button 
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modular Grid Layout */}
      <main id="home" className="pt-32 px-4 md:px-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-6 auto-rows-auto grid-flow-row-dense">
          
          {/* Contact Form (Moved to Absolute Top, Inline) */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="col-span-2 md:col-span-12 sticky top-[72px] md:relative md:top-auto z-30"
          >
            <div id="contact" onClick={() => setIsProjectStarterOpen(true)} className="w-full bg-[#0f2c59] text-white rounded-2xl md:rounded-[2rem] p-4 md:p-12 flex flex-row justify-between items-center relative hover:bg-[#123161] hover:scale-[0.99] transition-all duration-300 cursor-pointer group shadow-[0_0_40px_rgba(15,44,89,0.3)] border border-[#1a3a6e]">
              <div>
                <div className="hidden md:inline-block px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 mb-6">
                  NEW INQUIRY
                </div>
                <h2 className="text-xl md:text-5xl font-medium tracking-tight leading-[1.1]">
                  Start Your Project
                </h2>
                <p className="hidden md:block text-sm font-medium text-white/70 max-w-md mt-4">
                  Engage with our studio to begin developing your architectural vision.
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4 mt-0">
                <span className="hidden md:inline text-sm font-bold tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">Initiate</span>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white text-[#0f2c59] flex items-center justify-center group-hover:-rotate-45 transition-transform duration-300 shadow-lg">
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Module 1: Title & Manifesto (4 cols) */}
          <div className="col-span-2 md:col-span-4 bg-[#111] rounded-none border border-white/20 p-4 md:p-10 flex flex-col justify-between min-h-[150px] md:min-h-[60vh] relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6 md:mb-12">
                <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase text-white/70">
                  <div className="w-3 md:w-4 h-[1px] bg-white/50"></div>
                  VISION
                </div>
              </div>
              <h1 className="text-xl md:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.05] mb-4 md:mb-6">
                Architecture,<br/>Identity,<br/>Experience
              </h1>
              <p className="text-[10px] md:text-sm font-light text-white/50 leading-relaxed max-w-sm mb-4 md:mb-8">
                A multidisciplinary studio fusing architectural design, visualization, and brand thinking. We partner with clients to design functional spaces driven by meaningful experiences.
              </p>
              <p className="text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">
                Residential &bull; Commercial &bull; Branding
              </p>
            </div>
            
            <div className="mt-6 md:mt-12 relative z-10 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsProjectStarterOpen(true)} 
                className="group/btn flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase bg-[#0f2c59] text-white px-4 md:px-5 py-2.5 md:py-3 rounded-full hover:bg-[#0c244a] transition-all border border-white/10"
              >
                START A PROJECT
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 opacity-80 group-hover/btn:rotate-45 transition-transform" />
              </button>
            </div>
          </div>

          {/* Module 2: Video Render (8 cols) */}
          <div className="col-span-2 md:col-span-8 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[300px] md:min-h-[60vh] overflow-hidden shadow-2xl group">
            <div className="absolute top-8 left-8 z-10">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                LATEST RENDER
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
                src="/BMW.mov" 
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
          <div id="about" className="col-span-1 md:col-span-3 bg-[#121212] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 p-5 md:p-10 flex flex-col justify-between min-h-[180px] md:min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-4 md:mb-8">
                ABOUT STUDIO
              </div>
              <p className="text-sm md:text-lg font-medium tracking-tight leading-snug mb-2 md:mb-6">
                Transforming ideas into buildable, thought-provoking spaces.
              </p>
              <p className="hidden md:block text-xs md:text-sm font-light text-white/50 leading-relaxed">
                We combine architectural thinking with high-end visualization to design environments with absolute clarity before construction begins.
              </p>
            </div>
          </div>

          {/* Module 4: Slideshow (6 cols) */}
          <div id="projects" className="col-span-2 md:col-span-6 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[300px] overflow-hidden group shadow-2xl">
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
                className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                referrerPolicy="no-referrer"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                  if (offset.x < -50) nextSlide();
                  else if (offset.x > 50) prevSlide();
                }}
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
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">
                    {PROJECTS[currentSlide].title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-white/70 mb-2">
                    <span className="text-white">{PROJECTS[currentSlide].type}</span>
                    <span>&bull;</span>
                    <span>{PROJECTS[currentSlide].location}</span>
                    <span>&bull;</span>
                    <span>{PROJECTS[currentSlide].sqft}</span>
                  </div>
                  <p className="text-xs md:text-sm font-light text-white/50">
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
          <div className="col-span-1 md:col-span-3 bg-[#121212] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 p-5 md:p-10 flex flex-col justify-between min-h-[180px] md:min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-4 md:mb-8">
                REAL SPACES
              </div>
              <p className="text-sm md:text-lg font-medium tracking-tight leading-snug mb-2 md:mb-6">
                Designed with construction in mind.
              </p>
              <p className="hidden md:block text-xs md:text-sm font-light text-white/60 leading-relaxed">
                Our visualizations eliminate uncertainty, ensuring confident decisions moving into the build phase.
              </p>
            </div>
          </div>

          {/* Module 6: Trust Metrics Banner (12 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-2 md:col-span-12 bg-[#111] rounded-none border border-white/20 p-6 md:p-8 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            {/* Cyber/Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212] pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-center md:justify-start w-full md:w-auto">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#1a3a6e] uppercase text-center md:text-left drop-shadow-[0_0_20px_rgba(26,58,110,0.5)]">
                FROM VISION TO REALITY
              </h2>
            </div>

            <div className="relative z-10 flex flex-1 overflow-hidden md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 border-white/10 md:border-l" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                className="flex gap-8 text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-white/50 whitespace-nowrap items-center"
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
            className="mt-8 col-span-2 md:col-span-6 bg-white text-black rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col"
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
              {SERVICES.map((service) => (
                <div
                  key={service.id}
                  className="border-b border-black/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenService(openService === service.id ? null : service.id)}
                    className="w-full py-5 flex items-center justify-between text-left group transition-colors hover:bg-black/5 px-2 md:px-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      <span className="text-sm font-medium text-black/40 group-hover:text-black transition-colors">{service.id}</span>
                      <span className="text-lg md:text-xl font-medium tracking-tight uppercase">{service.category}</span>
                    </div>
                    <div className="md:hidden">
                      <ChevronRight className={`w-4 h-4 text-black/40 transition-transform ${openService === service.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openService === service.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden px-14 pb-5 overflow-hidden text-xs text-black/60 font-medium tracking-wide leading-relaxed"
                      >
                        {service.desc}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Featured Project Section */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-8 col-span-2 md:col-span-6 flex"
          >
            <div className="relative w-full h-full min-h-[500px] rounded-[2rem] overflow-hidden group shadow-2xl flex-grow">
              {/* Note: Upload your image to the public folder and update this src to "/your-image-name.jpg" */}
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSylvaSlide}
                  src={SYLVA_IMAGES[currentSylvaSlide]} 
                  alt="SYLVA CIRCLE" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/40 transition-colors duration-700 group-hover:bg-black/20" />
              
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10 pointer-events-none">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-white">
                  <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">FEATURED PROJECT</span>
                </div>
                
                <div className="text-center mt-auto mb-8 pointer-events-auto">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.85] text-white">
                    SYLVA<br/>CIRCLE
                  </h2>
                </div>
                
                <div className="flex justify-between items-end pointer-events-auto">
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md text-[10px] uppercase tracking-widest font-medium text-white">Architecture</span>
                    <span className="px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md text-[10px] uppercase tracking-widest font-medium text-white">Interior</span>
                  </div>
                  
                  {/* Slider Controls */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentSylvaSlide((prev) => (prev - 1 + SYLVA_IMAGES.length) % SYLVA_IMAGES.length)}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentSylvaSlide((prev) => (prev + 1) % SYLVA_IMAGES.length)}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80 transition-colors shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
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
            className="mt-8 col-span-2 md:col-span-12 flex flex-col gap-12"
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

            <div 
              className="relative h-[650px] md:h-auto w-full md:grid md:grid-cols-3 gap-6 md:gap-8 pb-4 md:pb-0"
              onMouseEnter={() => setIsProcessDeckPaused(true)}
              onMouseLeave={() => setIsProcessDeckPaused(false)}
              onTouchStart={() => setIsProcessDeckPaused(true)}
              onTouchEnd={() => setIsProcessDeckPaused(false)}
            >
              {/* Process */}
              <div className={`group absolute md:relative inset-x-0 bg-[#121212] rounded-[2rem] p-6 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-700 md:opacity-100 md:z-auto md:scale-100 md:translate-y-0 ${activeProcessCard === 0 ? 'z-30 opacity-100 scale-100 translate-y-0' : activeProcessCard === 1 ? 'z-10 opacity-0 scale-90 translate-y-8' : 'z-20 opacity-40 scale-95 translate-y-4'} md:hover:-translate-y-1 hover:border-white/10`}>
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-12 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    OUR DESIGN PROCESS
                  </div>
                  <div className="space-y-8">
                    {[
                      { step: '01', title: 'Discovery', desc: 'Defining vision, needs, and project opportunity.' },
                      { step: '02', title: 'Concept', desc: 'Translating ideas into spatial form and layout strategy.' },
                      { step: '03', title: 'Visualization', desc: 'Crafting photorealistic renderings to experience the space.' },
                      { step: '04', title: 'Refinement', desc: 'Perfecting materials, proportions, and lighting.' },
                      { step: '05', title: 'Deliverables', desc: 'Generating final drawings to guide construction.' }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-6">
                        <div className="text-xl md:text-2xl font-mono font-medium text-white/30 pt-0.5 transition-colors duration-500 group-hover:text-white/50">{item.step}</div>
                        <div>
                          <h4 className="text-lg font-medium mb-1 transition-colors duration-500 group-hover:text-white">{item.title}</h4>
                          <p className="text-xs md:text-sm font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Client Types */}
              <div className={`group absolute md:relative inset-x-0 bg-[#121212] rounded-[2rem] p-6 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-700 md:opacity-100 md:z-auto md:scale-100 md:translate-y-0 ${activeProcessCard === 1 ? 'z-30 opacity-100 scale-100 translate-y-0' : activeProcessCard === 2 ? 'z-10 opacity-0 scale-90 translate-y-8' : 'z-20 opacity-40 scale-95 translate-y-4'} md:hover:-translate-y-1 hover:border-white/10`}>
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-12 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    WHO WE WORK WITH
                  </div>
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-2xl font-medium mb-2 transition-colors duration-500 group-hover:text-white">Homeowners</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Transforming homes through thoughtful renovations and spatial redesign.</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-medium mb-2 transition-colors duration-500 group-hover:text-white">Brands & Retail</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Aligning spatial environments perfectly with brand identity.</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-medium mb-2 transition-colors duration-500 group-hover:text-white">Developers</h4>
                      <p className="text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Strategic visualization and concepts for seamless presentations.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div className={`group absolute md:relative inset-x-0 bg-[#121212] rounded-[2rem] p-6 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-700 md:opacity-100 md:z-auto md:scale-100 md:translate-y-0 ${activeProcessCard === 2 ? 'z-30 opacity-100 scale-100 translate-y-0' : activeProcessCard === 0 ? 'z-10 opacity-0 scale-90 translate-y-8' : 'z-20 opacity-40 scale-95 translate-y-4'} md:hover:-translate-y-1 hover:border-white/10`}>
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

          {/* Conceptual Imagery Gallery */}
          <motion.section 
            id="gallery"
            ref={galleryRef}
            className="mt-32 col-span-2 md:col-span-12 flex flex-col items-center justify-center min-h-[50vh] md:min-h-[80vh] py-20 overflow-hidden"
          >
            <div className="text-center mb-16 px-4">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6 uppercase">
                Conceptual Imagery
              </h2>
              <p className="text-lg font-light text-white/50 max-w-xl mx-auto">
                An idea bank showcasing our versatile approach to spatial design, materials, and form.
              </p>
            </div>

            <div className="w-full max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 grid-flow-row-dense auto-rows-[180px] md:auto-rows-[400px]">
              {GALLERY_SECTIONS.map((item, index) => (
                <motion.div
                  key={item.id}
                  style={{ y: getParallaxY(index) }}
                  onClick={() => setSelectedGalleryImage(item.image)}
                  className={`group relative rounded-[12px] overflow-hidden bg-black shadow-lg cursor-pointer transition-all duration-[0.8s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(255,255,255,0.12)] ${item.span}`}
                >
                  <div className="absolute inset-0 bg-[#f0f0f0] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt="Conceptual Imagery" 
                      className="w-full h-full object-cover transition-transform duration-[0.7s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Clean Tim Fu Style Caption Overlay */}
                  <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-start items-end pointer-events-none z-10 transition-opacity duration-500">
                    <h3 className="text-[10px] md:text-xs font-medium text-[#cccccc] tracking-wider uppercase leading-none">
                      Studio Visionary Conceptual Imagery
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="col-span-2 md:col-span-12 mt-12 mb-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40 tracking-widest uppercase">
            <p>&copy; {new Date().getFullYear()} Studio Visionary. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://www.linkedin.com/in/noahvilleroel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            </div>
          </footer>

        </div>
      </main>

      <QuizModal 
        isOpen={isProjectStarterOpen} 
        onClose={() => setIsProjectStarterOpen(false)} 
      />

      <AnimatePresence>
        {selectedGalleryImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedGalleryImage(null)}
          >
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-[110]"
              onClick={() => setSelectedGalleryImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedGalleryImage}
              alt="Conceptual Imagery Full Size"
              className="w-full h-full object-contain cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
