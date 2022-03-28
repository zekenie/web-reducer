- https://cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html
- https://snyk.io/blog/10-docker-image-security-best-practices
- https://github.com/laverdet/isolated-vm
  - Against potentially hostile code you should also consider turning on v8 untrusted code mitigations, which helps address the class of speculative execution attacks known as Spectre and Meltdown. You can enable this feature by running node with the --untrusted-code-mitigations flag. This feature comes with a slight performance cost and must be enabled per-process, therefore nodejs disables it by default.
- need security tools for customers
  - HMAC digest
  - reading of headers
  - replay attacks
  - ideas
    - give them a `isValid` function
    - give them a `idempotencyTokenGenerator`

## 3/27/22

- consider [this tool called bubble wrap](https://github.com/containers/bubblewrap) at some point
