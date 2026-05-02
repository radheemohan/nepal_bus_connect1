import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: '*' }
});

app.use(express.json());

// Initialize SQLite database
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS buses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_number TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_id INTEGER,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(bus_id) REFERENCES buses(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    trip_id INTEGER,
    seat_numbers TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    refund_status TEXT,
    cancelled_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(trip_id) REFERENCES trips(id)
  );

  CREATE TABLE IF NOT EXISTS route_configs (
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    max_buses INTEGER DEFAULT 5,
    PRIMARY KEY (source, destination)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// The 77 Districts of Nepal
const districts = [
  "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu",
  "Sunsari", "Taplejung", "Tehrathum", "Udayapur", "Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari",
  "Sarlahi", "Siraha", "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur",
  "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok", "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang",
  "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun", "Arghakhanchi", "Banke", "Bardiya", "Dang", "Eastern Rukum",
  "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rupandehi", "Dailekh", "Dolpa", "Humla", "Jajarkot",
  "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Western Rukum", "Achham", "Baitadi", "Bajhang", "Bajura",
  "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur", "Pokhara" // Adding popular cities too
];

const provinceMap: Record<string, string> = {
  "Kathmandu": "Bagmati", "Lalitpur": "Bagmati", "Bhaktapur": "Bagmati", "Kavrepalanchok": "Bagmati", "Chitwan": "Bagmati", "Makwanpur": "Bagmati", "Dhading": "Bagmati", "Nuwakot": "Bagmati", "Sindhupalchok": "Bagmati", "Dolakha": "Bagmati", "Ramechhap": "Bagmati", "Sindhuli": "Bagmati", "Rasuwa": "Bagmati",
  "Pokhara": "Gandaki", "Kaski": "Gandaki", "Gorkha": "Gandaki", "Tanahun": "Gandaki", "Syangja": "Gandaki", "Lamjung": "Gandaki", "Nawalpur": "Gandaki", "Baglung": "Gandaki", "Myagdi": "Gandaki", "Parbat": "Gandaki", "Manang": "Gandaki", "Mustang": "Gandaki",
  "Rupandehi": "Lumbini", "Dang": "Lumbini", "Banke": "Lumbini", "Kapilvastu": "Lumbini", "Bardiya": "Lumbini", "Palpa": "Lumbini", "Gulmi": "Lumbini", "Arghakhanchi": "Lumbini", "Pyuthan": "Lumbini", "Rolpa": "Lumbini", "Eastern Rukum": "Lumbini", "Parasi": "Lumbini",
  "Jhapa": "Koshi", "Morang": "Koshi", "Sunsari": "Koshi", "Ilam": "Koshi", "Dhankuta": "Koshi", "Bhojpur": "Koshi", "Panchthar": "Koshi", "Taplejung": "Koshi", "Sankhuwasabha": "Koshi", "Tehrathum": "Koshi", "Okhaldhunga": "Koshi", "Khotang": "Koshi", "Udayapur": "Koshi", "Solukhumbu": "Koshi",
  "Parsa": "Madhesh", "Dhanusha": "Madhesh", "Bara": "Madhesh", "Rautahat": "Madhesh", "Sarlahi": "Madhesh", "Mahottari": "Madhesh", "Siraha": "Madhesh", "Saptari": "Madhesh",
  "Surkhet": "Karnali", "Dailekh": "Karnali", "Jajarkot": "Karnali", "Salyan": "Karnali", "Western Rukum": "Karnali", "Kalikot": "Karnali", "Jumla": "Karnali", "Mugu": "Karnali", "Humla": "Karnali", "Dolpa": "Karnali",
  "Kailali": "Sudurpashchim", "Kanchanpur": "Sudurpashchim", "Dadeldhura": "Sudurpashchim", "Doti": "Sudurpashchim", "Achham": "Sudurpashchim", "Baitadi": "Sudurpashchim", "Bajhang": "Sudurpashchim", "Bajura": "Sudurpashchim", "Darchula": "Sudurpashchim"
};

const getPlatePrefix = (district: string) => {
  const prov = provinceMap[district];
  if (prov === "Bagmati") return "Bagmati Prov. 03-001 Kha";
  if (prov === "Gandaki") return "Ga. 1 Kha";
  if (prov === "Lumbini") return "Lu. 2 Kha";
  if (prov === "Koshi") return "Ko. 1 Kha";
  if (prov === "Madhesh") return "Ma. 1 Kha";
  if (prov === "Karnali") return "Ka. 1 Kha";
  if (prov === "Sudurpashchim") return "Su. 1 Kha";
  return "Ba. 4 Kha"; // generic fallback
};

// Seed buses
const insertBus = db.prepare('INSERT INTO buses (bus_number, total_seats, type) VALUES (?, ?, ?)');
insertBus.run('Ba. 4 Kha. 1200', 36, 'AC Deluxe');
insertBus.run('Lu. 2 Kha. 4501', 36, 'AC Deluxe');
insertBus.run('Na. 6 Kha. 8899', 36, 'Standard');
insertBus.run('Bagmati Province 01-006 Kha 1111', 36, 'Tourist Bus');
insertBus.run('Bhe. 1 Kha. 2233', 36, 'Sleeper');
insertBus.run('Me. 1 Kha. 9900', 36, 'Hiace');

const insertTrip = db.prepare('INSERT INTO trips (bus_id, source, destination, departure_time, arrival_time, price, date) VALUES (?, ?, ?, ?, ?, ?, ?)');

// Live Seat Lock Tracking
// tripId -> Map<seatId, { socketId, expiresAt, userName }>
const seatLocks = new Map<number, Map<string, { socketId: string, expiresAt: number, userName: string }>>();

io.on('connection', (socket) => {
  socket.on('joinTrip', (tripId) => {
    socket.join(`trip-${tripId}`);
    const tripLocks = seatLocks.get(Number(tripId));
    if (tripLocks) {
      const locksMap: Record<string, string> = {};
      for (const [seatId, lockInfo] of tripLocks.entries()) {
        locksMap[seatId] = lockInfo.userName;
      }
      socket.emit('currentLocks', locksMap);
    }
  });

  socket.on('lockSeat', ({ tripId, seatId, userName }) => {
    tripId = Number(tripId);
    if (!seatLocks.has(tripId)) seatLocks.set(tripId, new Map());
    const tripLocks = seatLocks.get(tripId)!;
    
    if (tripLocks.has(seatId) && tripLocks.get(seatId)?.socketId !== socket.id) {
      socket.emit('seatLockError', { seatId, message: 'Seat is currently locked by someone else' });
      return;
    }
    
    // Lock for 5 mins
    tripLocks.set(seatId, { socketId: socket.id, expiresAt: Date.now() + 5 * 60 * 1000, userName });
    io.to(`trip-${tripId}`).emit('seatLocked', { seatId, userName });
    
    setTimeout(() => {
      const tLocks = seatLocks.get(tripId);
      if (tLocks && tLocks.get(seatId)?.socketId === socket.id) {
        tLocks.delete(seatId);
        io.to(`trip-${tripId}`).emit('seatUnlocked', { seatId });
      }
    }, 5 * 60 * 1000);
  });

  socket.on('unlockSeat', ({ tripId, seatId }) => {
    tripId = Number(tripId);
    const tripLocks = seatLocks.get(tripId);
    if (tripLocks && tripLocks.get(seatId)?.socketId === socket.id) {
      tripLocks.delete(seatId);
      io.to(`trip-${tripId}`).emit('seatUnlocked', { seatId });
    }
  });

  socket.on('disconnect', () => {
    seatLocks.forEach((tripLocks, tripId) => {
      for (const [seatId, lock] of tripLocks.entries()) {
        if (lock.socketId === socket.id) {
          tripLocks.delete(seatId);
          io.to(`trip-${tripId}`).emit('seatUnlocked', { seatId });
        }
      }
    });
  });
});

// API Routes
app.get('/api/trips', (req, res) => {
  const { source, destination, date } = req.query;
  let query = `
    SELECT trips.id, trips.departure_time, trips.arrival_time, trips.price, trips.date, trips.source, trips.destination,
           buses.bus_number, buses.type, buses.total_seats
    FROM trips
    JOIN buses ON trips.bus_id = buses.id
    WHERE trips.source = ? AND trips.destination = ? AND trips.date = ?
  `;
  
  if (!source || !destination || !date) {
    return res.json([]);
  }

  let trips = db.prepare(query).all(source, destination, date) as any[];
  
  // Lazy generation: if no trips exist for this search, guarantee buses by creating them on the fly
  if (trips.length === 0) {
    const configQuery = db.prepare('SELECT max_buses FROM route_configs WHERE source = ? AND destination = ?').get(source, destination) as any;
    const maxBuses = configQuery ? configQuery.max_buses : 5; // default 5 buses per route if no config
    
    // Create random trips based on maxBuses limit
    const numTripsToGenerate = Math.max(1, Math.floor(Math.random() * maxBuses));
    for (let i = 0; i < numTripsToGenerate; i++) {
        const types = ['AC Deluxe', 'Tourist Bus', 'Sleeper', 'Standard'];
        const type = types[Math.floor(Math.random() * types.length)];
        const platePrefix = getPlatePrefix(source as string);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const busNumber = `${platePrefix} ${randomNum}`;
        const totalSeats = type === 'Sleeper' ? 30 : 36;
        
        // Insert new bus
        const bResult = insertBus.run(busNumber, totalSeats, type);
        const bId = bResult.lastInsertRowid;

        const prices = [800, 1200, 1500, 2000, 2500];
        const p = prices[Math.floor(Math.random() * prices.length)];
        const h = 6 + Math.floor(Math.random() * 14); // 6 AM to 8 PM
        const depTime = `${date}T${h.toString().padStart(2, '0')}:00:00`;
        const arrH = (h + 5) % 24;
        let arrDate = date as string;
        if ((h + 5) >= 24) {
          const nextDay = new Date(`${date}T00:00:00`);
          nextDay.setDate(nextDay.getDate() + 1);
          arrDate = nextDay.toISOString().split('T')[0];
        }
        const arrTime = `${arrDate}T${arrH.toString().padStart(2, '0')}:00:00`;
        
        insertTrip.run(bId, source, destination, depTime, arrTime, p, date);
    }
    // Re-fetch
    trips = db.prepare(query).all(source, destination, date) as any[];
  }
  
  // Attach available seats computation
  const finalTrips = trips.map((trip: any) => {
    const bookings = db.prepare("SELECT seat_numbers FROM bookings WHERE trip_id = ? AND status IN ('confirmed', 'pending')").all(trip.id) as any[];
    let bookedSeats = 0;
    bookings.forEach(b => {
      const seats = JSON.parse(b.seat_numbers);
      bookedSeats += seats.length;
    });
    return {
      ...trip,
      available_seats: trip.total_seats - bookedSeats
    };
  });
  
  res.json(finalTrips);
});

app.get('/api/trips/:id', (req, res) => {
  const tripId = req.params.id;
  const trip = db.prepare(`
    SELECT trips.id, trips.departure_time, trips.arrival_time, trips.price, trips.date, trips.source, trips.destination,
           buses.bus_number, buses.type, buses.total_seats
    FROM trips
    JOIN buses ON trips.bus_id = buses.id
    WHERE trips.id = ?
  `).get(tripId) as any;

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const bookings = db.prepare("SELECT seat_numbers FROM bookings WHERE trip_id = ? AND status IN ('confirmed', 'pending')").all(tripId) as any[];
  let bookedSeats: string[] = [];
  bookings.forEach(b => {
    const seats = JSON.parse(b.seat_numbers);
    bookedSeats = bookedSeats.concat(seats);
  });

  res.json({ trip, bookedSeats });
});

app.get('/api/locations', (req, res) => {
  // Sort alphabetically
  res.json([...districts].sort());
});

app.post('/api/bookings', (req, res) => {
  const { trip_id, user_name, seat_numbers, payment_method } = req.body;
  if (!trip_id || !user_name || !seat_numbers || !Array.isArray(seat_numbers)) {
    return res.status(400).json({ error: 'Invalid booking data' });
  }

  // Generate random booking ID like BN-123456
  const bookingId = 'BN-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

  const insert = db.prepare('INSERT INTO bookings (id, user_name, trip_id, seat_numbers, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  try {
    insert.run(bookingId, user_name, trip_id, JSON.stringify(seat_numbers), payment_method || 'Cash', 'paid', 'pending');
    
    // Release locks as they are now booked
    const tripLocks = seatLocks.get(Number(trip_id));
    if (tripLocks) {
      for (const seat of seat_numbers) {
        tripLocks.delete(seat);
      }
    }
    // Broadcast newly booked seats (still locked from selection view until approved/denied to avoid double booking)
    io.to(`trip-${trip_id}`).emit('seatsBooked', { seats: seat_numbers });

    res.json({
      success: true,
      booking_id: bookingId
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/bookings', (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: "User is required" });
  try {
    const userBookings = db.prepare(`
      SELECT bookings.*, trips.departure_time, trips.date, trips.source, trips.destination, trips.price
      FROM bookings
      JOIN trips ON bookings.trip_id = trips.id
      WHERE bookings.user_name = ?
      ORDER BY bookings.created_at DESC
    `).all(user);
    res.json(userBookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = db.prepare(`
    SELECT bookings.*, trips.departure_time, trips.arrival_time, trips.date, trips.source, trips.destination, trips.price,
           buses.bus_number, buses.type
    FROM bookings 
    JOIN trips ON bookings.trip_id = trips.id
    JOIN buses ON trips.bus_id = buses.id
    WHERE bookings.id = ?
  `).get(req.params.id) as any;

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({
    ...booking,
    seat_numbers: JSON.parse(booking.seat_numbers)
  });
});

// Admin Panel APIs
app.get('/api/admin/bookings', (req, res) => {
  // Get all bookings
  const bookings = db.prepare(`
    SELECT bookings.*, trips.departure_time, trips.date, trips.source, trips.destination,
           buses.bus_number
    FROM bookings 
    JOIN trips ON bookings.trip_id = trips.id
    JOIN buses ON trips.bus_id = buses.id
    ORDER BY bookings.created_at DESC
  `).all() as any[];
  
  res.json(bookings.map(b => ({...b, seat_numbers: JSON.parse(b.seat_numbers)})));
});

// Single unified cancel handler used by both routes
function handleCancelBooking(bookingId: string, res: any) {
  try {
    const booking = db.prepare(
      'SELECT trip_id, seat_numbers, status, payment_status FROM bookings WHERE id = ?'
    ).get(bookingId) as any;

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status === 'cancelled') return res.status(400).json({ error: "Already cancelled" });

    const cancelledAt = new Date().toISOString();
    const seatNumbers: string[] = JSON.parse(booking.seat_numbers);

    // Update DB: mark cancelled, update payment_status, record timestamp
    db.prepare(`
      UPDATE bookings
      SET status = 'cancelled',
          refund_status = ?,
          payment_status = ?,
          cancelled_at = ?
      WHERE id = ?
    `).run(
      booking.payment_status === 'paid' ? 'processing' : 'not_required',
      booking.payment_status === 'paid' ? 'refund_pending' : booking.payment_status,
      cancelledAt,
      bookingId
    );

    // Free seats from the in-memory lock map so others can book immediately
    const tripLocks = seatLocks.get(Number(booking.trip_id));
    if (tripLocks) {
      for (const seat of seatNumbers) {
        tripLocks.delete(seat);
      }
    }

    // Notify all clients watching this trip that these seats are now free
    io.to(`trip-${booking.trip_id}`).emit('seatsUnbooked', { seats: seatNumbers });
    // Also emit individual seatUnlocked events so the seat map updates correctly
    for (const seat of seatNumbers) {
      io.to(`trip-${booking.trip_id}`).emit('seatUnlocked', { seatId: seat });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking_id: bookingId,
      refund_status: booking.payment_status === 'paid' ? 'processing' : 'not_required',
      cancelled_at: cancelledAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Both routes point to the same handler (kept for frontend compatibility)
app.put('/api/admin/cancel/:id', (req, res) => handleCancelBooking(req.params.id, res));
app.put('/api/admin/bookings/:id/cancel', (req, res) => handleCancelBooking(req.params.id, res));

app.post('/api/admin/bookings/:id/approve', (req, res) => {
  const bookingId = req.params.id;
  try {
    const booking = db.prepare('SELECT trip_id, seat_numbers, status FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status === 'confirmed') return res.status(400).json({ error: "Already confirmed" });

    db.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").run(bookingId);
    
    res.json({ success: true, message: 'Booking approved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Analytics
app.get('/api/admin/analytics', (req, res) => {
  try {
    const totalBookings = (db.prepare("SELECT COUNT(*) as count FROM bookings").get() as any).count;
    const activeTrips = (db.prepare("SELECT COUNT(*) as count FROM trips").get() as any).count;
    
    const bookingsData = db.prepare(`
       SELECT bookings.seat_numbers, trips.price, bookings.status
       FROM bookings
       JOIN trips ON bookings.trip_id = trips.id
    `).all() as any[];

    let totalRevenue = 0;
    let cancelledBookings = 0;

    bookingsData.forEach(b => {
      const seats = JSON.parse(b.seat_numbers).length;
      if (b.status === 'confirmed') {
        totalRevenue += seats * (b.price || 0);
      } else if (b.status === 'cancelled') {
        cancelledBookings++;
      }
    });

    res.json({
      totalRevenue,
      totalBookings,
      activeTrips,
      cancelledBookings,
      successRate: totalBookings > 0 ? (((totalBookings - cancelledBookings) / totalBookings) * 100).toFixed(1) : 0
    });
  } catch(error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/route_configs', (req, res) => {
  res.json(db.prepare("SELECT * FROM route_configs").all());
});

app.post('/api/admin/route_configs', (req, res) => {
  const { source, destination, max_buses } = req.body;
  try {
     db.prepare("INSERT OR REPLACE INTO route_configs (source, destination, max_buses) VALUES (?, ?, ?)").run(source, destination, max_buses);
     res.json({ success: true });
  } catch(e: any) {
     res.status(500).json({ error: e.message });
  }
});

// Reviews API (table existed but endpoints were missing)
app.post('/api/reviews', (req, res) => {
  const { booking_id, rating, comment } = req.body;
  if (!booking_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'booking_id and a rating between 1-5 are required' });
  }
  const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  try {
    const result = db.prepare('INSERT INTO reviews (booking_id, rating, comment) VALUES (?, ?, ?)').run(booking_id, rating, comment || null);
    res.json({ success: true, review_id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    res.json(reviews);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();