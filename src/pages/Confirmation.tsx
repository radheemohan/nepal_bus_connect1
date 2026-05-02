import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle, Download, Home, Bus, Calendar, MapPin, User, Ticket, Map } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Confirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then(res => res.json())
      .then(data => {
        setBooking(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [bookingId]);

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor('#2563EB'); // blue-600
      doc.text("Nepal Bus Connect - E-Ticket", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor('#111827'); // gray-900
      doc.text(`Booking ID: ${booking.id}`, 20, 40);
      doc.text(`Passenger: ${booking.user_name}`, 20, 50);
      doc.text(`Route: ${booking.source} to ${booking.destination}`, 20, 60);
      doc.text(`Bus: ${booking.bus_number} (${booking.type})`, 20, 70);
      doc.text(`Date & Time: ${format(new Date(booking.date), 'MMM do, yyyy')} @ ${format(new Date(booking.departure_time), 'hh:mm a')}`, 20, 80);
      doc.text(`Seats: ${booking.seat_numbers.join(', ')}`, 20, 90);
      doc.text(`Total Paid: Rs. ${booking.seat_numbers.length * (booking.price || 0)} (${booking.payment_method})`, 20, 100);
      
      doc.setTextColor(booking.status === 'confirmed' ? '#15803d' : booking.status === 'pending' ? '#ca8a04' : '#b91c1c');
      doc.text(`Status: ${booking.status.toUpperCase()}`, 20, 115);
      
      doc.setFontSize(10);
      doc.setTextColor('#6b7280'); // gray-500
      doc.text("Please show this ticket to the conductor while boarding.", 20, 130);
      
      doc.save(`ticket-${booking.id}.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Failed to generate PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!booking || booking.error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Booking Not Found</h2>
        <button onClick={() => navigate('/')} className="mt-6 text-orange-600 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div id="ticket-element" className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 px-8 py-10 relative">
        {/* Ticket Header */}
        <div className="text-center pb-8 border-b-2 border-dashed border-gray-200">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${booking.status === 'confirmed' ? 'bg-green-100 text-green-500' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-500' : 'bg-red-100 text-red-500'}`}>
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {booking.status === 'confirmed' ? 'Booking Confirmed!' : booking.status === 'pending' ? 'Pending Approval' : 'Booking Cancelled'}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {booking.status === 'confirmed' 
              ? 'Your tickets have been successfully booked and approved.' 
              : booking.status === 'pending'
              ? 'Your payment is received. Waiting for admin approval.'
              : 'This booking has been cancelled.'}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="py-8 grid grid-cols-2 gap-y-6">
           <div className="col-span-2 md:col-span-1">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
             <p className="font-mono text-lg font-bold text-gray-900">{booking.id}</p>
           </div>
           <div className="col-span-2 md:col-span-1 lg:text-right">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Passenger</p>
             <div className="flex items-center lg:justify-end gap-2 text-gray-900 font-bold text-lg">
                <User className="w-4 h-4 text-gray-400" />
                {booking.user_name}
             </div>
           </div>

           <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200 mt-2 flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">From</p>
                 <p className="font-bold text-xl text-gray-900">{booking.source}</p>
                 <p className="text-sm text-gray-500 mt-1">{format(new Date(booking.departure_time), 'hh:mm a')}</p>
              </div>
              <div className="hidden md:flex flex-col justify-center px-4">
                 <ArrowRight className="text-gray-300" />
              </div>
              <div className="text-left md:text-right">
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">To</p>
                 <p className="font-bold text-xl text-gray-900">{booking.destination}</p>
                 <p className="text-sm text-gray-500 mt-1">{format(new Date(booking.arrival_time), 'hh:mm a')}</p>
              </div>
           </div>

           <div className="col-span-2 md:col-span-1 mt-2">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Date</p>
             <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Calendar className="w-4 h-4 text-gray-400" />
                {format(new Date(booking.date), 'EEEE, MMM do, yyyy')}
             </div>
           </div>

           <div className="col-span-2 md:col-span-1 lg:text-right mt-2">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Seats ({booking.seat_numbers.length})</p>
             <div className="flex items-center lg:justify-end gap-2 text-blue-600 font-bold text-lg">
                <Ticket className="w-5 h-5" />
                {booking.seat_numbers.join(', ')}
             </div>
           </div>
           
           <div className="col-span-2 mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
             <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                   {booking.payment_method === 'eSewa' && <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-[8px] italic">e</span>}
                   {booking.payment_method === 'Khalti' && <span className="w-4 h-4 bg-purple-700 rounded-sm flex items-center justify-center text-white text-[8px]">k!</span>}
                   {booking.payment_method === 'Bank Transfer' && <span className="w-4 h-4 text-blue-600 text-sm flex items-center justify-center shadow-none">🏦</span>}
                   {!booking.payment_method && <span className="w-4 h-4 text-gray-600 text-sm flex items-center justify-center shadow-none">💵</span>}
                   <span>{booking.payment_method || 'Cash'}</span>
                   {booking.payment_status === 'completed' ? (
                     <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full uppercase tracking-wider">Paid</span>
                   ) : (
                     <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full uppercase tracking-wider">Pending</span>
                   )}
                </div>
             </div>
             <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="font-black text-2xl text-gray-900">
                  Rs. {booking.seat_numbers.length * (booking.price || 0)}
                </p>
             </div>
           </div>
        </div>
        
        {/* Cutout shapes for ticket aesthetic */}
        <div className="absolute left-[-10px] top-[calc(50%-10px)] w-5 h-5 bg-gray-50 rounded-full"></div>
        <div className="absolute right-[-10px] top-[calc(50%-10px)] w-5 h-5 bg-gray-50 rounded-full"></div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleDownload}
          className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Download className="w-5 h-5" />
          Download Ticket PDF
        </button>
        <a 
          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.source)}&destination=${encodeURIComponent(booking.destination)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Map className="w-5 h-5" />
          View Route Map
        </a>
      </div>
      <div className="mt-4">
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
