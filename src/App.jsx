import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Login from "./pages/Login"
import RestaurantDashboard from "./pages/RestaurantDashboard"
import SurplusFood from "./pages/SurplusFood"
import FoodListings from "./pages/FoodListings"
import ImpactDashboard from "./pages/ImpactDashboard"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RestaurantDashboard />} />
        <Route path="/surplus-food" element={<SurplusFood />} />
        <Route path="/food-listings" element={<FoodListings />} />
        <Route path="/impact" element={<ImpactDashboard />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App