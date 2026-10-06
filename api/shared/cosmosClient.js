// Shared Azure Cosmos DB Client for LIT MSA Challenge
// Optimized for Azure for Students (Free Tier: 1,000 RU/s & 25 GB)
const { CosmosClient } = require('@azure/cosmos')

let cosmosClient = null
let database = null
const containerCache = {}

const inMemoryStore = {
  members: [],
  articles: [],
  missions: [],
  faqs: [],
  verifications: [],
  milestones: [],
  lastSyncedAt: new Date().toISOString(),
}

async function getCosmosDatabase() {
  const endpoint =
    process.env.COSMOS_ENDPOINT || process.env.AZURE_COSMOS_DB_ENDPOINT || process.env.COSMOS_DB_ENDPOINT
  const key =
    process.env.COSMOS_KEY || process.env.AZURE_COSMOS_DB_KEY || process.env.COSMOS_DB_KEY
  const databaseName =
    process.env.COSMOS_DATABASE || process.env.AZURE_COSMOS_DB_DATABASE || 'litdb'

  if (!endpoint || !key) {
    return null
  }

  if (database) return database

  try {
    cosmosClient = new CosmosClient({ endpoint, key })
    const { database: db } = await cosmosClient.databases.createIfNotExists({ id: databaseName })
    database = db
    return database
  } catch (err) {
    console.warn('[Azure Cosmos DB] Database connection warning:', err.message)
    return null
  }
}

async function getCosmosContainer(containerName = 'members', partitionKey = '/handle') {
  if (containerCache[containerName]) {
    return containerCache[containerName]
  }

  const db = await getCosmosDatabase()
  if (!db) return null

  try {
    const { container: c } = await db.containers.createIfNotExists({
      id: containerName,
      partitionKey: { paths: [partitionKey] },
    })
    containerCache[containerName] = c
    return c
  } catch (err) {
    console.warn(`[Azure Cosmos DB] Container ${containerName} warning, using fallback:`, err.message)
    return null
  }
}

function getInMemoryStore() {
  return inMemoryStore
}

module.exports = {
  getCosmosDatabase,
  getCosmosContainer,
  getInMemoryStore,
}
