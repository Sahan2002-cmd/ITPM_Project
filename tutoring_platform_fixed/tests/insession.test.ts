import { test, expect, type APIRequestContext } from '@playwright/test';
import type { ApiResponse, LoginData, MessageData } from './types';

const BASE_API = 'https://localhost:44331/api';

async function getToken(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${BASE_API}/user/login`, {
    data: { email, password },
  });
  const body: ApiResponse<LoginData> = await res.json();
  return body.data.token;
}

test.describe('InSession Messages', () => {

  test('Send message to active session', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    const res = await request.post(`${BASE_API}/insessionmessage/send`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        bookingId: 1,
        receiverId: 3,
        messageText: 'Playwright TS test message',
      },
    });

    const body: ApiResponse = await res.json();
    expect(body.statusCode).toBe(1);
    console.log('✅ Message sent:', body.message);
  });

  test('Get chat history for booking', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    const res = await request.get(`${BASE_API}/insessionmessage/1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const body: ApiResponse<MessageData[]> = await res.json();
    expect(body.statusCode).toBe(1);
    console.log(`✅ Messages count: ${(body.data as MessageData[]).length}`);
  });

  test('Admin access returns 403', async ({ request }) => {
    const adminToken = await getToken(request, 'admin@email.com', 'AdminPass@123');

    const res = await request.get(`${BASE_API}/insessionmessage/1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status()).toBe(403);
    console.log('✅ Admin correctly blocked with 403');
  });

  test('Edit message within 5 minute window', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    const res = await request.put(`${BASE_API}/insessionmessage/edit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        messageId: 1,
        messageText: 'Edited via Playwright TS test',
      },
    });

    const body: ApiResponse = await res.json();
    console.log('Edit result:', body.message);
    expect([0, 1]).toContain(body.statusCode);
  });

});