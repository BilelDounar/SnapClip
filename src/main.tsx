import React from 'react';
import ReactDOM from 'react-dom/client';
import {App} from './App';
import {Overlay} from './components/Overlay';
import './styles.css';

// A single bundle powers two windows. The overlay window is served from
// overlay.html; everything else renders the control panel.
const isOverlay = window.location.pathname.includes('overlay');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isOverlay ? <Overlay /> : <App />}</React.StrictMode>,
);
