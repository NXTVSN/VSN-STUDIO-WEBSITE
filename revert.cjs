const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Revert Navigation
code = code.replace(
  '<div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border border-white/20 rounded-none">',
  '<div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">'
);
code = code.replace(
  '<div className="text-[10px] font-bold tracking-[0.3em] uppercase cursor-pointer" onClick={() => scrollTo(\'home\')}>',
  '<div className="text-xs font-bold tracking-widest uppercase cursor-pointer" onClick={() => scrollTo(\'home\')}>'
);
code = code.replace(
  'VSN\n          </div>\n          <div className="flex items-center gap-8 text-[9px] font-bold tracking-[0.2em] uppercase">',
  'STUDIO VISIONARY\n          </div>\n          <div className="flex items-center gap-8 text-[10px] font-bold tracking-widest uppercase">'
);
code = code.replace(
  '<button \n              onClick={() => scrollTo(\'contact\')} \n              className="bg-white text-black px-5 py-2 rounded-none hover:bg-white/80 transition-all hidden md:block border border-white"\n            >',
  '<button \n              onClick={() => setIsProjectStarterOpen(true)} \n              className="bg-[#0f2c59] text-white px-4 py-2 rounded-full hover:bg-[#1a3a6e] hover:shadow-[0_0_15px_rgba(15,44,89,0.5)] transition-all hidden md:block shadow-lg border border-[#1a3a6e]"\n            >'
);

// 2. Revert Contact Form
const contactForm = `<div id="contact" className="w-full bg-[#111] text-white rounded-none p-8 md:p-12 flex flex-col md:flex-row justify-between items-start gap-12 border border-white/20">
              <div className="md:w-1/3">
                <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 mb-6">
                  <div className="w-4 h-[1px] bg-white/50"></div>
                  NEW INQUIRY
                </div>
                <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4">
                  Start a Dialogue
                </h2>
                <p className="text-sm font-light text-white/50 leading-relaxed">
                  Outline your vision and we will contact you to arrange an initial consultation and discuss feasibility.
                </p>
              </div>
              <div className="md:w-2/3 w-full">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => { e.preventDefault(); alert("Inquiry Sent. We will be in touch."); }}>
                  <input type="text" placeholder="Full Name" className="bg-transparent border-b border-white/20 pb-3 text-sm focus:outline-none focus:border-white transition-colors" required />
                  <input type="email" placeholder="Email Address" className="bg-transparent border-b border-white/20 pb-3 text-sm focus:outline-none focus:border-white transition-colors" required />
                  <input type="text" placeholder="Project Type / Brief" className="bg-transparent border-b border-white/20 pb-3 text-sm focus:outline-none focus:border-white transition-colors md:col-span-2" required />
                  <button type="submit" className="md:col-span-2 bg-white text-black px-6 py-4 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white/80 transition-colors flex items-center justify-between mt-2 rounded-none">
                    SUBMIT INQUIRY <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>`;
const contactCard = `<div id="contact" onClick={() => setIsProjectStarterOpen(true)} className="w-full bg-[#0f2c59] text-white rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center relative hover:bg-[#123161] hover:scale-[0.99] transition-all duration-300 cursor-pointer group shadow-[0_0_40px_rgba(15,44,89,0.3)] border border-[#1a3a6e]">
              <div>
                <div className="px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-6">
                  NEW INQUIRY
                </div>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
                  Start Your Project
                </h2>
                <p className="text-sm font-medium text-white/70 max-w-md mt-4">
                  Engage with our studio to begin developing your architectural vision.
                </p>
              </div>
              <div className="mt-8 md:mt-0 flex items-center gap-4">
                <span className="text-sm font-bold tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">Initiate</span>
                <div className="w-14 h-14 rounded-full bg-white text-[#0f2c59] flex items-center justify-center group-hover:-rotate-45 transition-transform duration-300 shadow-lg">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
            </div>`;
code = code.replace(contactForm, contactCard);

