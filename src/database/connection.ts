import mongoose from 'mongoose'
import { config } from '../config/env'
import { logger } from '../logger'

class ConnectDatabase {
  async execute(): Promise<void> {
    mongoose.connection.on('connected', () => logger.info('MongoDB connected'))
    mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'))
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

    await mongoose.connect(config.databaseUrl, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
  }
}

export const connectDatabase = new ConnectDatabase()
