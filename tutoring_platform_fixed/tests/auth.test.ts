import { test, expect } from '@playwright/test';
import type { ApiResponse, LoginData } from './types';

const BASE_API = 'https://localhost:44331/api';

test.describe('User Authentication', () => {

  test('API — Login returns JWT token', async ({ request }) => {
    const res = await request.post(`${BASE_API}/user/login`, {
      data: { email: 'kasun@email.com', password: 'Pass@123' },
    });

    expect(res.status()).toBe(200);
    const body: ApiResponse<LoginData> = await res.json();
    expect(body.statusCode).toBe(1);
    expect(body.data.token).toBeTruthy();
    console.log('✅ Token received:', body.data.token.slice(0, 20) + '...');
  });

  test('API — Login with wrong password returns fail', async ({ request }) => {
    const res = await request.post(`${BASE_API}/user/login`, {
      data: { email: 'kasun@email.com', password: 'WrongPass' },
    });
    const body: ApiResponse = await res.json();
    expect(body.statusCode).toBe(0);
  });

  test('UI — Login success redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kasun@email.com');
    await page.fill('input[name="password"]', 'Pass@123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
    await page.screenshot({ path: 'screenshots/login-success.png', fullPage: true });
  });

  test('UI — Wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kasun@email.com');
    await page.fill('input[name="password"]', 'WrongPass');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await page.screenshot({ path: 'screenshots/login-error.png', fullPage: true });
  });

});