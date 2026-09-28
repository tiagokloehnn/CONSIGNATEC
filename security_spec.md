# Security Specification & Threat Model — Consignatec Finanças

## 1. Security Architecture & Threat Vectors
This specification details the Attribute-Based Access Control (ABAC) and Zero-Trust model implemented on the Firestore database of **Consignatec Finanças** (Project: `consignatec`).

### 1.1 Data Invariants
1. **Zero Anonymous/Public Access**: No document in the database may ever be read, modified, or listed without a verified cryptographic Firebase Auth session token (`request.auth != null`).
2. **Strict User Isolation (No Cross-Tenant Read/Write)**: A user with `request.auth.uid == 'userA'` can NEVER access, query, list, modify, or delete any record where the owner path does not match `userA`.
3. **Data Integrity on Write**:
   - `UserProfile`: `id`, `email`, and `name` must be non-empty strings. `id` must equal `request.auth.uid`.
   - `FinancialProfile`: `userId` must strictly equal `request.auth.uid`. Base income and monthly incomes must be positive or zero valid numbers.
   - `Expense`: `userId` must strictly match `request.auth.uid`. `valor` must be a valid number >= 0. `descricao`, `categoria`, and `status` must be constrained bounded strings.
4. **Denial-of-Wallet & Buffer Overflow Guard**: String fields must not exceed strict volumetric thresholds (`<= 128` chars for IDs/categories, `<= 256` chars for names/descriptions).
5. **No Orphaned or Ghost Fields**: Incoming payloads cannot inject unauthorized arbitrary properties.

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Unauthenticated Public Read**:
   - *Target*: `GET /databases/(default)/documents/users/user123`
   - *Token*: `None`
   - *Expected*: `PERMISSION_DENIED`

2. **Cross-User Snooping (Attacker reads Victim's Expenses)**:
   - *Target*: `GET /databases/(default)/documents/users/victim_999/expenses/exp_1`
   - *Token*: `auth.uid == 'attacker_111'`
   - *Expected*: `PERMISSION_DENIED`

3. **Cross-User List Query Scraping**:
   - *Target*: `LIST /databases/(default)/documents/users/victim_999/expenses`
   - *Token*: `auth.uid == 'attacker_111'`
   - *Expected*: `PERMISSION_DENIED`

4. **Identity Spoofing on Profile Create**:
   - *Target*: `CREATE /databases/(default)/documents/users/victim_999`
   - *Payload*: `{"id": "victim_999", "name": "Fake Name", "email": "victim@example.com"}`
   - *Token*: `auth.uid == 'attacker_111'`
   - *Expected*: `PERMISSION_DENIED` (Path and ID mismatch `auth.uid`)

5. **Privilege Escalation via Ghost Field Injection**:
   - *Target*: `UPDATE /databases/(default)/documents/users/user_123`
   - *Payload*: `{"isAdmin": true, "role": "superadmin"}`
   - *Token*: `auth.uid == 'user_123'`
   - *Expected*: `PERMISSION_DENIED`

6. **Denial-of-Wallet Huge Payload (Oversized Description Attack)**:
   - *Target*: `CREATE /databases/(default)/documents/users/user_123/expenses/exp_overflow`
   - *Payload*: `{"descricao": "A".repeat(1000000), "valor": 50, "userId": "user_123", ...}`
   - *Token*: `auth.uid == 'user_123'`
   - *Expected*: `PERMISSION_DENIED` (size violation)

7. **Negative or Invalid Currency Poisoning**:
   - *Target*: `CREATE /databases/(default)/documents/users/user_123/expenses/exp_neg`
   - *Payload*: `{"valor": -9999999, "descricao": "Negative value hack", "userId": "user_123", ...}`
   - *Token*: `auth.uid == 'user_123'`
   - *Expected*: `PERMISSION_DENIED` (value must be >= 0)

8. **Path Traversal / ID Poisoning**:
   - *Target*: `CREATE /databases/(default)/documents/users/user_123/expenses/../../admin_secret`
   - *Token*: `auth.uid == 'user_123'`
   - *Expected*: `PERMISSION_DENIED` (strict regex `^[a-zA-Z0-9_\-]+$`)

9. **Foreign User Financial Overwrite**:
   - *Target*: `UPDATE /databases/(default)/documents/users/victim_999/financial/main`
   - *Payload*: `{"baseIncome": 0, "userId": "victim_999"}`
   - *Token*: `auth.uid == 'attacker_111'`
   - *Expected*: `PERMISSION_DENIED`

10. **Tampering with Immutable User ID in Expense**:
    - *Target*: `UPDATE /databases/(default)/documents/users/user_123/expenses/exp_1`
    - *Payload*: `{"userId": "victim_999"}`
    - *Token*: `auth.uid == 'user_123'`
    - *Expected*: `PERMISSION_DENIED` (userId cannot change)

11. **Email Lookup Enumeration Attack**:
    - *Target*: `GET /databases/(default)/documents/users_by_email/victim%40gmail%2Ecom`
    - *Token*: `auth.uid == 'attacker_111'` (auth email is `attacker@gmail.com`)
    - *Expected*: `PERMISSION_DENIED`

12. **Catch-All Default Deny for Root Documents**:
    - *Target*: `WRITE /databases/(default)/documents/any_arbitrary_collection/item`
    - *Token*: Any
    - *Expected*: `PERMISSION_DENIED`
