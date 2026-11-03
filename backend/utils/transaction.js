const mongoose = require('mongoose');
const { DomainError } = require('./domain');
async function transaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } catch (error) {
    if (error.code === 20 || error.codeName === 'IllegalOperation') {
      throw new DomainError(503, 'This operation requires MongoDB configured as a replica set');
    }
    throw error;
  } finally { await session.endSession(); }
}
module.exports = transaction;
