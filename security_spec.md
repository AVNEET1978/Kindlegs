# Security Specification for Kindlegs

## Data Invariants
1. A Pet must have an `ownerId` matching the creator's UID.
2. A Medical Record must belong to a Pet owned by the current user.
3. A Reminder must belong to a Pet owned by the current user.
4. Users can only see their own profile and pets.
5. All sensitive data (PII) like user emails are protected.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Spoofing**: Creating a pet with someone else's `ownerId`.
2. **Orphaned Record**: Creating a record for a pet that doesn't exist.
3. **Cross-User Leak**: Listing pets without an `ownerId` filter.
4. **Action Bypass**: Updating a pet's `createdAt` timestamp.
5. **PII Exposure**: Reading another user's profile document.
6. **State Poisoning**: Injecting massive strings into a pet's name.
7. **Relational Hijack**: Adding a record to a pet owned by another user.
8. **Malicious ID**: Using a 2MB string as a document ID.
9. **Timestamp Spoofing**: Providing a future `createdAt` from the client.
10. **Shadow Fields**: Adding `isAdmin: true` to a user document.
11. **Type Mismatch**: Sending a number for a pet's name string.
12. **Record Swap**: Changing a record's `petId` during update.

## The Test Runner
(I will implement this logic in the firestore.rules and verify via logic)
