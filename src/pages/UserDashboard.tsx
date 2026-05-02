import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Calendar, Clock, AlertCircle, CheckCircle, Clock3 } from 'lucide-react';
import { format } from 'date-fns';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple polling for real-time updates
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchMyBookings = () => {
      fetch(`/api/user/bookings?user=${encodeURIComponent(user)}`)
        .then(res => res.json())
        .then(data => {
          setBookings(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };

    fetchMyBookings();
    
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchMyBookings, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-2">Manage your tickets and view approval status.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Ticket className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't booked any trips yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Find a Bus
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">{booking.id}</span>
                  </div>
                  <div>
                    {booking.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle className="w-4 h-4" /> Approved
                      </span>
                    ) : booking.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 animate-pulse">
                        <Clock3 className="w-4 h-4" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <AlertCircle className="w-4 h-4" /> Cancelled
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Route</p>
                    <p className="font-bold text-gray-900">{booking.source} → {booking.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Date & Time</p>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      {format(new Date(booking.date), 'MMM do')}
                      <span className="text-gray-400">|</span>
                      <Clock className="w-4 h-4 text-orange-500" />
                      {format(new Date(booking.departure_time), 'hh:mm a')}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Seats</p>
                    <p className="font-bold text-gray-900">{JSON.parse(booking.seat_numbers).join(', ')}</p>
                  </div>
                </div>

                {booking.status === 'cancelled' && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 mb-4">
                    Booking cancelled by admin. Seat released.
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto h-full border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center items-stretch md:items-center">
                <Link
                  to={`/confirmation/${booking.id}`}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold py-3 px-6 rounded-xl border border-gray-200 text-center transition-colors mb-2"
                >
                  View Details
                </Link>
                {booking.status === 'confirmed' && (
                  <Link
                    to={`/confirmation/${booking.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-center transition-colors"
                  >
                    Download Ticket
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