// 3. Revert Module 1
const mod1New = `<div className="col-span-1 md:col-span-4 bg-[#111] rounded-none border border-white/20 p-8 md:p-10 flex flex-col justify-between min-h-[400px] md:min-h-[60vh] relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/70">
                  <div className="w-4 h-[1px] bg-white/50"></div>
                  VISION
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.05] mb-6">
                Architecture,<br/>Identity,<br/>Experience
              </h1>
              <p className="text-sm font-light text-white/50 leading-relaxed max-w-sm mb-8">
                A multidisciplinary studio fusing architectural design, visualization, and brand thinking. We partner with clients to design functional spaces driven by meaningful experiences.
              </p>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">
                Residential &bull; Commercial &bull; Branding
              </p>
            </div>
            
            <div className="mt-12 relative z-10 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsProjectStarterOpen(true)} 
                className="group/btn flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-[#0f2c59] text-white px-5 py-3 rounded-full hover:bg-[#0c244a] transition-all border border-white/10"
              >
                START A PROJECT
                <ArrowUpRight className="w-4 h-4 opacity-80 group-hover/btn:rotate-45 transition-transform" />
              </button>
              <button onClick={() => scrollTo('projects')} className="group/btn flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white/70 transition-colors px-2">
                VIEW PROJECTS
              </button>
            </div>
          </div>`;
const mod1Old = `<div className="col-span-1 md:col-span-4 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[400px] md:min-h-[60vh] relative group overflow-hidden shadow-2xl">
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
              <p className="text-sm font-light text-white/50 leading-relaxed max-w-sm mb-6">
                A multidisciplinary studio fusing architectural design, visualization, and brand thinking.
                <br/><br/>
                We partner with clients to design functional spaces driven by meaningful experiences.
              </p>
              <p className="text-[10px] font-medium tracking-widest uppercase text-white/40">
                Residential &bull; Commercial &bull; Branding
              </p>
            </div>
            
            <div className="mt-12 relative z-10 flex flex-wrap gap-4">
              <button 
                onClick={() => setIsProjectStarterOpen(true)} 
                className="group/btn flex items-center gap-3 text-xs font-bold tracking-widest uppercase bg-[#0f2c59] text-white px-4 py-2.5 rounded-full hover:bg-[#1a3a6e] hover:shadow-[0_0_20px_rgba(15,44,89,0.4)] transition-all border border-white/10"
              >
                START A PROJECT
                <ArrowUpRight className="w-4 h-4 ml-1 opacity-80 group-hover/btn:rotate-45 transition-transform" />
              </button>
              <button onClick={() => scrollTo('projects')} className="group/btn flex items-center gap-3 text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors px-2">
                VIEW PROJECTS
              </button>
            </div>
          </div>`;
code = code.replace(mod1New, mod1Old);

// 4. Revert Module 2 (Video Render)
const mod2New = `<div className="col-span-1 md:col-span-8 bg-[#111] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[60vh] overflow-hidden group">
            <div className="absolute top-8 left-8 z-10">
              <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/70 drop-shadow-md">
                <div className="w-4 h-[1px] bg-white/50"></div>
                LATEST RENDER
              </div>
            </div>`;
const mod2Old = `<div className="col-span-1 md:col-span-8 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[60vh] overflow-hidden shadow-2xl group">
            <div className="absolute top-8 left-8 z-10">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                LATEST RENDER
              </div>
            </div>`;
code = code.replace(mod2New, mod2Old);

// 5. Revert About
const aboutNew = `<div id="about" className="col-span-1 md:col-span-3 bg-[#111] rounded-none border border-white/20 flex flex-col relative min-h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop" 
              alt="Principal Architect" 
              className="w-full h-48 md:h-64 object-cover grayscale opacity-80" 
            />
            <div className="p-8 md:p-10 flex flex-col flex-grow justify-between">
              <div>
                <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/70 mb-8">
                  <div className="w-4 h-[1px] bg-white/50"></div>
                  ABOUT STUDIO
                </div>
                <p className="text-lg font-light tracking-tight leading-snug mb-6">
                  Transforming ideas into buildable, thought-provoking spaces.
                </p>
                <p className="text-sm font-light text-white/50 leading-relaxed">
                  We combine architectural thinking with high-end visualization to design environments with absolute clarity before construction begins.
                </p>
              </div>
            </div>
          </div>`;
const aboutOld = `<div id="about" className="col-span-1 md:col-span-3 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-8">
                ABOUT STUDIO
              </div>
              <p className="text-lg font-medium tracking-tight leading-snug mb-6">
                Transforming ideas into buildable, thought-provoking spaces.
              </p>
              <p className="text-sm font-light text-white/50 leading-relaxed">
                We combine architectural thinking with high-end visualization to design environments with absolute clarity before construction begins.
              </p>
            </div>
          </div>`;
code = code.replace(aboutNew, aboutOld);

