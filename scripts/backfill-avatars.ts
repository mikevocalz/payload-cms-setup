/**
 * Backfill Avatars Script
 * 
 * Generates and uploads avatars for all users with null/empty avatarUrl.
 * 
 * USAGE:
 *   npx ts-node scripts/backfill-avatars.ts
 *   
 * Or with pnpm:
 *   pnpm tsx scripts/backfill-avatars.ts
 * 
 * OPTIONS:
 *   --dry-run     Preview changes without uploading
 *   --limit=N     Process only N users (for testing)
 *   --batch=N     Process N users per batch (default: 10)
 */

import { getPayload } from 'payload';
import config from '../payload.config';
import { generateAvatarPNG } from '../lib/bunny/generate-avatar';
import { uploadToBunny, getAvatarPath } from '../lib/bunny/upload';

// Parse CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || Infinity;
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '10');

// Rate limiting - delay between batches (ms)
const BATCH_DELAY_MS = 2000;

interface BackfillStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const stats: BackfillStats = {
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

/**
 * Generate and upload avatar for a single user
 */
async function processUser(
  payload: any,
  user: any,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Skip if user already has avatarUrl
    if (user.avatarUrl && user.avatarUrl.length > 0) {
      return { success: true, url: user.avatarUrl };
    }

    const displayName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.username || user.email;

    console.log(`  [${user.id}] Generating avatar for: ${displayName}`);

    if (DRY_RUN) {
      console.log(`  [${user.id}] DRY RUN - would generate avatar`);
      return { success: true, url: 'DRY_RUN' };
    }

    // Generate PNG avatar
    const pngBuffer = await generateAvatarPNG({
      displayName,
      username: user.username,
      email: user.email,
    });

    if (!pngBuffer) {
      return { success: false, error: 'Avatar generation failed - null buffer' };
    }

    // Upload to Bunny CDN
    const avatarPath = getAvatarPath(user.id);
    const uploadResult = await uploadToBunny({
      path: avatarPath,
      buffer: pngBuffer,
      contentType: 'image/png',
    });

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    // Update user in database
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { avatarUrl: uploadResult.url } as any,
    });

    console.log(`  [${user.id}] ✓ Avatar uploaded: ${uploadResult.url}`);
    return { success: true, url: uploadResult.url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main backfill function
 */
async function backfillAvatars() {
  console.log('='.repeat(60));
  console.log('AVATAR BACKFILL SCRIPT');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT === Infinity ? 'None' : LIMIT}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log('='.repeat(60));

  // Initialize Payload
  console.log('\nInitializing Payload...');
  const payload = await getPayload({ config });
  console.log('Payload initialized.\n');

  // Count users needing avatars
  const countResult = await payload.count({
    collection: 'users',
    where: {
      or: [
        { avatarUrl: { equals: null } },
        { avatarUrl: { equals: '' } },
        { avatarUrl: { exists: false } },
      ],
    },
  });

  stats.total = Math.min(countResult.totalDocs, LIMIT);
  console.log(`Found ${countResult.totalDocs} users without avatarUrl`);
  console.log(`Will process: ${stats.total} users\n`);

  if (stats.total === 0) {
    console.log('No users need avatar backfill. Done!');
    return;
  }

  // Process users in batches
  let page = 1;
  let hasMore = true;

  while (hasMore && stats.processed < stats.total) {
    const remaining = stats.total - stats.processed;
    const batchLimit = Math.min(BATCH_SIZE, remaining);

    console.log(`\n--- Batch ${page} (${batchLimit} users) ---`);

    const usersResult = await payload.find({
      collection: 'users',
      where: {
        or: [
          { avatarUrl: { equals: null } },
          { avatarUrl: { equals: '' } },
          { avatarUrl: { exists: false } },
        ],
      },
      limit: batchLimit,
      page: 1, // Always page 1 since we're updating and they disappear from results
    });

    if (usersResult.docs.length === 0) {
      hasMore = false;
      break;
    }

    // Process each user in the batch
    for (const user of usersResult.docs) {
      if (stats.processed >= stats.total) break;

      stats.processed++;
      const result = await processUser(payload, user);

      if (result.success) {
        if (result.url === user.avatarUrl) {
          stats.skipped++;
        } else {
          stats.success++;
        }
      } else {
        stats.failed++;
        stats.errors.push(`User ${user.id}: ${result.error}`);
        console.error(`  [${user.id}] ✗ Failed: ${result.error}`);
      }
    }

    // Rate limiting between batches
    if (stats.processed < stats.total) {
      console.log(`\nWaiting ${BATCH_DELAY_MS}ms before next batch...`);
      await sleep(BATCH_DELAY_MS);
    }

    page++;
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('BACKFILL COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total processed: ${stats.processed}`);
  console.log(`  Success: ${stats.success}`);
  console.log(`  Skipped (already had avatar): ${stats.skipped}`);
  console.log(`  Failed: ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('='.repeat(60));
}

// Run the script
backfillAvatars()
  .then(() => {
    console.log('\nBackfill script finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nBackfill script failed:', error);
    process.exit(1);
  });
