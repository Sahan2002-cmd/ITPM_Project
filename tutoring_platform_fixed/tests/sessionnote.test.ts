import { test, expect, APIRequestContext } from '@playwright/test';
import type { ApiResponse, LoginData, SessionNoteData } from './types';

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

test.describe('Session Notes', () => {

  test('Tutor submits session note', async ({ request }) => {
    const token = await getToken(request, 'tutor@email.com', 'Pass@123');

    const res = await request.post(`${BASE_API}/sessionnote/submit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        bookingId: 1,
        topicsCovered: 'Playwright TS — algebra and equations covered in detail',
        homework: 'Complete page 45 exercises 1-10',
        nextSteps: 'Move to simultaneous equations',
      },
    });

    const body: ApiResponse = await res.json();
    console.log('Note submit:', body.message);
    expect([0, 1]).toContain(body.statusCode);
  });

  test('Student cannot submit note — 403', async ({ request }) => {
    const token = await getToken(request, 'student@email.com', 'Pass@123');

    const res = await request.post(`${BASE_API}/sessionnote/submit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { bookingId: 1, topicsCovered: 'Should be blocked' },
    });

    expect(res.status()).toBe(403);
    console.log('✅ Student correctly blocked');
  });

  test('Get session note by booking', async ({ request }) => {
    const token = await getToken(request, 'tutor@email.com', 'Pass@123');

    const res = await request.get(`${BASE_API}/sessionnote/1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const body: ApiResponse<SessionNoteData> = await res.json();
    console.log('✅ Note fetched:', body.message);
  });

  test('Admin can download report (200)', async ({ request }) => {
    const token = await getToken(request, 'admin@email.com', 'AdminPass@123');

    const res = await request.get(`${BASE_API}/sessionnote/report/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // PDF return — content-type check
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
    console.log('✅ PDF report downloaded');
  });

});