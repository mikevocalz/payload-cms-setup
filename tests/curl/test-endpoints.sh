#!/bin/bash
#
# cURL Tests for Canonical API Endpoints
#
# Usage:
#   export BASE="https://payload-cms-setup-gray.vercel.app"
#   export TOKEN="your_jwt_token"
#   ./tests/curl/test-endpoints.sh
#

BASE="${BASE:-https://payload-cms-setup-gray.vercel.app}"
TOKEN="${TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: TOKEN environment variable required"
  echo "Usage: TOKEN=your_jwt_token ./test-endpoints.sh"
  exit 1
fi

echo "=========================================="
echo "API Contract Tests - cURL"
echo "BASE: $BASE"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✓ PASS${NC}: $1"; }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; }

# ==========================================
# FOLLOW TESTS
# ==========================================
echo -e "\n--- Follow Tests ---"

# Follow user 1
echo "POST /api/users/follow (follow)"
RESP=$(curl -s -X POST "$BASE/api/users/follow" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"followingId":"1"}')
echo "$RESP" | grep -q '"following":true' && pass "Follow returns following:true" || fail "Follow response: $RESP"

# Follow again (idempotent)
echo "POST /api/users/follow (idempotent)"
RESP=$(curl -s -X POST "$BASE/api/users/follow" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"followingId":"1"}')
echo "$RESP" | grep -q '"following":true' && pass "Follow twice still returns following:true" || fail "Idempotent follow: $RESP"

# Unfollow
echo "DELETE /api/users/follow (unfollow)"
RESP=$(curl -s -X DELETE "$BASE/api/users/follow" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"followingId":"1"}')
echo "$RESP" | grep -q '"following":false' && pass "Unfollow returns following:false" || fail "Unfollow response: $RESP"

# Unfollow again (idempotent)
echo "DELETE /api/users/follow (idempotent)"
RESP=$(curl -s -X DELETE "$BASE/api/users/follow" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"followingId":"1"}')
echo "$RESP" | grep -q '"following":false' && pass "Unfollow twice still returns following:false" || fail "Idempotent unfollow: $RESP"

# ==========================================
# LIKE TESTS
# ==========================================
echo -e "\n--- Like Tests ---"

# Like post 1 (assuming it exists)
echo "POST /api/posts/1/like"
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE/api/posts/1/like" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Like endpoint exists (status: $STATUS)" || fail "Like endpoint returned 404"

# Unlike post 1
echo "DELETE /api/posts/1/like"
RESP=$(curl -s -w "%{http_code}" -X DELETE "$BASE/api/posts/1/like" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Unlike endpoint exists (status: $STATUS)" || fail "Unlike endpoint returned 404"

# Like state
echo "GET /api/posts/1/like-state"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/posts/1/like-state" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Like-state endpoint exists (status: $STATUS)" || fail "Like-state endpoint returned 404"

# ==========================================
# BOOKMARK TESTS
# ==========================================
echo -e "\n--- Bookmark Tests ---"

# Bookmark post 1
echo "POST /api/posts/1/bookmark"
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE/api/posts/1/bookmark" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Bookmark endpoint exists (status: $STATUS)" || fail "Bookmark endpoint returned 404"

# Unbookmark post 1
echo "DELETE /api/posts/1/bookmark"
RESP=$(curl -s -w "%{http_code}" -X DELETE "$BASE/api/posts/1/bookmark" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Unbookmark endpoint exists (status: $STATUS)" || fail "Unbookmark endpoint returned 404"

# Get bookmarks
echo "GET /api/users/me/bookmarks"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/users/me/bookmarks" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Get bookmarks endpoint exists (status: $STATUS)" || fail "Get bookmarks endpoint returned 404"

# ==========================================
# STORIES TESTS
# ==========================================
echo -e "\n--- Stories Tests ---"

# Get stories
echo "GET /api/stories"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/stories" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Stories endpoint exists (status: $STATUS)" || fail "Stories endpoint returned 404"

# ==========================================
# MESSAGING TESTS
# ==========================================
echo -e "\n--- Messaging Tests ---"

# Create direct conversation
echo "POST /api/conversations/direct"
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE/api/conversations/direct" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"1"}')
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Create direct endpoint exists (status: $STATUS)" || fail "Create direct endpoint returned 404"

# Get conversations
echo "GET /api/conversations?box=inbox"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/conversations?box=inbox" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Get conversations endpoint exists (status: $STATUS)" || fail "Get conversations endpoint returned 404"

echo "GET /api/conversations?box=spam"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/conversations?box=spam" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Get spam conversations endpoint exists (status: $STATUS)" || fail "Get spam conversations endpoint returned 404"

# ==========================================
# NOTIFICATIONS & BADGES TESTS
# ==========================================
echo -e "\n--- Notifications & Badges Tests ---"

# Get notifications
echo "GET /api/notifications"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/notifications" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Notifications endpoint exists (status: $STATUS)" || fail "Notifications endpoint returned 404"

# Get badges
echo "GET /api/badges"
RESP=$(curl -s "$BASE/api/badges" -H "Authorization: JWT $TOKEN")
echo "$RESP" | grep -q '"notificationsUnread"' && pass "Badges returns notificationsUnread" || fail "Badges response: $RESP"
echo "$RESP" | grep -q '"messagesUnread"' && pass "Badges returns messagesUnread" || fail "Badges response: $RESP"

# Register device
echo "POST /api/devices/register"
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE/api/devices/register" \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-curl","expoPushToken":"ExponentPushToken[test]","platform":"ios"}')
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Register device endpoint exists (status: $STATUS)" || fail "Register device endpoint returned 404"

# ==========================================
# PROFILE TESTS
# ==========================================
echo -e "\n--- Profile Tests ---"

# Get profile
echo "GET /api/users/1/profile"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/users/1/profile" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Profile endpoint exists (status: $STATUS)" || fail "Profile endpoint returned 404"

# Get user posts
echo "GET /api/users/1/posts"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/users/1/posts" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "User posts endpoint exists (status: $STATUS)" || fail "User posts endpoint returned 404"

# Get follow state
echo "GET /api/users/1/follow-state"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/users/1/follow-state" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Follow state endpoint exists (status: $STATUS)" || fail "Follow state endpoint returned 404"

# ==========================================
# FEED TESTS
# ==========================================
echo -e "\n--- Feed Tests ---"

# Get feed
echo "GET /api/posts/feed"
RESP=$(curl -s -w "%{http_code}" "$BASE/api/posts/feed" \
  -H "Authorization: JWT $TOKEN")
STATUS="${RESP: -3}"
[ "$STATUS" != "404" ] && pass "Feed endpoint exists (status: $STATUS)" || fail "Feed endpoint returned 404"

echo -e "\n=========================================="
echo "Tests Complete"
echo "=========================================="
