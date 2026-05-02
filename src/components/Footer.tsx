import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">🚍</span> Nepal Bus Connect
          </div>
          <p className="text-sm text-gray-400">
            Nepal's most trusted intercity bus booking platform. Travel to all 77 districts with unparalleled comfort and safety.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
            <li><a href="#" className="hover:text-blue-500 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-blue-500 transition-colors">Offers & Discounts</a></li>
            <li><a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
              <span>Gongabu Bus Park, Kathmandu, Nepal</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-500 shrink-0" />
              <span>+977 1-4350000, 9800000000</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500 shrink-0" />
              <span>support@nepalbusconnect.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-gray-400">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-gray-400">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-gray-400">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            &copy; {new Date().getFullYear()} Nepal Bus Connect, Nepal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
