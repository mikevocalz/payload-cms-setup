/**
 * Avatar Generation Utility
 * 
 * Generates initials-based avatars as PNG images using SVG templates.
 * Uses sharp for SVG-to-PNG conversion (server-side only).
 */

import sharp from 'sharp';

// Avatar colors - vibrant gradient-friendly palette
const AVATAR_COLORS = [
  { bg: '#3EA4E5', fg: '#FFFFFF' }, // Blue
  { bg: '#8A40CF', fg: '#FFFFFF' }, // Purple
  { bg: '#FF5BFC', fg: '#FFFFFF' }, // Pink
  { bg: '#E53E3E', fg: '#FFFFFF' }, // Red
  { bg: '#38A169', fg: '#FFFFFF' }, // Green
  { bg: '#D69E2E', fg: '#FFFFFF' }, // Yellow
  { bg: '#DD6B20', fg: '#FFFFFF' }, // Orange
  { bg: '#319795', fg: '#FFFFFF' }, // Teal
  { bg: '#805AD5', fg: '#FFFFFF' }, // Violet
  { bg: '#E53E3E', fg: '#FFFFFF' }, // Crimson
];

/**
 * Extract initials from a name/username/email
 * 
 * @param input The input string to extract initials from
 * @returns 1-2 character initials
 */
export function extractInitials(input: string): string {
  if (!input || typeof input !== 'string') {
    return '?';
  }

  // Clean the input
  const cleaned = input.trim();
  
  // Handle email - use part before @
  if (cleaned.includes('@')) {
    const localPart = cleaned.split('@')[0];
    return extractInitials(localPart);
  }
  
  // Split by spaces, underscores, dots, or camelCase
  const parts = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
    .split(/[\s._-]+/)
    .filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return cleaned.charAt(0).toUpperCase() || '?';
  }
  
  if (parts.length === 1) {
    // Single word - take first 1-2 characters
    const word = parts[0];
    if (word.length >= 2) {
      return (word.charAt(0) + word.charAt(1)).toUpperCase();
    }
    return word.charAt(0).toUpperCase();
  }
  
  // Multiple words - take first letter of first and last word
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Get a deterministic color based on the input string
 * 
 * @param input String to hash for color selection
 * @returns Color object with bg and fg
 */
export function getColorForString(input: string): { bg: string; fg: string } {
  if (!input) {
    return AVATAR_COLORS[0];
  }
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Generate an SVG avatar string
 * 
 * @param initials The initials to display
 * @param color The color scheme to use
 * @param size The size of the avatar in pixels
 * @returns SVG string
 */
export function generateAvatarSVG(
  initials: string,
  color: { bg: string; fg: string },
  size: number = 256
): string {
  const fontSize = size * 0.4; // 40% of size
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color.bg}" rx="${size * 0.1}"/>
  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="central" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="${color.fg}"
  >${initials}</text>
</svg>`;
}

export interface GenerateAvatarOptions {
  /** Display name of the user */
  displayName?: string;
  /** Username of the user */
  username?: string;
  /** Email of the user */
  email?: string;
  /** Size of the avatar in pixels (default: 256) */
  size?: number;
}

/**
 * Generate a PNG avatar buffer from user data
 * 
 * @param options User data to generate avatar from
 * @returns PNG buffer or null if generation fails
 */
export async function generateAvatarPNG(options: GenerateAvatarOptions): Promise<Buffer | null> {
  try {
    const { displayName, username, email, size = 256 } = options;
    
    // Determine the best source for initials
    const source = displayName || username || email || 'User';
    const initials = extractInitials(source);
    const color = getColorForString(source.toLowerCase());
    
    console.log(`[Avatar] Generating avatar for: ${source} -> "${initials}" with color ${color.bg}`);
    
    // Generate SVG
    const svg = generateAvatarSVG(initials, color, size);
    
    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ quality: 90 })
      .toBuffer();
    
    console.log(`[Avatar] Generated PNG: ${pngBuffer.length} bytes`);
    
    return pngBuffer;
  } catch (error) {
    console.error('[Avatar] Generation failed:', error);
    return null;
  }
}

/**
 * Generate avatar data URL for testing/preview
 * 
 * @param options User data to generate avatar from
 * @returns Data URL string or null
 */
export async function generateAvatarDataURL(options: GenerateAvatarOptions): Promise<string | null> {
  const buffer = await generateAvatarPNG(options);
  if (!buffer) return null;
  
  return `data:image/png;base64,${buffer.toString('base64')}`;
}
