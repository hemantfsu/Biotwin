const { createClient } = require('redis');

let redisClient = null;

/**
 * Initialise and return the Redis client.
 * If REDIS_URL is not set the app still works — caching is just skipped.
 */
const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  REDIS_URL not set — caching disabled.');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️  Redis max retries reached — caching disabled.');
            return false; // stop retrying
          }
          return Math.min(retries * 200, 2000);
        },
      },
    });

    redisClient.on('error', () => {}); // suppress noisy errors
    redisClient.on('connect', () => console.log('✅ Redis connected'));

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('⚠️  Redis unavailable — caching disabled.');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
