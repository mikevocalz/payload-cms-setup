/**
 * Payload v3 Custom Endpoints Index
 * 
 * All endpoints are registered in payload.config.ts
 */

// Follow
export {
  followEndpoint,
  unfollowEndpoint,
  checkFollowEndpoint,
} from "./follow";

// Likes
export {
  likePostEndpoint,
  unlikePostEndpoint,
  likeStateEndpoint,
  likeCommentEndpoint,
  unlikeCommentEndpoint,
} from "./likes";

// Bookmarks
export {
  bookmarkPostEndpoint,
  unbookmarkPostEndpoint,
  getUserBookmarksEndpoint,
  checkBookmarkStateEndpoint,
} from "./bookmarks";

// Profiles
export {
  getUserProfileEndpoint,
  updateOwnProfileEndpoint,
  updateAvatarEndpoint,
  getUserPostsEndpoint,
  getFollowStateEndpoint,
} from "./profiles";

// Posts
export {
  createPostEndpoint,
  getFeedEndpoint,
  getPostEndpoint,
  updatePostEndpoint,
  deletePostEndpoint,
} from "./posts";

// Comments
export {
  createCommentEndpoint,
  getCommentsEndpoint,
} from "./comments";

// Stories
export {
  createStoryEndpoint,
  getStoriesEndpoint,
  viewStoryEndpoint,
  replyToStoryEndpoint,
} from "./stories";

// Messaging
export {
  createDirectConversationEndpoint,
  createGroupConversationEndpoint,
  getConversationsEndpoint,
  getMessagesEndpoint,
  sendMessageEndpoint,
  markConversationReadEndpoint,
} from "./messaging";

// Notifications & Badges
export {
  getNotificationsEndpoint,
  markNotificationReadEndpoint,
  registerDeviceEndpoint,
  getBadgesEndpoint,
} from "./notifications";
