import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load valid config with required fields', () => {
    const config = loadConfig({ targetUrl: 'http://localhost:4000' });
    expect(config.targetUrl).toBe('http://localhost:4000');
    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe('info');
    expect(config.requestHistoryLimit).toBe(100);
  });

  it('should read TARGET_URL from environment', () => {
    process.env.TARGET_URL = 'http://localhost:8080';
    const config = loadConfig();
    expect(config.targetUrl).toBe('http://localhost:8080');
  });

  it('should read PORT from environment', () => {
    process.env.TARGET_URL = 'http://localhost:4000';
    process.env.PORT = '5000';
    const config = loadConfig();
    expect(config.port).toBe(5000);
  });

  it('should allow overrides to take precedence over env vars', () => {
    process.env.PORT = '5000';
    const config = loadConfig({ targetUrl: 'http://localhost:4000', port: 9000 });
    expect(config.port).toBe(9000);
  });

  it('should throw when targetUrl is missing', () => {
    delete process.env.TARGET_URL;
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });

  it('should throw when targetUrl is not a valid URL', () => {
    expect(() => loadConfig({ targetUrl: 'not-a-url' })).toThrow('Invalid configuration');
  });

  it('should throw when port is out of range', () => {
    expect(() => loadConfig({ targetUrl: 'http://localhost:4000', port: 99999 })).toThrow(
      'Invalid configuration'
    );
  });

  it('should accept optional hookdeckSourceUrl', () => {
    const config = loadConfig({
      targetUrl: 'http://localhost:4000',
      hookdeckSourceUrl: 'https://events.hookdeck.com/e/src_abc123',
    });
    expect(config.hookdeckSourceUrl).toBe('https://events.hookdeck.com/e/src_abc123');
  });
});
