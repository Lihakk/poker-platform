# API verification and demonstration

## Automated verification

Ordinary `go test ./...` checks normalized validation, JWT signing/expiry, OpenAPI route coverage, Postman assertions and deployment-file structure. Database integration is opt-in:

```powershell
cd backend
$env:POKER_TEST_DSN = "poker_app:poker_app_password@tcp(127.0.0.1:3306)/poker_db?charset=utf8mb4&parseTime=True&loc=Local"
go test ./... -v
```

Use a development database account with permission to create/drop tables. The API integration test creates uniquely prefixed `crit_<nonce>_` tables and removes only those tables on completion. Existing application records are not changed. It checks all 30 production endpoint registrations, CRUD, pagination, filtering, hypermedia, wrong-parent scoping, roles, ownership, duplicate/oversized input, refresh rotation/replay and logout invalidation. Five meaningful module/quiz/question records are created in the isolated fixture.

To execute the actual Postman collection against that isolated database as well, install Node/npm and set:

```powershell
$env:POKER_RUN_POSTMAN = "1"
go test ./controllers -run TestAPICriteria -v -count=1
```

This invokes Newman through `npx`; its first run may need network access. The temporary HTTP server and seeded administrator exist only for that test. No real administrator password is required.

## Interactive Postman demonstration

Import `PokerLearn.postman_collection.json`. Use only a development instance: the collection creates three demonstration accounts and two content branches. It deletes its content branches but leaves the demonstration accounts because account deletion is not an implemented endpoint.

Set the collection variables `baseUrl`, `adminEmail` and `adminPassword`. Use an existing administrator. To bootstrap one locally, first register an account, set `ADMIN_EMAIL` to its email and restart the backend. Clear this bootstrap variable after use. Never commit passwords or exported tokens.

Run the folders in order. The collection creates two editors and a learner, checks each endpoint and then tests refresh replay and logout. Every request has assertions. Invalid input should return 400; missing authentication 401; insufficient role or wrong owner 403; missing or incorrectly scoped resources 404; duplicate registration 409; successful creation 201 with Location; deletion/logout 204 without a body. A genuine database/server failure remains 500 rather than being disguised as a client error.

## Defense examples

- CRUD/LIST: demonstrate modules, quizzes and questions in the content editor and Postman.
- Scope: request `/api/v1/modules/{moduleId}/quizzes/{quizId}/questions` using a quiz from a different module; expect 404.
- Ownership: use the second editor token to update/delete the first editor's content; expect 403.
- Token lifecycle: rotate a refresh cookie, replay the old cookie and verify access is rejected; sign in again, log out and verify rejection again.
- REST: resource nouns and HTTP methods, JSON representations and `_links`; each protected request carries its access token. Refresh-session revocation data is stored in MariaDB. HTTP response caching is not currently implemented and should not be claimed.
- Architecture: `main.go` configures the server, `controllers/routes.go` registers routes, controllers validate and operate on GORM models, MariaDB persists application content.
- SQL injection: values are passed as parameters to GORM rather than interpolated into SQL. This is not a claim that all possible security threats have been eliminated.
- AI assistance: explain honestly where AI helped produce code, design or tests, and be prepared to understand and change those parts without an assistant during defense.
