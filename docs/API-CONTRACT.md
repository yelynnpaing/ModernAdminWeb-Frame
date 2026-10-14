# Lottery API integration

Backend source: D:\Asus-YLP\Lottery. UI reference: PoliceHR users, role, and personals/specialCaseRecords Entry/List.

Frontend: http://localhost:3000. Vite forwards /api to https://localhost:7204. Run the backend HTTPS launch profile; change VITE_API_PROXY_TARGET for a different port. Production needs a same-origin /api reverse proxy, or VITE_API_BASE_URL plus backend CORS configuration. The dev proxy allows the local ASP.NET development certificate only.

| Feature | Method/path | Contract |
| --- | --- | --- |
| Login | POST /api/auth/login | { userName, password } → { accessToken, tokenType, expiresAtUtc, userId, userName, displayName } |
| Logout | POST /api/auth/logout | Authorization: Bearer token → { success } |
| User list | GET /api/user | start (one-based page), length, sortBy, sortOrder, name, username, role, status → { data, total, success, messages } |
| User detail | GET /api/user/getbyid?id= | { id, name, userName, roleId, roleName, status, expiredDate } |
| User save | POST /api/user/save | { id, name, userName, roleId, status, expiredDate, password (create only) } |
| User delete | DELETE /api/user/delete?id= | { success, message } |
| Password change | POST /api/user/reset_password | { oldPassword, newPassword }; current authenticated user only |
| Role list | GET /api/role | start, length, sortBy, sortOrder, name → { data, total, success, messages } |
| Role detail | GET /api/role/getbyid?id= | { id, name, description } |
| Role save | POST /api/role/save | { id, name, description } |
| Role delete | DELETE /api/role/delete?id= | { success, message } |
| Program options | GET /api/permission/ProgramCodes | [{ id, code, name, parentId }] |
| Role matrix | GET /api/permission/PermissionListByRoleId?roleId= | [{ id, program_code_id, role_id, role_name, programCodeName, text, can_read, can_write, can_delete, can_print, ... }] |
| Save matrix | POST /api/permission/SavePermission | Array of { id, program_code_id, role_id, can_read, can_write, can_delete, can_print } |

## Login/session flow

Login → save a namespaced session in sessionStorage → fetch current user by userId → fetch role permissions and program codes → enter allowed landing page. Reload restores user/role/permissions from the API. No hardcoded login, admin bypass, password persistence, or demo fallback is used. HTTP 401 and token expiry clear session and return to Login. Logout always clears this browser session, and reports when the backend audit call failed. The backend currently logs logout; it does not revoke issued JWTs.

## Permission configuration

Program code keys used by this FE: USERS, ROLES, DASHBOARD, INVENTORY, STOCK_MOVEMENTS, SUPPLIERS, CATEGORIES, LOCATIONS. Code matching uses ProgramCodes.code, not display name. User/role routes and action buttons require their corresponding permissions. ROLES write controls the permission editor. Read is required for all actions; Delete requires Write. Disabling Read clears Write/Delete/Print; disabling Write clears Delete. Configure the first administrative role/program permissions in the backend/database before opening restricted screens; there is no automatic privilege bypass. An account without permissions can still view its account and change its own password.

The existing Lottery controllers use [Authorize] but do not enforce this program/action matrix on their endpoints. FE gating is implemented here; server-side program/action policies remain a backend task. No database migration, seed, or backend source file was changed.

## Differences from PoliceHR

Same Entry.Show / AfterSaved / DataTable.Reload component pattern and compact toolbar, modal forms, action icons and fullscreen permission matrix. Uses Pinia instead of duplicating PoliceHR Vuex. Lottery has no GetLogInUserInfo, role dropdown, export Excel, rank, or administrative password-reset endpoints. Current-user detail uses GetById; role choices use GET /role?length=-1. Rank fields and Excel actions are omitted. Password changes are on Account. Server validation requires username 3–80, name <=120, create password 8–128, role name <=80, description <=250.

User GetById currently contains a 7-second test delay in Lottery source. The FE shows a loading state and uses a 30-second timeout.

## Verification

- ESLint passed with the reference AfterSaved event contract preserved.
- 15 automated contract/session/permission tests passed using deterministic API responses.
- Live Lottery Swagger routes verified on localhost:5225; HTTPS protected user endpoint returned 401 without a token and empty login returned 400.
- Browser checks passed: desktop and smaller-screen Login layout, required-field validation, live rejection of nonexistent test credentials, and /users redirect to Login.
- Authenticated CRUD and successful login/logout with a real account were not exercised; no existing account credentials or database data were changed.
- Latest source compiled into dist using a verification-only config with default Vuetify CSS. Standard npm run build is blocked in this sandbox by native Windows realpath EPERM; custom Sass verification also has a native path restriction. The shipped Vite/Sass settings are retained, and the temporary verification config is removed. Run npm run build in your normal terminal to verify that configuration.


## Backend-driven Drawer

Login validates the session user ID against GET /user/getbyid, then reads that user's role permission matrix and ProgramCodes. Drawer menu titles, icons, links and parent-child hierarchy are derived from those API responses. The static frontend menu array is removed. Read permission controls visibility; an unreadable parent can group readable children without becoming a navigation link. Missing frontend routes remain visible but disabled. Permission refresh and logout update/clear the menu automatically. Login responses are not logged to the console.

Menu tests cover backend metadata, role filtering, new programs, cyclic/orphan hierarchy, refreshed permissions, logout and session identity mismatch. 22 automated tests and ESLint passed. Compilation passed using the documented sandbox verification configuration with default Vuetify CSS. Authenticated drawer rendering with a real account has not been tested in this update.

## Backend settings route compatibility

The supplied permission response uses /settings and /settings/users. These now resolve to Settings and Users rather than the unknown-route Dashboard redirect. /settings/role and /settings/roles alias the existing Role screen. Permission matching prefers canonical program codes/IDs, and supports Setting/Settings, User/Users and Role/Roles display names when canonical codes are absent. Role ID and action flags are still required; parent Settings permission never grants Users access.

The supplied admin role/program IDs and boolean flags are covered by a route-guard regression test, including denied cases. 26 tests and ESLint passed; default-CSS sandbox compilation passed. This update was tested with the supplied response fixtures, not by using a real account credential.

## Current Category API contract

Category now uses GET /api/category, GET /api/category/getbyid?id=, POST /api/category/save and DELETE /api/category/delete?id=. List query uses start (one-based page), length, sortBy, sortOrder and name. The paged response is { data, total, success, messages }; save accepts { id, name, description }. Category CRUD no longer uses localStorage or Setting store, and server failures do not fall back to browser data. Setting store now persists only Locations. Existing browser Category records are ignored and are not automatically imported into the backend. Category UI and Setting permission controls remain unchanged.
