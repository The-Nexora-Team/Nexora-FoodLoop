import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FoodLoopProvider, useFoodLoop } from './context/FoodLoopContext.jsx';
import { ROLES } from './utils/constants.js';

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

/**
 * Strict Role Guard Component:
 * Blocks unauthorized users from entering other roles' routes.
 * If a restaurant visits /receiver or /admin, they get bounced straight to /restaurant.
 */
function RoleRoute({ allowedRoles, children }) {
  const { state } = useFoodLoop();
  const user = state.currentUser;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const roleDefaultRoutes = {
      [ROLES.RESTAURANT]: '/restaurant',
      [ROLES.RECEIVER]: '/receiver',
      [ROLES.VOLUNTEER]: '/volunteer',
      [ROLES.ADMIN]: '/admin',
    };
    return <Navigate to={roleDefaultRoutes[user.role] || '/'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <FoodLoopProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* App Layout (Auth Protected) */}
          <Route element={<AppLayout />}>
            {/* Restaurant Only */}
            <Route
              path="/restaurant"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <RestaurantDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/restaurant/post"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <PostSurplus />
                </RoleRoute>
              }
            />
            <Route
              path="/restaurant/listings"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <FoodListings />
                </RoleRoute>
              }
            />
            <Route
              path="/restaurant/listing/:id"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <ListingDetail />
                </RoleRoute>
              }
            />
            <Route
              path="/restaurant/report"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <WasteReport />
                </RoleRoute>
              }
            />
            <Route
              path="/restaurant/receipt/:id"
              element={
                <RoleRoute allowedRoles={[ROLES.RESTAURANT, ROLES.ADMIN]}>
                  <DonationReceipt />
                </RoleRoute>
              }
            />

            {/* Receiver Only */}
            <Route
              path="/receiver"
              element={
                <RoleRoute allowedRoles={[ROLES.RECEIVER, ROLES.ADMIN]}>
                  <ReceiverDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/receiver/offers"
              element={
                <RoleRoute allowedRoles={[ROLES.RECEIVER, ROLES.ADMIN]}>
                  <IncomingOffers />
                </RoleRoute>
              }
            />
            <Route
              path="/receiver/history"
              element={
                <RoleRoute allowedRoles={[ROLES.RECEIVER, ROLES.ADMIN]}>
                  <AcceptedHistory />
                </RoleRoute>
              }
            />

            {/* Volunteer Only */}
            <Route
              path="/volunteer"
              element={
                <RoleRoute allowedRoles={[ROLES.VOLUNTEER, ROLES.ADMIN]}>
                  <VolunteerDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/volunteer/pickups"
              element={
                <RoleRoute allowedRoles={[ROLES.VOLUNTEER, ROLES.ADMIN]}>
                  <PickupBoard />
                </RoleRoute>
              }
            />
            <Route
              path="/volunteer/delivery/:id"
              element={
                <RoleRoute allowedRoles={[ROLES.VOLUNTEER, ROLES.ADMIN]}>
                  <DeliveryConfirm />
                </RoleRoute>
              }
            />

            {/* Admin Only */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <DemoControl />
                </RoleRoute>
              }
            />

            {/* Shared Accessible to All Logged In Users */}
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