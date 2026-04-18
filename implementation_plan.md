# Module 3 — Real-time Chat & Resource Sharing (Full Implementation)

This plan covers fixing the **backend** business rule gaps and wiring the **frontend** pages to the real API so all 12 CRUD operations work end-to-end, along with User CRUD (Login, Create, View, Update, SoftDelete).

---

## Current State Assessment

### Backend — Already Exists but has Rule Gaps

| Area | Status | Gap |
|---|---|---|
| Models, RequestApi models | ✅ Complete | — |
| Interfaces | ✅ Complete | — |
| ChatHub.cs (SignalR) | ✅ Complete | — |
| InSessionMessageController | ✅ Mostly complete | Missing 2000-char max validation |
| DAInSessionMessage | ✅ Mostly complete | Missing 2000-char max validation |
| OutSessionMessageController | ⚠️ `SendMessage()` not properly routed | Method at line 94 has no `[HttpPost]`/`[Route]` attributes |
| DAOutSessionMessage | ✅ Mostly complete | Missing 2000-char max validation |
| FileResourceController | ⚠️ Wrong limits | Max file = 5MB (should be 20MB); no 100-char filename check |
| DAFileResource | ⚠️ Incomplete delete logic | Only uploader can delete (spec says uploader OR tutor); delete is soft-delete (spec says hard-delete with file removal) |
| SessionNoteController | ✅ Complete | — |
| DASessionNote | ⚠️ Minor | Missing 10-char min check on `TopicsCovered` |
| UserController | ✅ Complete | All 5 User CRUD operations work |
| DAUser | ✅ Complete | Login, Register, GetById, Edit (OTP), SoftDelete all present |

### Frontend — Pages Exist but Use Mock Data

| Page | Status | Issue |
|---|---|---|
| Chat.tsx | ⚠️ Direct messages only | No in-session chat, no edit/delete, no "Edited" label, no SignalR |
| FileUpload.tsx | ❌ Mock data | Simulates upload progress, doesn't call API |
| MaterialsLibrary.tsx | ❌ Mock data | Uses `mockData.ts` imports, no API calls |
| SessionNotes.tsx | ❌ Mock data | Static content, no API calls |
| Module_03_API.js | ✅ Complete | All API functions already defined |
| UserAPI.js | ✅ Complete | All user API functions already defined |
| Auth / Login pages | ✅ Working | AuthContext + login flow functional |

---

## Proposed Changes

### Component 1: Backend — Fix Business Rule Gaps

#### [MODIFY] [DAInSessionMessage.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/DataAccess/DAInSessionMessage.cs)
- Add 2000-character maximum validation on `MessageText` in `SendMessage()` and `EditMessage()`

#### [MODIFY] [DAOutSessionMessage.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/DataAccess/DAOutSessionMessage.cs)
- Add 2000-character maximum validation on `MessageText` in `SendMessage()`, `SendDirectMessage()`, and `EditMessage()`

#### [MODIFY] [OutSessionMessageController.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/Controllers/OutSessionMessageController.cs)
- Fix the `SendMessage()` method at line 94: add missing `[HttpPost]` and `[Route("send")]` attributes, use JWT `callerId` for `SenderId`, and delegate to `_da.SendMessage()`

#### [MODIFY] [FileResourceController.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/Controllers/FileResourceController.cs)
- Change `MaxBytes` from 5MB to 20MB (20 * 1024 * 1024)
- Add 100-character max validation on display `FileName`
- Add a download endpoint: `GET /api/fileresource/download/{id}` to serve actual file bytes

#### [MODIFY] [DAFileResource.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/DataAccess/DAFileResource.cs)
- `DeleteFile()`: Allow **tutor of the session** (not just uploader) to delete — look up the booking to get TutorId
- Change from soft-delete to **hard-delete**: remove the MongoDB document AND delete the physical file from disk
- Add `GetFileById()` method for the download endpoint

#### [MODIFY] [DASessionNote.cs](file:///d:/Pro_Test/ITPM_Project/Backend/PeerLearningAndTutorialSystem/DataAccess/DASessionNote.cs)
- Add 10-character minimum validation on `TopicsCovered` in `SubmitNote()` and `EditNote()`

---

### Component 2: Frontend — Wire Chat Page to Real API + SignalR

#### [MODIFY] [Chat.tsx](file:///d:/Pro_Test/ITPM_Project/tutoring_platform_fixed/src/app/pages/Chat.tsx)
Complete rewrite to support **both** in-session and out-session messaging:
- **In-Session tab**: Connect via SignalR to `session_{bookingId}` group; send/receive messages in real-time; show "Edited" label; inline edit (within 5 min) and soft-delete with context menu
- **Out-Session tab**: REST API for sending/receiving messages; edit within 30 min; soft-delete
- Use `getInSessionMessages`, `sendInSessionMessage`, `editInSessionMessage`, `deleteInSessionMessage` from Module_03_API
- Use `getOutSessionMessages`, `sendOutSessionMessage`, `editOutSessionMessage`, `deleteOutSessionMessage` from Module_03_API
- Show `(Edited)` badge when `editedAt` is non-null
- Disable send when session is not Active (for in-session)
- 2000-character counter on message input

