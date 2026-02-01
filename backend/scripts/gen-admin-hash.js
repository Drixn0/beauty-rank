#!/usr/bin/env node
const bcrypt = require("bcryptjs")

async function main() {
  const pwd = process.argv[2]
  if (!pwd) {
    console.error('Usage: node scripts/gen-admin-hash.js "your_password"')
    process.exit(1)
  }

  const hash = await bcrypt.hash(pwd, 10)
  console.log("ADMIN_PASSWORD_HASH=" + hash)
}

main()
