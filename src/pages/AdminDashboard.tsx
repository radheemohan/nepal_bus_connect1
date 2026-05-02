import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Shield, Search, Ticket, Calendar, MapPin, User, AlertCircle, TrendingUp, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('admin_auth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }

    fetchBookings();
    fetchAnalytics();
  }, [navigate]);

  const fetchBookings = () => {
    fetch('/api/admin/bookings')
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

  const fetchAnalytics = () => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error(err));
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(`Are you sure you want to cancel this booking?`)) return;

    try {
      console.log("Cancelling booking:", id);
      const res = await fetch(`/api/admin/cancel/${id}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Booking cancelled successfully");
        fetchBookings(); // refresh
        fetchAnalytics(); // refresh analytics
      } else {
        alert(data.error || 'Failed to cancel');
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchBookings(); // refresh
        fetchAnalytics(); // refresh analytics
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
             <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage platform bookings and inventory</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-black text-gray-900 mt-2">Rs. {analytics.totalRevenue}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{analytics.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Trips</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{analytics.activeTrips}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-3xl font-black text-green-600 mt-2">{analytics.successRate}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
           <h2 className="text-lg font-bold text-gray-900">All Bookings</h2>
           <div className="relative w-full sm:w-72">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
             <input 
               type="text" 
               placeholder="Search ID, name, city..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
             />
           </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
             <div className="inline-flex w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-gray-300" />
             </div>
             <h3 className="text-lg font-bold text-gray-900">No bookings found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 rounded-tr-none text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {booking.id}
                      <div className="text-xs font-sans text-gray-400 mt-1 font-normal">
                        {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {booking.user_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {booking.source} &rarr; {booking.destination}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Bus: {booking.bus_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(booking.date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Seats: <span className="font-bold text-gray-900">{booking.seat_numbers.join(', ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                           <AlertCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      ) : booking.status === 'pending' ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Confirmed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {booking.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(booking.id)}
                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <Shield className="w-4 h-4" /> Approve
                          </button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancel(booking.id)}
                            className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
