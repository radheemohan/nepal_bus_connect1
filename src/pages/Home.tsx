import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Calendar, Search, ShieldCheck, Clock, TicketCheck, ArrowLeftRight } from 'lucide-react';

export default function Home() {
  const [locations, setLocations] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        if (data.length >= 2) {
          setSource(data.find((l: string) => l === 'Kathmandu') || data[0]);
          setDestination(data.find((l: string) => l === 'Pokhara') || data[1]);
        }
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (source && destination && date) {
      if (source === destination) {
        alert("Source and destination cannot be the same.");
        return;
      }
      navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
    }
  };

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  return (
    <div className="-mt-8">
      {/* Hero Section */}
      <div className="relative bg-blue-600 pt-20 pb-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full object-cover opacity-20 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
            Journey Across Nepal
          </h1>
          <p className="text-blue-100 text-lg md:text-2xl font-medium max-w-2xl mx-auto drop-shadow-md">
            Book AC Delux, Tourist, and Sleeper buses to any of the 77 districts instantly.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-20 mb-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          <form onSubmit={handleSearch} className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">From</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-blue-500" />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-gray-900"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Source</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center md:col-span-1 pb-4">
                <button type="button" onClick={handleSwap} className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors border border-blue-100" title="Swap locations">
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">To</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-blue-500" />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-gray-900"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Destination</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-4 h-5 w-5 text-blue-500" />
                  <input 
                    type="date" 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-gray-900"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] text-lg shadow-xl shadow-blue-600/30"
            >
              <Search className="h-6 w-6" />
              Search Available Buses
            </button>
          </form>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h3>
            <p className="text-gray-500 leading-relaxed font-medium">Pay seamlessly using eSewa, Khalti, or direct bank transfer with enterprise-grade security.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
              <TicketCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Live Seat Selection</h3>
            <p className="text-gray-500 leading-relaxed font-medium">View the bus layout in real-time and lock your favorite window or aisle seat instantly.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
            <p className="text-gray-500 leading-relaxed font-medium">We're here day and night for any inquiries or booking alterations across all regions.</p>
          </div>
        </div>
      </div>

      {/* Popular Routes Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Popular Routes</h2>
            <p className="text-gray-500 text-lg font-medium">Discover Nepal's most traveled destinations.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { from: 'Kathmandu', to: 'Pokhara', image: 'https://images.unsplash.com/photo-1623812836214-d0be0b2015f5?w=600&auto=format&fit=crop&q=60', price: '900' },
              { from: 'Kathmandu', to: 'Chitwan', image: 'https://images.unsplash.com/photo-1598914613391-7c9fc78cbe4f?w=600&auto=format&fit=crop&q=60', price: '750' },
              { from: 'Pokhara', to: 'Lumbini', image: 'https://images.unsplash.com/photo-1549488344-c7da44b2cc76?w=600&auto=format&fit=crop&q=60', price: '1100' },
              { from: 'Kathmandu', to: 'Dharan', image: 'https://images.unsplash.com/photo-1605333333333-notreal?w=600&auto=format&fit=crop&q=60', fallbackBg: 'bg-green-700', price: '1300' }
            ].map((route, i) => (
               <div key={i} className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 aspect-square"
                 onClick={() => {
                   setSource(route.from);
                   setDestination(route.to);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 }}
               >
                 {route.image && !route.fallbackBg ? (
                   <img src={route.image} alt={route.to} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className={`w-full h-full ${route.fallbackBg || 'bg-blue-600'} group-hover:scale-105 transition-transform duration-500 opacity-80`} />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                   <p className="text-white font-bold text-xl mb-1 drop-shadow-md">{route.from} to {route.to}</p>
                   <p className="text-blue-300 font-medium text-sm drop-shadow-md">Starts from Rs. {route.price}</p>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Special Offers Section */}
      <div className="py-20 bg-gray-50 border-t border-gray-100 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
           <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 max-w-lg mb-8 md:mb-0">
                <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">Get 20% Off on First Booking!</h2>
                <p className="text-blue-100 text-lg mb-6">Use code <span className="font-mono bg-white text-blue-600 px-2 py-1 rounded font-bold ml-1">SEWA20</span> at checkout to avail this exclusive offer on any route.</p>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Book Now
                </button>
              </div>
              <div className="relative z-10 hidden md:block">
                 <div className="w-56 h-56 bg-blue-500/30 rounded-full flex items-center justify-center p-4 backdrop-blur-sm border border-blue-400">
                    <span className="text-8xl">🚌</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
