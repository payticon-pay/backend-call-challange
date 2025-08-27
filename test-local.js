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
  console.log("🧪 Testing local application...");
  
  // Test 1: Health check
  try {
    const healthResponse = await client.get('/health');
    console.log("✅ Health check passed:", healthResponse.status);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
  }

  // Test 2: Create session
  try {
    const sessionResponse = await client.post('/session', {
      phone: PHONE,
      url: "https://httpbin.org/post",
      secret: "test-secret"
    });
    console.log("✅ Session created:", sessionResponse.data.id);
    
    // Test 3: Voice endpoint
    const voiceResponse = await client.post('/voice', 
      `From=${encodeURIComponent(PHONE)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Voice endpoint response received");
    console.log("📞 Response:", voiceResponse.data.substring(0, 100) + "...");
    
    // Test 4: Verify with correct code
    const verifyResponse = await client.post('/verify',
      `From=${encodeURIComponent(PHONE)}&SpeechResult=123456&Confidence=0.9`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Verification completed");
    console.log("🔐 Response:", verifyResponse.data.substring(0, 100) + "...");
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

main();
