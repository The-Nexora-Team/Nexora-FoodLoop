import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FoodLoopProvider } from './context/FoodLoopContext.jsx';

import AppLayout from './components/AppLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard.jsx';
import PostSurplus from './pages/restaurant/PostSurplus.jsx';
import ListingDetail from './pages/restaurant/ListingDetail.jsx';
import WasteReport from './pages/restaurant/WasteReport.jsx';
import DonationReceipt from './pages/restaurant/DonationReceipt.jsx';

// Receiver Pages
import ReceiverDashboard from './pages/receiver/ReceiverDashboard.jsx';
import IncomingOffers from './pages/receiver/IncomingOffers.jsx';
import AcceptedHistory from './pages/receiver/AcceptedHistory.jsx';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard.jsx';
import PickupBoard from './pages/volunteer/PickupBoard.jsx';
import DeliveryConfirm from './pages/volunteer/DeliveryConfirm.jsx';

// Admin, Impact, Map
import DemoControl from './pages/admin/DemoControl.jsx';
import ImpactDashboard from './pages/ImpactDashboard.jsx';
import MapPage from './pages/MapPage.jsx';
import FoodListings from './pages/FoodListings.jsx';

export default function App() {
  return (
    <FoodLoopProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* App Layout (Role & Auth Protected) */}
          <Route element={<AppLayout />}>
            {/* Restaurant */}
            <Route path="/restaurant" element={<RestaurantDashboard />} />
            <Route path="/restaurant/post" element={<PostSurplus />} />
            <Route path="/restaurant/listings" element={<FoodListings />} />
            <Route path="/restaurant/listing/:id" element={<ListingDetail />} />
            <Route path="/restaurant/report" element={<WasteReport />} />
            <Route path="/restaurant/receipt/:id" element={<DonationReceipt />} />

            {/* Receiver */}
            <Route path="/receiver" element={<ReceiverDashboard />} />
            <Route path="/receiver/offers" element={<IncomingOffers />} />
            <Route path="/receiver/history" element={<AcceptedHistory />} />

            {/* Volunteer */}
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/volunteer/pickups" element={<PickupBoard />} />
            <Route path="/volunteer/delivery/:id" element={<DeliveryConfirm />} />

            {/* Admin */}
            <Route path="/admin" element={<DemoControl />} />

            {/* Shared */}
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/map" element={<MapPage />} />
          </Route>

          {/* Backward compatibility routes */}
          <Route path="/dashboard" element={<Navigate to="/restaurant" replace />} />
          <Route path="/surplus-food" element={<Navigate to="/restaurant/post" replace />} />
          <Route path="/food-listings" element={<Navigate to="/restaurant/listings" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FoodLoopProvider>
  );
}