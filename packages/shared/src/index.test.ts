import { describe, expect, it } from 'vitest';

import { dashboardMetrics, getStatusLabel, navigationItems } from './index';

describe('shared product contracts', () => {
  it('defines navigation with stable permission codes', () => {
    expect(navigationItems.map((item) => item.permission)).toContain('movement.read');
    expect(navigationItems.every((item) => item.href.startsWith('/'))).toBe(true);
  });

  it('maps operational statuses to readable labels', () => {
    expect(getStatusLabel('attention')).toBe('Needs attention');
    expect(dashboardMetrics).toHaveLength(4);
  });
});
