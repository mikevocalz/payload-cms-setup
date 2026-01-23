/**
 * Expo API Client for Payload CMS
 * Copy this to your Expo app and configure the API_URL
 *
 * TWO AUTH OPTIONS:
 * 1. API Key (recommended for mobile apps) - set once, persists
 * 2. JWT Token (from login) - expires, needs refresh
 */

const API_URL = "https://payload-cms-setup-gray.vercel.app/api";

type AuthResponse = {
  user: any;
  token: string;
  exp: number;
};

class PayloadAPI {
  private token: string | null = null;
  private apiKey: string | null = null;

  // Use API Key (recommended for mobile apps)
  // Get this from: Admin Panel → Users → Your User → API Key section
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Use JWT token (from login)
  setToken(token: string) {
    this.token = token;
  }

  clearAuth() {
    this.token = null;
    this.apiKey = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      // API Key takes precedence over JWT
      ...(this.apiKey && { Authorization: `users API-Key ${this.apiKey}` }),
      ...(!this.apiKey && this.token && { Authorization: `JWT ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || "API request failed");
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async signup(email: string, password: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>("/users", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async logout(): Promise<void> {
    await this.request("/users/logout", { method: "POST" });
    this.clearAuth();
  }

  async getMe(): Promise<any> {
    return this.request("/users/me");
  }

  // Generic CRUD
  async find<T>(
    collection: string,
    query?: Record<string, any>,
  ): Promise<{ docs: T[]; totalDocs: number }> {
    const params = query ? `?${new URLSearchParams(query as any)}` : "";
    return this.request(`/${collection}${params}`);
  }

  async findById<T>(collection: string, id: string | number): Promise<T> {
    return this.request(`/${collection}/${id}`);
  }

  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    return this.request(`/${collection}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update<T>(
    collection: string,
    id: string | number,
    data: Partial<T>,
  ): Promise<T> {
    return this.request(`/${collection}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(collection: string, id: string | number): Promise<void> {
    return this.request(`/${collection}/${id}`, { method: "DELETE" });
  }

  // Comments API
  async getPostComments(
    postId: string,
    query?: Record<string, any>,
  ): Promise<{
    docs: any[];
    totalDocs: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const params = query ? `&${new URLSearchParams(query as any)}` : "";
    return this.request(`/comments?postId=${postId}${params}`);
  }

  async getCommentWithReplies(commentId: string): Promise<any> {
    return this.request(`/comments/${commentId}`);
  }

  async createComment(data: {
    content: string;
    post: string;
    author: string;
    parentComment?: string;
  }): Promise<any> {
    return this.request("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Bookmarks API
  async getBookmarks(query?: {
    limit?: number;
    page?: number;
    sort?: string;
  }): Promise<{
    docs: any[];
    totalDocs: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const params = query ? `?${new URLSearchParams(query as any)}` : "";
    return this.request(`/bookmarks${params}`);
  }

  async toggleBookmark(
    postId: string,
  ): Promise<{ bookmarked: boolean; bookmark?: any }> {
    try {
      // Check if bookmark already exists
      const existing = await this.request<{ docs: any[] }>(
        `/bookmarks?where[post][equals]=${postId}&limit=1`,
      );

      if (existing.docs.length > 0) {
        // Remove bookmark
        await this.delete("bookmarks", existing.docs[0].id);
        return { bookmarked: false };
      } else {
        // Create bookmark
        const bookmark = await this.create("bookmarks", { post: postId });
        return { bookmarked: true, bookmark };
      }
    } catch (error) {
      throw new Error(
        `Failed to toggle bookmark: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isBookmarked(postId: string): Promise<boolean> {
    try {
      const result = await this.request<{ docs: any[] }>(
        `/bookmarks?where[post][equals]=${postId}&limit=1`,
      );
      return result.docs.length > 0;
    } catch (error) {
      // If request fails, assume not bookmarked for offline functionality
      return false;
    }
  }
}

export const api = new PayloadAPI();

// Usage examples:
/*
import { api } from './expo-api-client';

// Login
const { user, token } = await api.login('user@example.com', 'password');

// Get posts
const { docs: posts } = await api.find('posts', { limit: 10 });

// Create a post
const newPost = await api.create('posts', { title: 'Hello', content: '...' });

// Get user profile
const profile = await api.findById('profiles', user.id);

// Bookmark operations
const { bookmarked } = await api.toggleBookmark('post-id-here');
const isBookmarked = await api.isBookmarked('post-id-here');
const { docs: bookmarkedPosts } = await api.getBookmarks({ limit: 20 });

// Get threaded comments for a post
const { docs: comments } = await api.getPostComments('post-id-here', { 
  limit: 20, 
  page: 1 
});

// Each comment includes its replies:
comments.forEach(comment => {
  console.log('Comment:', comment.content);
  console.log('Author:', comment.author.name);
  console.log('Replies:', comment.replies.length);
  
  comment.replies.forEach(reply => {
    console.log('Reply:', reply.content);
    console.log('Reply Author:', reply.author.name);
  });
});

// Create a top-level comment on a post
const topLevelComment = await api.createComment({
  content: 'Great post!',
  post: 'post-id-here',
  author: user.id,
});

// Create a reply to a comment (threaded)
const replyComment = await api.createComment({
  content: 'I agree with your comment!',
  post: 'post-id-here',
  author: user.id,
  parentComment: topLevelComment.id, // This creates a threaded reply
});

// Get a single comment with its replies
const commentWithReplies = await api.getCommentWithReplies('comment-id-here');
console.log('Comment:', commentWithReplies.content);
console.log('Replies:', commentWithReplies.replies);
*/
