import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authApi } from '../src/cp/api';

describe('pending Codeforces proof', () => {
  it('loads a pending account proof endpoint and renders copy/select instructions independently of linking', () => {
    const ui = readFileSync(new URL('../src/ui/codeforge-dialog.ts', import.meta.url), 'utf8');
    expect(ui).toContain('authApi.pendingJudgeProof(account.id)');
    expect(ui).toContain('data-proof-token readonly');
    expect(ui).toContain('data-copy-proof>Copy proof token</button>');
    expect(ui).toContain('First Name');
    expect(ui).toContain('proofLoading ?');
    expect(ui).toContain('proofError ?');
    expect(ui).toContain('pendingProof.session === session');
  });
  it('exposes the owner-scoped pending proof GET API', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      expect(String(input)).toContain('/auth/judge-accounts/account%2Fid/pending-proof');
      return new Response(JSON.stringify({ verification_token: 'proof-123' }), { status: 200 });
    };
    try { await expect(authApi.pendingJudgeProof('account/id')).resolves.toEqual({ verification_token: 'proof-123' }); }
    finally { globalThis.fetch = originalFetch; }
  });
});
