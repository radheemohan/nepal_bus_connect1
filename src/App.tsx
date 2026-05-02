/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import BusList from './pages/BusList';
import SeatSelection from './pages/SeatSelection';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { User, LogOut, Shield, Ticket } from 'lucide-react';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  if (location.pathname.startsWith('/admin')) {
    return (
       <header className="bg-gray-900 text-white shadow-md">
         <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
           <Link to="/admin/dashboard" className="text-xl font-bold tracking-tight text-red-500 flex items-center gap-2">
             <Shield className="w-5 h-5" /> Admin Panel
           </Link>
           <Link to="/" className="text-sm font-medium text-gray-400 hover:text-white">Public Site</Link>
         </div>
       </header>
    );
  }

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
           <span className="bg-white text-blue-600 p-1 rounded-md text-lg">🚍</span> Nepal Bus Connect
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="text-sm text-blue-200 hover:text-white transition-colors" title="Admin Login"><Shield className="w-4 h-4"/></Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" /> {user}
              </span>
              <Link to="/my-bookings" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                <Ticket className="w-4 h-4" /> My Bookings
              </Link>
              <button 
                onClick={logout}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <User className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<BusList />} />
              <Route path="/book/:tripId" element={<SeatSelection />} />
              <Route path="/confirmation/:bookingId" element={<Confirmation />} />
              <Route path="/my-bookings" element={<UserDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
