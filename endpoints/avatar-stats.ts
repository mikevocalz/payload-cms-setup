/**
 * Avatar Statistics Endpoint
 * 
 * Provides counts of users with/without avatars for verification.
 * 
 * GET /api/avatar-stats
 * Returns: { total, withAvatar, withoutAvatar, percentage }
 */

import type { PayloadHandler } from 'payload';

export const getAvatarStats: PayloadHandler = async (req) => {
  try {
    const { payload } = req;

    // Count total users
    const totalResult = await payload.count({
      collection: 'users',
    });

    // Count users WITH avatarUrl
    const withAvatarResult = await payload.count({
      collection: 'users',
      where: {
        and: [
          { avatarUrl: { exists: true } },
          { avatarUrl: { not_equals: null } },
          { avatarUrl: { not_equals: '' } },
        ],
      },
    });

    // Count users WITHOUT avatarUrl
    const withoutAvatarResult = await payload.count({
      collection: 'users',
      where: {
        or: [
          { avatarUrl: { equals: null } },
          { avatarUrl: { equals: '' } },
          { avatarUrl: { exists: false } },
        ],
      },
    });

    const total = totalResult.totalDocs;
    const withAvatar = withAvatarResult.totalDocs;
    const withoutAvatar = withoutAvatarResult.totalDocs;
    const percentage = total > 0 ? Math.round((withAvatar / total) * 100) : 0;

    return Response.json({
      success: true,
      stats: {
        total,
        withAvatar,
        withoutAvatar,
        percentage,
        message: withoutAvatar === 0 
          ? '✓ All users have avatars!' 
          : `${withoutAvatar} users need avatar backfill`,
      },
    });
  } catch (error: any) {
    console.error('[avatar-stats] Error:', error);
    return Response.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
};

/**
 * List users without avatars (for debugging)
 * 
 * GET /api/avatar-stats/list?limit=10
 */
export const listUsersWithoutAvatar: PayloadHandler = async (req) => {
  try {
    const { payload } = req;
    const url = new URL(req.url || '', 'http://localhost');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const usersResult = await payload.find({
      collection: 'users',
      where: {
        or: [
          { avatarUrl: { equals: null } },
          { avatarUrl: { equals: '' } },
          { avatarUrl: { exists: false } },
        ],
      },
      limit,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return Response.json({
      success: true,
      count: usersResult.totalDocs,
      showing: usersResult.docs.length,
      users: usersResult.docs.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : null,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[avatar-stats/list] Error:', error);
    return Response.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
};
