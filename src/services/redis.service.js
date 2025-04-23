const { Redis } = require('@upstash/redis');
const config = require('../config');

class RedisService {
  constructor() {
    this.redis = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });
  }

  // Challenge management with TTL
  async storeChallenge(challenge, data, ttlSeconds = 150) { // 2.5 minutes default TTL
    const key = `challenge:${challenge}`;
    await this.redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  }

  async getChallenge(challenge) {
    const key = `challenge:${challenge}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    
    try {
      // Handle both string and object data
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Error parsing challenge data:', error);
      return null;
    }
  }

  async deleteChallenge(challenge) {
    const key = `challenge:${challenge}`;
    await this.redis.del(key);
  }

  // Credential management
  async storeCredential(credentialId, credentialData) {
    const key = `credential:${credentialId}`;
    await this.redis.set(key, JSON.stringify(credentialData));
  }

  async getCredential(credentialId) {
    const key = `credential:${credentialId}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    
    try {
      // Handle both string and object data
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Error parsing credential data:', error);
      return null;
    }
  }

  async updateCredentialCounter(credentialId, newCounter) {
    const key = `credential:${credentialId}`;
    const credential = await this.getCredential(credentialId);
    if (credential) {
      credential.counter = newCounter;
      await this.redis.set(key, JSON.stringify(credential));
    }
  }

  async setInitialCertificate(certificateData) {
    const key = 'initial_certificate';
    await this.redis.set(key, JSON.stringify(certificateData));
    // Set expiration to match certificate expiration
    const ttl = Math.floor((certificateData.expiresAt - Date.now()) / 1000);
    await this.redis.expire(key, ttl);
  }

  async getInitialCertificate() {
    const key = 'initial_certificate';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}

module.exports = new RedisService(); 