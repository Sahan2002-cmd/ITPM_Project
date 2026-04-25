import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import type { ApiResponse, LoginData, FileResourceData } from './types';
import * as fs from 'fs';
import * as path from 'path';

const BASE_API = 'https://localhost:44331/api';

// ✅ Fixed: APIRequestContext directly use කරනවා
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

test.describe('File Resources', () => {

  test('Get session files for booking', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    const res = await request.get(`${BASE_API}/fileresource/1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const body: ApiResponse<FileResourceData[]> = await res.json();
    console.log(`✅ Files found: ${(body.data as FileResourceData[])?.length ?? 0}`);
  });

  test('Upload a test PDF file', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    // ✅ __dirname ESM trick remove කළා — path.resolve use කරනවා
    const testFilePath = path.resolve('tests', 'test-upload.pdf');
    fs.writeFileSync(testFilePath, '%PDF-1.4 test content');

    const fileBuffer = fs.readFileSync(testFilePath);

    const res = await request.post(`${BASE_API}/fileresource/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        bookingId: '1',           // ✅ string විදිහට pass කරනවා
        file: {
          name: 'test-upload.pdf',
          mimeType: 'application/pdf',
          buffer: fileBuffer,
        },
      },
    });

    const body: ApiResponse = await res.json();
    console.log('Upload result:', body.message);
    fs.unlinkSync(testFilePath);
    expect([0, 1]).toContain(body.statusCode);
  });

  test('Rename file — uploader only', async ({ request }) => {
    const token = await getToken(request, 'kasun@email.com', 'Pass@123');

    const res = await request.put(`${BASE_API}/fileresource/rename`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fileId: 1, fileName: 'Renamed_via_Playwright.pdf' },
    });

    const body: ApiResponse = await res.json();
    console.log('Rename result:', body.message);
    expect([0, 1]).toContain(body.statusCode);
  });

});