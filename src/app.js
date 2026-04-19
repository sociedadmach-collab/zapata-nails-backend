const bookingRoutes = require('./routes/bookingRoutes');
const checkClientRoutes = require('./routes/checkClientRoutes');
const express = require('express');
const clientIdentificationRoutes = require('./routes/clientIdentificationRoutes');
const registerClientRoutes = require('./routes/registerClientRoutes');
const registerClientFromTextRoutes = require('./routes/registerClientFromTextRoutes');
const saveAppointmentRoutes = require('./routes/saveAppointmentRoutes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'zapata-nails-whatsapp-backend'
  });
});

app.use('/api', clientIdentificationRoutes);
app.use('/api', bookingRoutes);
app.use('/api', checkClientRoutes);
app.use('/api', registerClientRoutes);
app.use('/api', registerClientFromTextRoutes);
app.use('/api', saveAppointmentRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.statusCode || 500).json({
    ok: false,
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
