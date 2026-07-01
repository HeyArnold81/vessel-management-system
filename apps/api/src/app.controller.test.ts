import { describe, expect, it } from 'vitest';

import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('returns a friendly API landing response', () => {
    const controller = new AppController();

    expect(controller.root()).toEqual({
      status: 'ok',
      service: 'vessel-management-api',
      message: 'HarbourOS API is running.',
      links: {
        health: '/api/health',
        docs: '/api/docs',
      },
    });
  });
});
