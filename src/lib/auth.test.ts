import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSignUpData } from './auth';

test('accepts valid sign-up payload', () => {
  const result = validateSignUpData({
    name: 'Ana Ribeiro',
    email: 'ana@exemplo.com',
    password: 'SenhaForte123!',
  });

  assert.deepEqual(result, {
    ok: true,
    normalizedName: 'Ana Ribeiro',
  });
});

test('rejects blank name', () => {
  const result = validateSignUpData({
    name: '   ',
    email: 'ana@exemplo.com',
    password: 'SenhaForte123!',
  });

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /nome/i);
});

test('rejects weak password', () => {
  const result = validateSignUpData({
    name: 'Ana Ribeiro',
    email: 'ana@exemplo.com',
    password: '123',
  });

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /senha/i);
});
