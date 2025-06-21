import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './styles/leaflet.css'
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AppWrapper>
      <App />
    </AppWrapper>
  </ThemeProvider>,
)
