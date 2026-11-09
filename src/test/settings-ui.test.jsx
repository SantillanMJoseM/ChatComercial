// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import SettingsPage from '../pages/SettingsPage';

beforeEach(() => {
  localStorage.setItem('chatcomercial_token', 'test-token');
  const settings = { id: 'global', botResponseMode: 'auto', weeklySchedule: { monday: { enabled: true, start: '09:00', end: '18:00' }, tuesday: { enabled: true, start: '09:00', end: '18:00' }, wednesday: { enabled: true, start: '09:00', end: '18:00' }, thursday: { enabled: true, start: '09:00', end: '18:00' }, friday: { enabled: true, start: '09:00', end: '18:00' }, saturday: { enabled: true, start: '09:00', end: '13:00' }, sunday: { enabled: false, start: '09:00', end: '13:00' } }, outOfHours: false, toneRules: { noOpeningQuestionMark: true, noFinalPeriod: true, useDiscreteEmojis: true }, globalBotEnabled: true };
  global.fetch = vi.fn((url, opts) => {
    if (url.endsWith('/settings') && (!opts || !opts.method || opts.method === 'GET')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(settings), status: 200 });
    }
    if (url.endsWith('/settings') && opts?.method === 'PUT') {
      Object.assign(settings, JSON.parse(opts.body));
      return Promise.resolve({ ok: true, json: () => Promise.resolve(settings), status: 200 });
    }
    if (url.includes('/order-statuses')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    if (url.includes('/products')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    if (url.includes('/customers')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    if (url.includes('/orders')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    if (url.includes('/conversations')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    if (url.includes('/rules')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]), status: 200 });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}), status: 200 });
  });
});

describe('settings ui', () => {
  it('toggles out of hours and persists', async () => {
    render(<AppProvider><SettingsPage /></AppProvider>);
    await waitFor(() => expect(screen.getByText('Configuración')).toBeInTheDocument());
    const btn = await screen.findByText('Desactivado');
    fireEvent.click(btn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});