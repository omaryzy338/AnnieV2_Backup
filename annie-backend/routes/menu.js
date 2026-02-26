const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: creación de perfil 🚀" });
});

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: obtener perfil 🚀" });
});
