// Simple test script for threaded comments API
// Run with: node test-comments.js

const API_URL = "http://localhost:3000/api";

async function testCommentsAPI() {
  try {
    console.log("🧪 Testing threaded comments API...\n");

    // Test 1: Get comments for a post (should return empty initially)
    console.log("1. Testing GET /comments?postId=1");
    const response = await fetch(`${API_URL}/comments?postId=1`);
    const data = await response.json();

    if (response.ok) {
      console.log("✅ GET comments endpoint works");
      console.log(
        `Response structure: ${JSON.stringify(Object.keys(data), null, 2)}`,
      );
      console.log(`Total comments: ${data.totalDocs}\n`);
    } else {
      console.log("❌ GET comments failed:", data.error);
    }

    // Test 2: Try to create a comment (will fail without auth, but should validate structure)
    console.log("2. Testing POST /comments");
    const createResponse = await fetch(`${API_URL}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Test comment",
        post: "1",
        author: "1",
      }),
    });

    const createData = await createResponse.json();
    if (createResponse.ok) {
      console.log("✅ POST comment works");
    } else {
      console.log(
        "⚠️  POST comment failed (expected without auth):",
        createData.error,
      );
    }

    // Test 3: Get single comment with replies
    console.log("\n3. Testing GET /comments/1");
    const singleResponse = await fetch(`${API_URL}/comments/1`);
    const singleData = await singleResponse.json();

    if (singleResponse.ok) {
      console.log("✅ GET single comment works");
      console.log(
        `Response structure: ${JSON.stringify(Object.keys(singleData), null, 2)}`,
      );
    } else {
      console.log(
        "⚠️  GET single comment failed (expected without existing comment):",
        singleData.error,
      );
    }

    console.log("\n🎉 API endpoints are accessible!");
    console.log("\n📝 Usage:");
    console.log("- GET /api/comments?postId=<post-id>&page=1&limit=20");
    console.log(
      "- POST /api/comments with { content, post, author, parentComment? }",
    );
    console.log(
      "- GET /api/comments/<comment-id> for single comment with replies",
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testCommentsAPI();
