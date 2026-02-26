const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const menuRoutes = require('./routes/menu');

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/menu', menuRoutes);
