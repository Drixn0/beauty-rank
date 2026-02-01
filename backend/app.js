require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const rankRoutes = require('./routes/rank')
const adminRoutes = require('./routes/admin')
const { initCron } = require('./services/cronService')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', rankRoutes)
app.use('/api/admin', adminRoutes)

initCron()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('Backend running on port ${PORT}')
})
