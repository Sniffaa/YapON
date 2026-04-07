import './style.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './register';
import NotFound from './404';
import Login from './login';
import Home from './home';
import Admin from './admin';
import Profile from './profile';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import reportWebVitals from './reportWebVitals';

library.add(fas);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/profile/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();