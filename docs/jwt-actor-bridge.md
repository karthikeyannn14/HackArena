# JWT Actor Bridge Integration

## 1. Existing JWT Architecture
The Member 1 Backend authenticates users by issuing a JSON Web Token (`jsonwebtoken`) upon login. This token is verified using the existing `auth.middleware.js` which extracts the payload and assigns it to `req.user`.

## 2. JWT Payload Identity Field
The canonical identity field embedded in the Member 1 JWT is `userId` (mapping to the MongoDB `_id`). The middleware attaches it as `req.user.userId`.

## 3. Judging Actor Identity Requirement
The Judging Engine explicitly requires the authenticated user's ID to be passed downstream as the `x-actor-id` HTTP header. This ID tracks audit logs and validates judging permissions.

## 4. Middleware Flow
A dedicated bridge middleware (`jwt-actor-bridge.ts`) was created to securely couple the two systems:
1. **Sanitize**: Strips any client-provided `x-actor-id` header to prevent spoofing.
2. **Authenticate**: Invokes Member 1's existing `authenticate` middleware, which cryptographically verifies the Bearer JWT.
3. **Inject**: Extracts `req.user.userId` from the verified payload and injects it as `req.headers['x-actor-id']`.
4. **Delegate**: Forwards the request to the Judging Router.

## 5. Header Overwrite Behavior
Any `x-actor-id` manually specified by the client in the HTTP request is aggressively deleted prior to token verification, ensuring the Judging router strictly receives the cryptographically verified identity.

## 6. Authentication Failure Behavior
* **Missing/Invalid/Expired Token**: The middleware intercepts the request and instantly returns the existing Member 1 `401 Unauthorized` response. It never reaches the judging algorithms.

## 7. Authorization Behavior
* **Valid Token**: Passes strictly authenticated identity to the Judging router. The Judging router's native authorization checks (e.g., verifying `Judge` activation status or event assignments) remain fully intact and will emit `401`/`403`/`404` errors if judging permissions are insufficient.

## 8. Security Considerations
* **No Secret Exposure**: The bridge utilizes the exact same `process.env.JWT_SECRET` natively used by Member 1 without duplicating cryptographic implementation.
* **No Logging**: Sensitive Authorization tokens are neither logged nor leaked.
* **Spoof Proof**: The client cannot override their identity.

## 9. Tests Performed
* Added focused test suite `jwt-actor-bridge.test.ts`.
* Verified 401s for missing, invalid, and expired JWTs.
* Verified successful passthrough and header overwrite for valid JWTs.
* Maintained existing Phase 7A API tests untouched to ensure backward-compatible isolation.

## 10. Remaining Integration Work
The complete backend integration is now structurally unified and secured! The next step is adjusting the React frontend workflows to seamlessly consume the combined APIs.
