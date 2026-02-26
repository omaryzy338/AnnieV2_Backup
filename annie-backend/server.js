const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send("Bienvenido a Annie Backend 🚀");
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
