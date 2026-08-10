const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf-8');

const updatedImports = appFile.replace(
  "import { useState, useEffect, useCallback } from 'react';",
  "import { useState, useEffect, useCallback, useRef } from 'react';"
);

fs.writeFileSync('src/App.tsx', updatedImports);
