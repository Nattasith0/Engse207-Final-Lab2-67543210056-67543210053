const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});