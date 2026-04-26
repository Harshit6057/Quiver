import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFollowAction, computeReadReceiptLabel, shouldCreateNotification } from '../socialFlowModel.js';

test('private account follow creates request instead of follow', () => {
  const result = applyFollowAction({ isPrivateAccount: true, hasExistingFollow: false, hasPendingRequest: false });
  assert.equal(result.action, 'request');
  assert.equal(result.following, false);
  assert.equal(result.requested, true);
});

test('public account follow toggles directly', () => {
  const result = applyFollowAction({ isPrivateAccount: false, hasExistingFollow: false, hasPendingRequest: false });
  assert.equal(result.action, 'follow');
  assert.equal(result.following, true);
});

test('chat read receipt label is Read when multiple readers exist', () => {
  assert.equal(computeReadReceiptLabel({ readByCount: 2, isMine: true }), 'Read');
  assert.equal(computeReadReceiptLabel({ readByCount: 1, isMine: true }), 'Sent');
});

test('notification preference gate prevents disabled message notifications', () => {
  const shouldSend = shouldCreateNotification({
    type: 'message',
    preferences: { messages_enabled: false }
  });
  assert.equal(shouldSend, false);
});
