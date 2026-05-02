import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle2, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
// @ts-ignore
import { io } from 'socket.io-client';
// @ts-ignore
import type { Socket } from 'socket.io-client';

export default function SeatSelection() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  // Maps seatId -> userName for currently locked seats by OTHERS or SELF
  const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
  
  const [userName, setUserName] = useState(user || '');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  
  // Payment Modal state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('eSewa');

  useEffect(() => {
    if (user) {
      setUserName(user);
    }
  }, [user]);

  useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then(res => {
        if (!res.ok) throw new Error('Trip not found');
        return res.json();
      })
      .then(data => {
        setTrip(data.trip);
        setBookedSeats(data.bookedSeats);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [tripId]);

  // Socket setup
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinTrip', tripId);
    });

    newSocket.on('currentLocks', (locks: Record<string, string>) => {
      setLockedSeats(locks);
    });

    newSocket.on('seatLocked', ({ seatId, userName }) => {
      setLockedSeats(prev => ({ ...prev, [seatId]: userName }));
    });

    newSocket.on('seatUnlocked', ({ seatId }) => {
      setLockedSeats(prev => {
        const newLocks = { ...prev };
        delete newLocks[seatId];
        return newLocks;
      });
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    });

    newSocket.on('seatsBooked', ({ seats }: { seats: string[] }) => {
      setBookedSeats(prev => [...prev, ...seats]);
      setLockedSeats(prev => {
        const newLocks = { ...prev };
        seats.forEach(s => delete newLocks[s]);
        return newLocks;
      });
      setSelectedSeats(prev => prev.filter(s => !seats.includes(s)));
    });

    newSocket.on('seatsUnbooked', ({ seats }: { seats: string[] }) => {
       setBookedSeats(prev => prev.filter(s => !seats.includes(s)));
    });

    newSocket.on('seatLockError', ({ seatId, message }) => {
      alert(`Cannot lock seat ${seatId}: ${message}`);
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [tripId]);

  const toggleSeat = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return;
    
    // If it's already locked by someone else
    if (lockedSeats[seatId] && !selectedSeats.includes(seatId)) {
        alert(`Seat ${seatId} is currently being booked by someone else.`);
        return;
    }
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
      if (socket) {
        socket.emit('unlockSeat', { tripId, seatId });
      }
    } else {
      if (!user) {
        alert("Please login first to select seats.");
        navigate('/login', { state: { from: location } });
        return;
      }
      if (selectedSeats.length >= 6) {
        alert("You can only select up to 6 seats");
        return;
      }
      setSelectedSeats(prev => [...prev, seatId]);
      if (socket) {
        socket.emit('lockSeat', { tripId, seatId, userName: user });
      }
    }
  };

  const initiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate PIN
    const formData = new FormData(e.currentTarget);
    if (!formData.get('pin')) {
      alert("PIN is required");
      return;
    }

    setBookingLoading(true);
    // Simulate payment gateway redirect and processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          user_name: userName,
          seat_numbers: selectedSeats,
          payment_method: paymentMethod
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');
      
      setShowPayment(false);
      navigate(`/confirmation/${data.booking_id}`);
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading seat map...</div>;
  }

  if (!trip) {
    return <div className="text-center py-12">Trip not found</div>;
  }

  // Generate seats: 36 seats standard = 9 rows x 4 cols (A, B, empty space, C, D)
  const rows = Array.from({ length: Math.ceil(trip.total_seats / 4) }, (_, i) => i + 1);

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Bus List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Select Seats</h2>
            <div className="flex items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-100 border border-green-500 rounded text-center leading-5 text-[10px] text-green-700"></div> Available</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-100 border border-red-500 rounded text-center leading-5 text-[10px] text-red-700 cursor-not-allowed"></div> Booked</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-200 border border-gray-400 rounded text-center leading-5 text-[10px] text-gray-500 cursor-not-allowed"></div> Locked</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-orange-500 rounded text-center leading-5 text-[10px] text-white"></div> Selected</div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-xl flex justify-center border border-gray-200 shadow-inner">
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 relative">
              <div className="absolute -left-3 top-20 bottom-10 w-2 bg-blue-100 rounded-r-lg border border-blue-200" title="Windows"></div>
              <div className="absolute -right-3 top-20 bottom-10 w-2 bg-blue-100 rounded-l-lg border border-blue-200" title="Windows"></div>
              
              <div className="flex justify-end mb-8 w-full border-b-2 border-gray-200 pb-4">
                 <div className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                   Driver
                 </div>
              </div>
              
              <div className="space-y-4">
                {rows.map(row => (
                  <div key={row} className="flex justify-center gap-2">
                    <div className="flex gap-2 mr-3">
                      {['A', 'B'].map((col, index) => {
                        const seatId = `${row}${col}`;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelectedByMe = selectedSeats.includes(seatId);
                        const isLockedByOther = lockedSeats[seatId] && !isSelectedByMe;

                        return (
                          <button
                            key={seatId}
                            onClick={() => toggleSeat(seatId)}
                            disabled={isBooked}
                            title={index === 0 ? "Window Seat" : "Aisle Seat"}
                            className={clsx(
                              "relative w-12 h-12 rounded-t-lg rounded-b shadow-[0_4px_0_0_rgba(0,0,0,0.1)] font-bold text-sm transition-all focus:outline-none flex items-center justify-center",
                              isBooked ? "bg-red-100 border-red-500 text-red-700 cursor-not-allowed opacity-70 shadow-none translate-y-1" :
                              isLockedByOther ? "bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed shadow-none translate-y-1" :
                              isSelectedByMe ? "bg-orange-500 border-orange-600 text-white shadow-[0_2px_0_0_#c2410c] translate-y-0.5" :
                              "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 hover:border-green-500 relative"
                            )}
                            style={{ borderWidth: '2px' }}
                          >
                            {seatId}
                             {isLockedByOther && (
                                <span className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500 rounded-full border border-white" title={`Locked by ${lockedSeats[seatId]}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="w-8 flex items-center justify-center">
                       <span className="text-[10px] text-gray-300 uppercase rotate-90 tracking-[0.2em] whitespace-nowrap">Aisle</span>
                    </div> {/* Aisle */}
                    
                    <div className="flex gap-2 ml-3">
                      {['C', 'D'].map((col, index) => {
                        const seatId = `${row}${col}`;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelectedByMe = selectedSeats.includes(seatId);
                        const isLockedByOther = lockedSeats[seatId] && !isSelectedByMe;

                        return (
                          <button
                            key={seatId}
                            onClick={() => toggleSeat(seatId)}
                            disabled={isBooked}
                            title={index === 1 ? "Window Seat" : "Aisle Seat"}
                            className={clsx(
                              "relative w-12 h-12 rounded-t-lg rounded-b shadow-[0_4px_0_0_rgba(0,0,0,0.1)] font-bold text-sm transition-all focus:outline-none flex items-center justify-center",
                              isBooked ? "bg-red-100 border-red-500 text-red-700 cursor-not-allowed opacity-70 shadow-none translate-y-1" :
                              isLockedByOther ? "bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed shadow-none translate-y-1" :
                              isSelectedByMe ? "bg-orange-500 border-orange-600 text-white shadow-[0_2px_0_0_#c2410c] translate-y-0.5" :
                              "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 hover:border-green-500 relative"
                            )}
                            style={{ borderWidth: '2px' }}
                          >
                            {seatId}
                            {isLockedByOther && (
                                <span className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500 rounded-full border border-white" title={`Locked by ${lockedSeats[seatId]}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Details</h3>
            
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Route</p>
                <p className="font-bold text-gray-900">{trip.source} to {trip.destination}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Bus Info</p>
                <p className="font-bold text-gray-900">{trip.bus_number}</p>
                <p className="text-sm text-gray-600">{trip.type}</p>
              </div>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
               <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Price</p>
                  <p className="text-2xl font-black text-gray-900">
                    Rs. {selectedSeats.length * trip.price}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium mb-1">Seats Selected</p>
                  <p className="text-lg font-bold text-gray-900">{selectedSeats.length || 0}</p>
               </div>
            </div>

            {user ? (
              <form onSubmit={initiatePayment}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Passenger Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      readOnly
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl outline-none cursor-not-allowed"
                      value={userName}
                    />
                  </div>
                  <p className="text-xs text-orange-600 mt-2">Booking as logged in user</p>
                </div>

                <button
                  type="submit"
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 disabled:from-gray-400 disabled:to-gray-500 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-lg shadow-blue-600/30"
                >
                  Proceed to Payment
                </button>
              </form>
            ) : (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                <LogIn className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">Login Required</h4>
                <p className="text-sm text-gray-600 mb-6">Please log in to your account to confirm your booking.</p>
                <button
                  onClick={() => navigate('/login', { state: { from: location } })}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handlePaymentSubmit} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-100 text-center relative rounded-t-3xl border-t-4 border-t-blue-600 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setShowPayment(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Make Payment</h3>
              <p className="text-sm font-medium text-gray-500">Total to pay: <span className="text-blue-600 font-bold text-lg">Rs. {selectedSeats.length * trip.price}</span></p>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {['Card', 'eSewa', 'Khalti', 'Bank'].map(method => (
                   <label 
                     key={method}
                     className={clsx(
                       "flex-1 min-w-[80px] text-center p-3 border-2 rounded-xl cursor-pointer transition-all",
                       paymentMethod === method ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-gray-200 hover:border-blue-200 text-gray-600 font-medium"
                     )}
                   >
                     <input 
                       type="radio" 
                       name="payment" 
                       value={method} 
                       checked={paymentMethod === method} 
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className="hidden"
                     />
                     {method}
                   </label>
                 ))}
               </div>

               {paymentMethod === 'Card' && (
                 <div className="space-y-4">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
                      <div className="absolute -right-16 -top-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
                      
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex gap-2">
                          <div className="w-8 h-5 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded flex items-center justify-center opacity-80" />
                        </div>
                        <div className="flex gap-1">
                           <div className="w-8 h-8 bg-red-500 rounded-full mix-blend-multiply border-2 border-white/20"></div>
                           <div className="w-8 h-8 bg-orange-500 rounded-full mix-blend-multiply border-2 border-white/20 -ml-4"></div>
                        </div>
                      </div>
                      
                      <div className="mb-6 relative z-10">
                         <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Card Number</p>
                         <p className="font-mono text-xl tracking-widest text-gray-100">•••• •••• •••• 4242</p>
                      </div>
                      
                      <div className="flex justify-between relative z-10">
                         <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Card Holder</p>
                            <p className="font-medium tracking-wide uppercase text-sm text-gray-200">{userName || 'GUEST USER'}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Expires</p>
                            <p className="font-medium tracking-wide text-sm text-gray-200">12/28</p>
                         </div>
                      </div>
                   </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Card Number
                      </label>
                      <input type="text" required placeholder="4242 4242 4242 4242" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Card Holder Name
                      </label>
                      <input type="text" required placeholder="John Doe" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                          Expiry Date
                        </label>
                        <input type="text" required placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                          CVV
                        </label>
                        <input type="password" required placeholder="•••" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-[0.5em]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        PIN
                      </label>
                      <input type="password" name="pin" required placeholder="Enter PIN" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-[0.5em]" />
                    </div>
                 </div>
               )}

               {(paymentMethod === 'eSewa' || paymentMethod === 'Khalti') && (
                 <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        {paymentMethod} Mobile Number
                      </label>
                      <input type="tel" required placeholder="98XXXXXXXX" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        PIN
                      </label>
                      <input type="password" name="pin" required placeholder="Enter your Wallet PIN" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-[0.5em]" />
                    </div>
                 </div>
               )}

               {paymentMethod === 'Bank' && (
                 <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Bank Name
                      </label>
                      <input type="text" required placeholder="Nabil Bank" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Account Name
                      </label>
                      <input type="text" required placeholder="John Doe" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Account Number
                      </label>
                      <input type="text" required placeholder="000 000 0000 00" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        PIN
                      </label>
                      <input type="password" name="pin" required placeholder="Enter Transaction PIN" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-[0.5em]" />
                    </div>
                 </div>
               )}
               
               <div className="pt-2">
                 <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Amount
                 </label>
                 <input type="text" required readOnly value={selectedSeats.length * trip.price} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500 font-bold cursor-not-allowed" />
               </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-100 rounded-b-3xl bg-white flex-shrink-0">
              <button
                type="submit"
                disabled={bookingLoading}
                className={clsx(
                  "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 text-lg",
                  bookingLoading && "opacity-70 cursor-wait"
                )}
              >
                {bookingLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Payment...
                  </span>
                ) : (
                  <span>Pay Rs. {selectedSeats.length * trip.price}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
