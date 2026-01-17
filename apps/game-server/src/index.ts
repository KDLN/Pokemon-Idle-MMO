import 'dotenv/config'
import { initDatabase } from './db.js'
import { GameHub } from './hub.js'

async function main() {
  console.log('Starting Pokemon Idle Game Server...')

  // Initialize database
  try {
    initDatabase()
    console.log('Database initialized')
  } catch (err) {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  }

  // Start game server
  const port = parseInt(process.env.PORT || '8080', 10)
  const hub = new GameHub(port)
  await hub.start()

  console.log(`Game server running on port ${port}`)

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...')
    hub.stop()
    process.exit(0)
  })
}

main()
