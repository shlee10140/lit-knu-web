const { getCosmosContainer } = require('../shared/cosmosClient')

module.exports = async function (context, req) {
  let isCosmosConnected = false
  let errorMsg = null
  try {
    const container = await getCosmosContainer()
    isCosmosConnected = !!container
  } catch (e) {
    errorMsg = e.message
  }

  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      status: 'healthy',
      platform: 'Azure Static Web Apps + Azure Functions (Node.js)',
      service: 'LIT × MSA 250 Challenge Cloud API',
      cosmosDbConnected: isCosmosConnected,
      error: errorMsg,
      database: isCosmosConnected ? 'Azure Cosmos DB (litdb / dedicated containers)' : 'In-Memory / Local Cache Mode',
      timestamp: new Date().toISOString(),
    },
  }
}