// 6. Revert Projects
const projectsNew = `<div id="projects" className="col-span-1 md:col-span-6 bg-[#111] rounded-none border border-white/20 relative min-h-[400px] md:min-h-[300px] overflow-hidden group">
            <div className="absolute top-8 left-8 z-20">
              <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/70 drop-shadow-md">
                <div className="w-4 h-[1px] bg-white/50"></div>
                SELECTED WORKS
              </div>
            </div>`;
const projectsOld = `<div id="projects" className="col-span-1 md:col-span-6 bg-[#121212] rounded-[2rem] border border-white/5 relative min-h-[400px] md:min-h-[300px] overflow-hidden group shadow-2xl">
            <div className="absolute top-8 left-8 z-20">
              <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70">
                SELECTED WORKS
              </div>
            </div>`;
code = code.replace(projectsNew, projectsOld);

// 7. Revert Trust
const trustNew = `<div className="col-span-1 md:col-span-3 bg-[#111] rounded-none border border-white/20 p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative">
            <div>
              <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/70 mb-8">
                <div className="w-4 h-[1px] bg-white/50"></div>
                DESIGNED FOR REAL SPACES
              </div>`;
const trustOld = `<div className="col-span-1 md:col-span-3 bg-[#121212] rounded-[2rem] border border-white/5 p-8 md:p-10 flex flex-col justify-between min-h-[300px] relative shadow-2xl">
            <div>
              <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-8">
                DESIGNED FOR REAL SPACES
              </div>`;
code = code.replace(trustNew, trustOld);

// 8. Revert Client Marquee
const marqueeNew = `className="col-span-1 md:col-span-12 bg-[#111] rounded-none border border-white/20 p-6 md:p-8 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            {/* Cyber/Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            
            <div className="relative z-10 flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Clients</div>
                <div className="text-white/50 text-xs font-light">Worldwide</div>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 overflow-hidden md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 border-white/10 md:border-l" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                className="flex gap-8 text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-white/50 whitespace-nowrap items-center"`;

const marqueeOld = `className="col-span-1 md:col-span-12 bg-[#121212] rounded-[2rem] border border-white/5 p-6 md:p-8 overflow-hidden relative shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            {/* Cyber/Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            
            <div className="relative z-10 flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Clients</div>
                <div className="text-white/50 text-xs font-medium">Worldwide</div>
              </div>
            </div>

            <div className="relative z-10 flex-1 w-full overflow-hidden md:border-l border-white/10 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                className="flex gap-8 text-sm md:text-base font-bold tracking-widest uppercase text-white/60 whitespace-nowrap items-center"`;
code = code.replace(marqueeNew, marqueeOld);

// 9. Services
const servicesNew = `className="col-span-1 md:col-span-6 bg-white text-black rounded-none p-6 md:p-10 flex flex-col border border-white"
          >
            <div className="flex flex-col justify-between items-start mb-8">
              <div className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 text-black/50">
                <span>03</span>
                <div className="w-8 h-[1px] bg-black/20"></div>
                <span>SERVICES</span>
              </div>
              <div className="text-left flex flex-col items-start w-full">
                <h2 className="text-3xl md:text-4xl font-light tracking-tighter uppercase mb-4">
                  We offer wide range<br/><span className="text-black/40">of services</span>
                </h2>
                <div className="flex flex-col text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">`;
const servicesOld = `className="mt-8 col-span-1 md:col-span-6 bg-white text-black rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col"
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
                <div className="flex flex-col text-xs font-medium text-black/60 uppercase tracking-widest">`;
code = code.replace(servicesNew, servicesOld);

// Fix services images
const servicesImgNew = `<div className="w-full h-[160px] rounded-none border border-black/10 overflow-hidden relative bg-black/5 shrink-0">
                              <img 
                                src={generatedImages[service.id] || service.image} 
                                className="absolute inset-0 w-full h-full object-cover grayscale opacity-90" `;
const servicesImgOld = `<div className="w-full h-[160px] rounded-xl overflow-hidden relative bg-black/5 shrink-0">
                              <img 
                                src={generatedImages[service.id] || service.image} 
                                className="absolute inset-0 w-full h-full object-cover" `;
code = code.split(servicesImgNew).join(servicesImgOld);

