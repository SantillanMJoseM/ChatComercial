// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import SettingsPage from '../pages/SettingsPage';
import { db } from '../db/db';
import { seedDefaults } from '../db/seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedDefaults();
});

describe('settings ui', () => {
  it('toggles out of hours and persists', async () => {
    render(<AppProvider><SettingsPage /></AppProvider>);
    await waitFor(() => expect(screen.getByText('Configuración')).toBeInTheDocument());
    const btn = await screen.findByText('Desactivado');
    fireEvent.click(btn);
    await waitFor(async () => {
      const s = await db.settings.get('global');
      expect(s.outOfHours).toBe(true);
    });
  });
});