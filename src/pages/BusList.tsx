import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Ticket, Users, ArrowRight, Star, Wifi, BatteryCharging, Snowflake, MapPin } from 'lucide-react';

interface Trip {
  id: number;
  bus_number: string;
  type: string;
  total_seats: number;
  available_seats: number;
  departure_time: string;
  arrival_time: string;
  price: number;
  source: string;
  destination: string;
  date: string;
}

export default function BusList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  
  const source = searchParams.get('source');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  useEffect(() => {
    if (source && destination && date) {
      setLoading(true);
      fetch(`/api/trips?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`)
        .then(res => res.json())
        .then(data => {
          setTrips(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [source, destination, date]);

  const handleBook = (tripId: number) => {
    navigate(`/book/${tripId}`);
  };

  if (!source || !destination || !date) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Invalid Search</h2>
        <p className="text-gray-600 mt-2">Please go back and search again.</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {source} <ArrowRight className="w-5 h-5 text-gray-400" /> {destination}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3">
            <p className="text-gray-500 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4" />
              {format(new Date(date), 'EEEE, MMMM do, yyyy')}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                {trips.length} / {Math.max(25, trips.length)} Buses Today
              </span>
              {trips.length === 0 && (
                 <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 animate-pulse">
                   Route Full / Sold Out
                 </span>
              )}
              {(trips.length > 0 && trips.length <= 5) && (
                 <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                   Few buses left!
                 </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="mt-4 md:mt-0 text-blue-600 font-medium hover:underline">
          Modify Search
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Filters</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Bus Type</h4>
              <div className="space-y-2">
                {['AC Deluxe', 'Tourist Bus', 'Sleeper', 'Standard'].map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" defaultChecked />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Departure Time</h4>
              <div className="space-y-2">
                {['Morning (6AM - 12PM)', 'Afternoon (12PM - 6PM)', 'Night (After 6PM)'].map(time => (
                  <label key={time} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" defaultChecked />
                    {time}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bus List */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 font-medium">Searching for buses...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">No buses found</h2>
              <p className="text-gray-500 mt-2 font-medium">Try changing your date or route.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trips.map((trip, idx) => {
                const rating = (4 + Math.random() * 0.9).toFixed(1);
                const reviews = Math.floor(Math.random() * 200) + 50;
                
                return (
                  <div key={trip.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden hover:border-blue-300 transition-all group">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold uppercase rounded-xl tracking-wider mb-2">
                              <BusIcon /> {trip.type}
                            </span>
                            <h3 className="text-xl font-black text-gray-900">{trip.bus_number}</h3>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-green-700" />
                              <span className="font-bold">{rating}</span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium mt-1">{reviews} reviews</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 mt-6">
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Departure</p>
                            <p className="text-lg font-black text-gray-900 leading-none">
                              {format(new Date(trip.departure_time), 'hh:mm a')}
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>{trip.source}</p>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <div className="w-full h-px bg-gray-300 relative border-dashed">
                              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-3 text-xs text-gray-500 font-bold border border-gray-200 rounded-full">
                                Direct
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Arrival</p>
                            <p className="text-lg font-black text-gray-900 leading-none">
                              {format(new Date(trip.arrival_time), 'hh:mm a')}
                            </p>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center justify-end gap-1"><MapPin className="w-3 h-3"/>{trip.destination}</p>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-4 text-gray-400">
                          {trip.type.includes('AC') && <div className="flex items-center gap-1.5 text-sm font-medium" title="Air Conditioning"><Snowflake className="w-4 h-4"/> AC</div>}
                          {trip.type.includes('Deluxe') && <div className="flex items-center gap-1.5 text-sm font-medium" title="WiFi"><Wifi className="w-4 h-4"/> WiFi</div>}
                          <div className="flex items-center gap-1.5 text-sm font-medium" title="Charging Points"><BatteryCharging className="w-4 h-4"/> Power</div>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-gray-50 md:w-72 flex flex-col justify-center relative border-l border-white/50">
                        <div className="flex justify-between items-center md:flex-col md:items-end mb-6 md:mb-0 w-full">
                          <p className="text-3xl font-black text-gray-900 flex items-center">
                            <span className="text-sm text-gray-500 mr-2 font-bold tracking-widest uppercase">Rs.</span>
                            {trip.price}
                          </p>
                          
                          <div className="flex flex-col items-end text-sm text-gray-600 mt-3 w-full">
                            {trip.available_seats <= 10 ? (
                              <div className="text-red-600 font-bold flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-lg w-full justify-end">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                Only {trip.available_seats} seats left
                              </div>
                            ) : (
                              <span className="font-bold flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-full justify-end">
                                <Users className="w-4 h-4" />
                                {trip.available_seats} available
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleBook(trip.id)}
                          disabled={trip.available_seats === 0}
                          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 disabled:from-gray-400 disabled:to-gray-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-md shadow-blue-600/20"
                        >
                          <Ticket className="w-5 h-5" />
                          {trip.available_seats === 0 ? 'Sold Out' : 'Select Seats'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const BusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
);