---

### Component 3: Frontend — Wire FileUpload + MaterialsLibrary

#### [MODIFY] [FileUpload.tsx](file:///d:/Pro_Test/ITPM_Project/tutoring_platform_fixed/src/app/pages/FileUpload.tsx)
- Replace mock upload with real `uploadFileResource(bookingId, file)` API call
- Validate file type (PDF, DOCX, PNG, JPG only) and size (20MB max) before upload
- Validate display filename ≤ 100 characters
- Show actual upload progress
- Add booking selector dropdown (fetch user's bookings)

#### [MODIFY] [MaterialsLibrary.tsx](file:///d:/Pro_Test/ITPM_Project/tutoring_platform_fixed/src/app/pages/MaterialsLibrary.tsx)
- Replace mock data with real `getFileResourcesByBooking(bookingId)` API call
- Implement download via `GET /api/fileresource/download/{id}`
- Add rename functionality (uploader only) using `renameFileResource()`
- Add delete functionality using `deleteFileResource()`
- Show uploader name, file type icon, and file size

---

### Component 4: Frontend — Wire SessionNotes

#### [MODIFY] [SessionNotes.tsx](file:///d:/Pro_Test/ITPM_Project/tutoring_platform_fixed/src/app/pages/SessionNotes.tsx)
- Replace static content with real API calls
- **Tutor view**: Form to submit/edit session note with `submitSessionNote()` and `editSessionNote()`; 10-char minimum on Topics Covered; optional Homework and Next Steps fields
- **Student view**: Read-only display of completed session notes via `getSessionNote()`
- Show locked state after 24-hour edit window
- Add booking selector to choose which session to write notes for

---

### Component 5: Frontend — Install SignalR Client

#### [MODIFY] [package.json](file:///d:/Pro_Test/ITPM_Project/tutoring_platform_fixed/package.json)
- Add `@microsoft/signalr` dependency for real-time in-session chat

---

## User Management (Already Working)

The user module is already fully functional:

| Operation | Backend Endpoint | Frontend API | Status |
|---|---|---|---|
| **Login** | `POST /api/user/login` | `loginUser()` | ✅ Working |
| **Create** | `POST /api/user/register` | `registerUser()` | ✅ Working |
| **View** | `GET /api/user/{id}` | `getUserById()` | ✅ Working |
| **Update** | `PUT /api/user/edit` | `editUserProfile()` | ✅ Working |
| **SoftDelete** | `DELETE /api/user/delete/{id}` | `deleteUser()` | ✅ Working |

No changes required for User CRUD — all 5 operations are already implemented and connected.

---

## Open Questions

> [!IMPORTANT]
> **Booking Selection**: The Chat, FileUpload, MaterialsLibrary, and SessionNotes pages all need a booking context (bookingId). Currently there's no booking selector UI. Should I:
> - (A) Add a booking dropdown at the top of each page that loads the user's bookings, OR
> - (B) Pass bookingId via URL params (e.g., `/student/chat?bookingId=5`), OR
> - (C) Create a unified "Session Details" page with tabs for Chat, Files, Notes?

> [!IMPORTANT]
> **SignalR Connection**: The backend uses **ASP.NET SignalR** (not ASP.NET Core SignalR). The frontend SignalR client package choice depends on this. The existing ChatHub.cs uses `Microsoft.AspNet.SignalR` which requires the jQuery-based SignalR client, NOT `@microsoft/signalr` (which is for ASP.NET Core). Should I:
> - (A) Use the jQuery SignalR client via CDN, OR
> - (B) Use a lightweight wrapper that connects to the legacy `/signalr` endpoint?

---

## Verification Plan

### Manual Verification
1. **Start backend** in Visual Studio (https://localhost:44331/)
2. **Start frontend** with `npm run dev` in VS Code
3. **Test User flows**: Register → Login → View Profile → Edit → Soft-Delete (Admin)
4. **Test In-Session Chat**: Log in as both student and tutor, verify real-time messages, edit within 5 min, delete (soft)
5. **Test Out-Session Messages**: Send/edit (30-min window)/delete messages
6. **Test File Upload**: Upload PDF/DOCX/PNG/JPG, verify 20MB limit, rename, delete
7. **Test Materials Library**: View files, download, filter
8. **Test Session Notes**: Submit as tutor, view as student, edit within 24h, admin delete
