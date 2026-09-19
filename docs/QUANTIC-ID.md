# Quantic ID — foundation

## Product rule

Quantic Sillage does not ask the user to type a password when entering the ecosystem.

The public action is **Entrer**.

The identity is usable only while a trusted Quantic identity mechanism is active on the device:

- Quantic Secure companion application;
- Quantic Key;
- platform secure hardware through a supported authenticator.

## Security boundary

The website must never read, receive, export or back up the private key.

The target flow is:

1. Sillage requests a short-lived challenge from the Quantic Identity service.
2. Quantic Secure / Quantic Key signs that challenge locally.
3. The service verifies the signature against the registered public key.
4. The service mints a short-lived Quantic session.
5. Product-specific services accept the Quantic session through a shared SSO contract.
6. Removing or locking the identity can revoke the local session.

## Current implementation

The shared shell introduces:

- a global **Entrer** action;
- an immersive Quantic ID overlay;
- Quantic Secure local-companion detection contract at `http://127.0.0.1:47621/v1/status`;
- secure-context / WebAuthn capability detection;
- a shared Quantic application switcher;
- a dedicated `identity.html` product surface.

This is deliberately **not** a fake authentication implementation. It does not mint a session until a cryptographic verifier and the Quantic Secure companion exist.

## Companion contract (v1)

`GET /v1/status`

Example response:

```json
{
  "version": 1,
  "identityAvailable": true,
  "keyId": "qid_...",
  "label": "Quantic Key"
}
```

Future signing endpoint:

`POST /v1/assert`

Input: server challenge + relying-party information.

Output: `keyId`, signature, algorithm and assertion metadata. The private key never leaves the companion.

## Next security work

- central Identity API;
- public-key enrollment and revocation;
- signed challenge verification;
- device registry;
- session TTL and revocation;
- recovery-key policy;
- SSO exchange for Pulse, Mail, Vision, News and desktop apps;
- independent security review before production use.
