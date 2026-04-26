export const applyFollowAction = ({ isPrivateAccount, hasExistingFollow, hasPendingRequest }) => {
  if (hasExistingFollow) {
    return { following: false, requested: false, action: 'unfollow' };
  }

  if (isPrivateAccount) {
    if (hasPendingRequest) {
      return { following: false, requested: true, action: 'noop' };
    }
    return { following: false, requested: true, action: 'request' };
  }

  return { following: true, requested: false, action: 'follow' };
};

export const computeReadReceiptLabel = ({ readByCount, isMine }) => {
  if (!isMine) return '';
  return readByCount > 1 ? 'Read' : 'Sent';
};

export const shouldCreateNotification = ({ type, preferences }) => {
  const map = {
    follow: 'follows_enabled',
    follow_request: 'follow_requests_enabled',
    follow_request_accepted: 'follow_requests_enabled',
    follow_request_rejected: 'follow_requests_enabled',
    message: 'messages_enabled'
  };

  const key = map[type];
  if (!key) return true;
  if (!preferences) return true;
  return preferences[key] !== false;
};
