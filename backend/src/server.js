import 'dotenv/config';           // must be first — loads .env before anything else
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import connectDB from './config/db.js';
import dns from 'dns';
import { startEmailReminderCron } from './utils/emailReminder.js'; // ADD
import User from './models/User.js';
import Board from './models/Board.js';

dns.setDefaultResultOrder('ipv4first');

const PORT = process.env.PORT || 5000;

// Wrap the express app so both HTTP and Socket.io share the same server
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowed = [
        process.env.CLIENT_URL,
        /\.vercel\.app$/,
      ];
      if (!origin || allowed.some((p) => (typeof p === 'string' ? p === origin : p.test(origin)))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Make io reachable from controllers via req.app.get('io')
app.set('io', io);

// ─── Socket auth (reuses same JWT_SECRET + User lookup as verifyToken) ───
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email role');

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch {
    next(new Error('Authentication error: invalid or expired token'));
  }
});

// ─── Socket connection handling ───────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-board', async (boardId) => {
    try {
      const board = await Board.findById(boardId);
      if (!board) {
        return socket.emit('error', { message: 'Board not found' });
      }

      const isMember =
        board.owner.toString() === socket.user.id ||
        board.members.some((m) => m.toString() === socket.user.id);

      if (!isMember) {
        return socket.emit('error', { message: 'Access denied to this board' });
      }

      socket.join(boardId);
    } catch {
      socket.emit('error', { message: 'Failed to join board' });
    }
  });

  socket.on('leave-board', (boardId) => {
    socket.leave(boardId);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      startEmailReminderCron(); // ADD
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  process.exit(1);
});

startServer();