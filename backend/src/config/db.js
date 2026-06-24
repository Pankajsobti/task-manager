import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log("DEBUG URI:", process.env.MONGO_URI);

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const conn = await mongoose.connect(uri, {
    // Mongoose 8+ has these on by default; listed here for clarity
    // autoIndex: true,
  });

  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;