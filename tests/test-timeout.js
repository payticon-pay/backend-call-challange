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
  console.log("🧪 Testing timeout functionality...");
  
  // Test 1: Health check
  try {
    const healthResponse = await client.get('/health');
    console.log("✅ Health check passed:", healthResponse.status);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return;
  }

  // Test 2: Create session
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
  
  // Test 3: Voice endpoint with timeout parameters
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
    
    // Sprawdź czy parametry timeout są obecne
    const responseText = voiceResponse.data;
    if (responseText.includes('timeout="30"')) {
      console.log("✅ Timeout 30 seconds set");
    } else {
      console.log("❌ Timeout not set");
    }
    
    if (responseText.includes('finishOnKey="#"')) {
      console.log("✅ DTMF finishOnKey set");
    } else {
      console.log("❌ DTMF finishOnKey not set");
    }
    
    if (responseText.includes('speechModel="phone_call"')) {
      console.log("✅ Phone call speech model set");
    } else {
      console.log("❌ Speech model not set");
    }
    
    if (responseText.includes('actionOnEmptyResult="/timeout"')) {
      console.log("✅ Timeout action set");
    } else {
      console.log("❌ Timeout action not set");
    }
    
  } catch (error) {
    console.log("❌ Voice endpoint failed:", error.message);
  }
  
  // Test 4: Timeout endpoint
  try {
    const timeoutResponse = await client.post('/timeout',
      `From=${encodeURIComponent(PHONE)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Timeout endpoint working");
    
    if (timeoutResponse.data.includes("Czas na wypowiedzenie kodu PIN wygasł")) {
      console.log("✅ Correct timeout message");
    } else {
      console.log("❌ Wrong timeout message");
    }
    
  } catch (error) {
    console.log("❌ Timeout endpoint failed:", error.message);
  }
  
  // Test 5: Verify endpoint with timeout parameters
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
    
    // Sprawdź czy parametry timeout są obecne w ponownej próbie
    const responseText = verifyResponse.data;
    if (responseText.includes('timeout="30"')) {
      console.log("✅ Retry timeout 30 seconds set");
    } else {
      console.log("❌ Retry timeout not set");
    }
    
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
  }
  
  console.log("\n🎯 Timeout testing completed!");
  console.log("\n📋 Summary of timeout features:");
  console.log("• 30 seconds timeout for speech input");
  console.log("• Auto speech timeout after speaking");
  console.log("• Phone call speech model");
  console.log("• Redirect to /timeout on empty result");
  console.log("• Proper timeout message in Polish");
}

main();
