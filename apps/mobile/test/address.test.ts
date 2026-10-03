import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkAddress, checkPageUrl, tokenFrom } from '../src/lib/address';
import { redirectSystemPath } from '../src/app/+native-intent';

describe('alert addresses', () => {
  it('cleans and checks WhatsApp numbers like the API', () => {
    assert.equal(checkAddress('whatsapp', '+971 50 123 4567'), '+971501234567');
    assert.equal(checkAddress('whatsapp', '00966 (55) 123-4567'), '+966551234567');
    assert.equal(checkAddress('whatsapp', '050 123 4567'), null);
  });

  it('checks email and needs nothing for Telegram', () => {
    assert.equal(checkAddress('email', '  a@example.com '), 'a@example.com');
    assert.equal(checkAddress('email', 'a@b'), null);
    assert.equal(checkAddress('telegram', 'anything'), '');
  });
});

describe('bot check link', () => {
  it('sends the site key and the way back to the check page', () => {
    const u = new URL(checkPageUrl('https://openseat.app', 'key', 'openseat://check', 'ar'));
    assert.equal(u.pathname, '/app-check/');
    assert.equal(u.searchParams.get('k'), 'key');
    assert.equal(u.searchParams.get('to'), 'openseat://check');
    assert.equal(u.searchParams.get('lang'), 'ar');
  });

  it('reads the token from the link back', () => {
    assert.equal(tokenFrom('openseat://check?token=abc.123'), 'abc.123');
    assert.equal(tokenFrom('exp://10.0.0.2:8081/--/check?token=xyz'), 'xyz');
    assert.equal(tokenFrom('openseat://check?error=1'), null);
    assert.equal(tokenFrom(undefined), null);
  });

  it('keeps the router on the current screen for the link back', () => {
    assert.equal(redirectSystemPath({ path: 'openseat://check?token=a', initial: false }), null);
    assert.equal(redirectSystemPath({ path: '/--/check?token=a', initial: false }), null);
    assert.equal(redirectSystemPath({ path: 'openseat://check?token=a', initial: true }), '/');
    assert.equal(redirectSystemPath({ path: '/calendar', initial: false }), '/calendar');
    assert.equal(redirectSystemPath({ path: 'openseat://checkout', initial: false }), 'openseat://checkout');
  });
});
