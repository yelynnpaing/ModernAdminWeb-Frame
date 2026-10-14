# Admin Web Frame

Vue 3 + Vuetify 3. Layout and Drawer follow hms-fe; Users, Roles and Category use List/Entry components with Show, AfterSaved and Reload. Lottery is the API backend.

## Category CRUD

    src/views/setting/category/List.vue
    src/views/setting/category/Entry.vue
    src/models/setting/category.js
    src/services/setting/category.service.js

Category data is now loaded and saved through Lottery APIs:

- GET /api/category — start (one-based page), length, sortBy, sortOrder, name; maps data/total to the table.
- GET /api/category/getbyid?id= — load edit record.
- POST /api/category/save — { id, name, description }; id 0 creates, existing id updates.
- DELETE /api/category/delete?id= — delete after confirmation.

All Category requests use the shared bearer-authenticated API client, including cancellation, 401 handling and server validation errors. Category CRUD never reads or writes localStorage and never falls back to browser records. Old cached categories are ignored and are not automatically uploaded to the backend. Setting store retains Location persistence only; it no longer accepts category save/delete operations or serializes category fields.

Name is required (1–80 characters); Description is optional (up to 250 characters). Category continues to use Setting Read/Write/Delete permissions. UI routes are /category-list, /categories, /settings/category and /settings/categories. The HMS-style Setting drawer grouping remains unchanged.

## Other features

Users, Roles, Permissions and Login/Logout use Lottery APIs. Location remains browser-local. Stock, Supplier and Inventory pages were removed. Backend-derived menus are grouped under Setting with HMS-style icons and nested navigation.

## Run and validation

    npm run dev
    npm run lint
    npm test
    npm run build

Keep Lottery running at the proxy target configured in .env.development. 31 automated tests cover API contracts, authentication, permissions, menu routing and Category no-localStorage behavior. API tests use deterministic response fixtures; authenticated Category CRUD against a real account was not performed. Build verification uses default Vuetify CSS because native Windows realpath/Sass operations are restricted in this sandbox; verify the original Vite/Sass config in a normal terminal.
