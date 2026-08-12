const fs = require('fs');

function replaceFile(path, oldText, newText) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(oldText, newText);
  fs.writeFileSync(path, content);
}

replaceFile('src/App.tsx', 
  '<div className="cursor-pointer" onClick={() => scrollTo(\'home\')}>\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </div>',
  '<div className="text-xs font-bold tracking-widest uppercase cursor-pointer" onClick={() => scrollTo(\'home\')}>\n            STUDIO VISIONARY\n          </div>'
);

replaceFile('src/Contact.tsx',
  '<a href="/" className="hover:opacity-70 transition-opacity">\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </a>',
  '<a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">\n            STUDIO VISIONARY\n          </a>'
);

replaceFile('src/SeoLanding.tsx',
  '<div>\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </div>',
  '<div className="text-xs font-bold tracking-widest uppercase">\n            STUDIO VISIONARY\n          </div>'
);

replaceFile('src/ThankYou.tsx',
  '<a href="/" className="hover:opacity-70 transition-opacity">\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </a>',
  '<a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">\n            STUDIO VISIONARY\n          </a>'
);

replaceFile('src/PrivacyPolicy.tsx',
  '<a href="/" className="hover:opacity-70 transition-opacity">\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </a>',
  '<a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">\n            STUDIO VISIONARY\n          </a>'
);

replaceFile('src/TermsOfService.tsx',
  '<a href="/" className="hover:opacity-70 transition-opacity">\n            <img src="/logoicon.png" alt="Studio Visionary" className="h-16 md:h-20 w-auto object-contain" />\n          </a>',
  '<a href="/" className="text-xs font-bold tracking-widest uppercase hover:text-white/70 transition-colors">\n            STUDIO VISIONARY\n          </a>'
);
