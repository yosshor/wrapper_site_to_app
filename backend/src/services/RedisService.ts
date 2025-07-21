/**
 * @fileoverview Redis Service for caching and session management
 * @author YosShor
 * @version 1.0.0
 * 
 * Handles Redis connection and provides methods for caching, session storage,
 * and rate limiting operations.
 */

import { createClient, RedisClientType } from 'redis';

/**
 * Redis Service Class
 * 
 * Manages Redis connection and provides caching, session, and rate limiting functionality.
 * Handles connection lifecycle and provides convenient methods for common Redis operations.
 */
export class RedisService {
  private static client: RedisClientType | null = null;
  private static connected: boolean = false;
  private static isConnecting: boolean = false;

  /**
   * Connect to Redis server
   * 
   * Establishes connection to Redis using configuration from environment variables.
   * This method is idempotent - multiple calls are safe.
   * 
   * @returns Promise<void>
   * @throws Error if connection fails in production
   * 
   * @example
   * await RedisService.connect();
   */
  public static async connect(): Promise<void> {
    try {
      // Skip if already connected
      if (this.connected && this.client) {
        return;
      }

      // Prevent multiple concurrent connection attempts
      if (this.isConnecting) {
        return;
      }

      this.isConnecting = true;

      // Get Redis configuration from environment
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // Check if Redis should be enabled
      if (process.env.REDIS_ENABLED === 'false') {
        console.log('⚠️ Redis disabled by configuration - caching features will be unavailable');
        this.isConnecting = false;
        return;
      }

      // Create Redis client
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            console.log(`🔄 Redis reconnection attempt ${retries}`);
            if (retries >= 10) {
              console.error('❌ Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 50, 1000); // Exponential backoff, max 1 second
          },
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();
      
      this.connected = true;
      this.isConnecting = false;
      console.log('✅ Redis connection established');

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to Redis:', error);
      
      // In development, we can continue without Redis
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Continuing without Redis in development mode - caching will be disabled');
        return;
      }
      
      // In production, Redis failure might be critical depending on use case
      // Allow the app to continue but log the error
      console.warn('⚠️ Redis connection failed - caching features will be unavailable');
    }
  }

  /**
   * Set up Redis event listeners
   * 
   * @private
   */
  private static setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('🔌 Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready');
      this.connected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis client error:', error);
      this.connected = false;
    });

    this.client.on('end', () => {
      console.log('📴 Redis client disconnected');
      this.connected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting');
      this.connected = false;
    });
  }

  /**
   * Get Redis client instance
   * 
   * @returns RedisClientType instance or null if not connected
   * 
   * @example
   * const client = RedisService.getClient();
   * if (client) {
   *   await client.set('key', 'value');
   * }
   */
  public static getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected and available
   * 
   * @returns boolean indicating if Redis is ready to use
   */
  public static isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Set a key-value pair with optional expiration
   * 
   * @param key - The key to set
   * @param value - The value to store (will be JSON stringified if object)
   * @param ttlSeconds - Time to live in seconds (optional)
   * @returns Promise<boolean> success status
   * 
   * @example
   * await RedisService.set('user:123', { name: 'John' }, 3600);
   * await RedisService.set('session:abc', 'active');
   */
  public static async set(
    key: string,
    value: string | number | object,
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - skipping cache set');
      return false;
    }

    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value by key
   * 
   * @param key - The key to retrieve
   * @param parseJson - Whether to parse the value as JSON (default: true)
   * @returns Promise<any> the stored value or null if not found
   * 
   * @example
   * const user = await RedisService.get('user:123');
   * const rawValue = await RedisService.get('session:abc', false);
   */
  public static async get(key: string, parseJson: boolean = true): Promise<any> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - cache miss');
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      if (!parseJson) {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch {
        // If parsing fails, return the raw value
        return value;
      }
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key
   * 
   * @param key - The key to delete
   * @returns Promise<boolean> success status
   * 
   * @example
   * await RedisService.delete('user:123');
   */
  public static async delete(key: string): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - skipping cache delete');
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`❌ Redis DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   * 
   * @param key - The key to check
   * @returns Promise<boolean> whether the key exists
   * 
   * @example
   * const exists = await RedisService.exists('user:123');
   */
  public static async exists(key: string): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   * 
   * @param key - The key to set expiration for
   * @param ttlSeconds - Time to live in seconds
   * @returns Promise<boolean> success status
   * 
   * @example
   * await RedisService.expire('user:123', 3600);
   */
  public static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - skipping expire');
      return false;
    }

    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   * 
   * @param key - The key to increment
   * @param increment - Amount to increment by (default: 1)
   * @returns Promise<number | null> new value or null if error
   * 
   * @example
   * const newCount = await RedisService.increment('api:requests:count');
   * const newCount = await RedisService.increment('user:score', 10);
   */
  public static async increment(key: string, increment: number = 1): Promise<number | null> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - skipping increment');
      return null;
    }

    try {
      const result = await this.client.incrBy(key, increment);
      return result;
    } catch (error) {
      console.error(`❌ Redis INCREMENT error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple keys at once
   * 
   * @param keys - Array of keys to retrieve
   * @param parseJson - Whether to parse values as JSON (default: true)
   * @returns Promise<Record<string, any>> object with key-value pairs
   * 
   * @example
   * const values = await RedisService.mget(['user:123', 'user:456']);
   */
  public static async mget(keys: string[], parseJson: boolean = true): Promise<Record<string, any>> {
    if (!this.isConnected() || !this.client || keys.length === 0) {
      return {};
    }

    try {
      const values = await this.client.mGet(keys);
      const result: Record<string, any> = {};

      keys.forEach((key, index) => {
        const value = values[index];
        if (value !== null) {
          if (parseJson) {
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          } else {
            result[key] = value;
          }
        }
      });

      return result;
    } catch (error) {
      console.error('❌ Redis MGET error:', error);
      return {};
    }
  }

  /**
   * Flush all Redis data (use with caution!)
   * 
   * @returns Promise<boolean> success status
   * 
   * @example
   * await RedisService.flush(); // Only in development/testing
   */
  public static async flush(): Promise<boolean> {
    if (!this.isConnected() || !this.client) {
      console.warn('⚠️ Redis not available - skipping flush');
      return false;
    }

    // Safety check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Redis FLUSH is not allowed in production');
      return false;
    }

    try {
      await this.client.flushAll();
      console.log('⚠️ Redis database flushed');
      return true;
    } catch (error) {
      console.error('❌ Redis FLUSH error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   * 
   * @returns Promise<void>
   * 
   * @example
   * await RedisService.disconnect();
   */
  public static async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.connected = false;
        this.client = null;
        console.log('✅ Redis connection closed');
      } catch (error) {
        console.error('❌ Error closing Redis connection:', error);
      }
    }
  }
} 
