import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sizeFor } from '../src/lib/size';

describe('window size classes', () => {
  it('match the handoff breakpoints', () => {
    assert.equal(sizeFor(390), 'compact');
    assert.equal(sizeFor(599), 'compact');
    assert.equal(sizeFor(600), 'medium');
    assert.equal(sizeFor(839), 'medium');
    assert.equal(sizeFor(840), 'expanded');
    assert.equal(sizeFor(1194), 'expanded');
  });
});
