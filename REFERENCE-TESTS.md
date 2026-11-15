# Owned original reference tests

These2 original test files belong to document-editor because their imported source modules match this repository’s exact captured blobs. Current implementation files and assertions are unchanged. Import and proven fixture/resource URL locators are ported to this repository; no cross-repository private source imports or compatibility path shims are added.

Mechanical source-test baseline `9895b6b819947e9e9a8a01bcad747d96214c7f97`; merge `fab353672bb0404c8794eb26033850d4c438b0dc`. Private phase44 preserves earlier paths, explicit copy boundaries and source-to-result commit/ref maps. The locator-normalized complete AST is unchanged, not just selected assertions.

Run `npm run test:reference`. This is Node unit/reference qualification of the retained domain modules, not browser/worker/kernel/renderer/storage/authentication/human-agent acceptance. Current app hosting/build and shared-operation integration gates remain separately open.

Captured baseline and current port: 6 pass, 0 fail, 0 cancelled, 0 skipped across 6 reported Node subtests. Top-level assertion-only files count as one reported Node subtest, not individual assertions.
