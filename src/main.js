// Ana sayfa üçün entry point
// Vite bu faylı import edib minify + obfuscate edəcək

// CSS import
import '../hcstil.css';

// GSAP is loaded globally via script tag in index.html

// Modullar
import './modules/weather.js';
import './modules/letters.js';
import './modules/theme.js';
import './modules/notes.js';
import './modules/films.js';

// Ana JS məntiqi
import '../hcayar.js';

// İl dönümü JS məntiqi
import '../anniversary.js';
