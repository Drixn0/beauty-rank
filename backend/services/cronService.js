const cron = require('node-cron')
function initCron() {
  cron.schedule('0 12 * * *', () => {
    console.log('Daily rank refresh')
  })
}
module.exports = { initCron }