// 10. Featured Project
const featureNew = `className="col-span-1 md:col-span-6 flex"
          >
            <div className="relative w-full h-full min-h-[500px] rounded-none overflow-hidden group flex-grow border border-white/20">
              {/* Note: Upload your image to the public folder and update this src to "/your-image-name.jpg" */}
              <img 
                src="/featuredwork.png?v=2" 
                alt="SYLVA CIRCLE" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0" 
              />
              <div className="absolute inset-0 bg-black/40 transition-colors duration-700 group-hover:bg-black/20" />
              
              <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between z-10">
                <div className="flex justify-between items-center text-[9px] font-bold tracking-[0.2em] uppercase text-white">
                  <span className="flex items-center gap-3 drop-shadow-md"><div className="w-4 h-[1px] bg-white/50"></div>FEATURED PROJECT</span>
                  <span className="drop-shadow-md">2780 SQFT</span>
                </div>
                
                <div className="text-center mt-auto mb-8">
                  <h2 className="text-4xl md:text-6xl font-light tracking-tighter uppercase leading-[0.85] text-white">
                    SYLVA<br/>CIRCLE
                  </h2>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-none border border-white/30 backdrop-blur-md text-[9px] uppercase tracking-[0.2em] text-white">Architecture</span>
                    <span className="px-3 py-1.5 rounded-none border border-white/30 backdrop-blur-md text-[9px] uppercase tracking-[0.2em] text-white">Interior</span>
                  </div>
                  <button className="w-12 h-12 rounded-none bg-white text-black flex items-center justify-center transition-colors shrink-0 hover:bg-white/80">`;

const featureOld = `className="mt-8 col-span-1 md:col-span-6 flex"
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
                  <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shrink-0">`;
code = code.replace(featureNew, featureOld);

// 11. Process & Others
const processNew = `{/* Section Header */}
            <div className="text-center md:text-left max-w-3xl px-4 md:px-0">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tighter mb-4">
                How We Turn Vision Into Built Environments
              </h2>
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
                Architecture, brand thinking, and visualization working together to shape meaningful spaces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Process */}
              <div className="group relative bg-[#111] rounded-none p-8 md:p-12 border border-white/20 overflow-hidden transition-all duration-500 hover:border-white/40">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 mb-12 transition-colors duration-500 group-hover:text-white/70">
                    <div className="w-4 h-[1px] bg-white/30 group-hover:bg-white/50 transition-colors"></div>
                    OUR DESIGN PROCESS
                  </div>`;

const processOld = `{/* Section Header */}
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
                  </div>`;
code = code.replace(processNew, processOld);

const clientNew = `{/* Client Types */}
              <div className="group relative bg-[#111] rounded-none p-8 md:p-12 border border-white/20 overflow-hidden transition-all duration-500 hover:border-white/40">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 mb-12 transition-colors duration-500 group-hover:text-white/70">
                    <div className="w-4 h-[1px] bg-white/30 group-hover:bg-white/50 transition-colors"></div>
                    WHO WE WORK WITH
                  </div>
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-xl md:text-2xl font-light mb-2 transition-colors duration-500 group-hover:text-white">Homeowners</h4>
                      <p className="text-sm md:text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Transforming homes through thoughtful renovations and spatial redesign.</p>
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-light mb-2 transition-colors duration-500 group-hover:text-white">Brands & Retail</h4>
                      <p className="text-sm md:text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Aligning spatial environments perfectly with brand identity.</p>
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-light mb-2 transition-colors duration-500 group-hover:text-white">Developers</h4>
                      <p className="text-sm md:text-base font-light text-white/50 leading-relaxed transition-colors duration-500 group-hover:text-white/70">Strategic visualization and concepts for seamless presentations.</p>
                    </div>`;

const clientOld = `{/* Client Types */}
              <div className="group relative bg-[#121212] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:-translate-y-1 hover:border-white/10">
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
                    </div>`;
code = code.replace(clientNew, clientOld);

const deliverablesNew = `{/* Deliverables */}
              <div className="group relative bg-[#111] rounded-none p-8 md:p-12 border border-white/20 overflow-hidden transition-all duration-500 hover:border-white/40">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 mb-10 transition-colors duration-500 group-hover:text-white/70">
                    <div className="w-4 h-[1px] bg-white/30 group-hover:bg-white/50 transition-colors"></div>
                    PROJECT DELIVERABLES
                  </div>`;

const deliverablesOld = `{/* Deliverables */}
              <div className="group relative bg-[#121212] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)] hover:-translate-y-1 hover:border-white/10">
                <div className="relative z-10">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/70 inline-block mb-10 transition-colors duration-500 group-hover:text-white group-hover:border-white/20">
                    PROJECT DELIVERABLES
                  </div>`;
code = code.replace(deliverablesNew, deliverablesOld);

fs.writeFileSync('src/App.tsx', code);
