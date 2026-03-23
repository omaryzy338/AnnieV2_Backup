const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.DB_URI;
    const isAtlas = uri && uri.includes('mongodb+srv');
    console.log(`🔌 Conectando a: ${isAtlas ? '☁️  Atlas (cloud)' : '💻 MongoDB local'}`);
    await mongoose.connect(uri);
    console.log("✅ MongoDB conectado correctamente");
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
