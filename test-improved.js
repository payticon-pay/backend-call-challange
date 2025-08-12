import axios from "axios";

const URL = "http://localhost:3000";
const TOKEN = "test-api-key-123"
const PHONE = "+48123456789"

const client = axios.create({
    baseURL: URL,
    headers: {
        'x-api-key': TOKEN
    }
})

async function main() {
  console.log("🧪 Testing improved application...");
  
  // Test 1: Health check
  try {
    const healthResponse = await client.get('/health');
    console.log("✅ Health check passed:", healthResponse.status);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return;
  }

  // Test 2: Validation - missing fields
  try {
    await client.post('/session', {
      phone: "",
      url: "https://httpbin.org/post"
      // missing secret
    });
    console.log("❌ Should have failed validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation working - missing fields rejected");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 3: Validation - invalid phone
  try {
    await client.post('/session', {
      phone: "123",
      url: "https://httpbin.org/post",
      secret: "test-secret"
    });
    console.log("❌ Should have failed phone validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation working - invalid phone rejected");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 4: Validation - invalid URL
  try {
    await client.post('/session', {
      phone: PHONE,
      url: "invalid-url",
      secret: "test-secret"
    });
    console.log("❌ Should have failed URL validation");
  } catch (error) {
    if (error.response?.status === 400) {
      console.log("✅ Validation working - invalid URL rejected");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 5: Create valid session
  let sessionId;
  try {
    const sessionResponse = await client.post('/session', {
      phone: PHONE,
      url: "https://httpbin.org/post",
      secret: "test-secret"
    });
    sessionId = sessionResponse.data.id;
    console.log("✅ Session created:", sessionId);
  } catch (error) {
    console.log("❌ Session creation failed:", error.message);
    return;
  }
  
  // Test 6: Check sessions endpoint
  try {
    const sessionsResponse = await client.get('/sessions');
    console.log("✅ Sessions endpoint working, count:", sessionsResponse.data.length);
  } catch (error) {
    console.log("❌ Sessions endpoint failed:", error.message);
  }
  
  // Test 7: Voice endpoint
  try {
    const voiceResponse = await client.post('/voice', 
      `From=${encodeURIComponent(PHONE)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Voice endpoint response received");
    if (voiceResponse.data.includes("Witaj w pejtikon")) {
      console.log("✅ Correct welcome message");
    } else {
      console.log("❌ Wrong welcome message");
    }
  } catch (error) {
    console.log("❌ Voice endpoint failed:", error.message);
  }
  
  // Test 8: Verify endpoint
  try {
    const verifyResponse = await client.post('/verify',
      `From=${encodeURIComponent(PHONE)}&Digits=123456`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Verification completed");
    if (verifyResponse.data.includes("Kod niepoprawny")) {
      console.log("✅ Correct verification response (httpbin returns 200)");
    } else {
      console.log("❌ Unexpected verification response");
    }
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
  }
  
  // Test 9: Check final session status
  try {
    const sessionsResponse = await client.get('/sessions');
    const session = sessionsResponse.data.find(s => s.id === sessionId);
    if (session) {
      console.log("✅ Session status:", session.status);
    } else {
      console.log("❌ Session not found");
    }
  } catch (error) {
    console.log("❌ Final session check failed:", error.message);
  }
  
  console.log("\n🎯 Testing completed!");
}

main();
