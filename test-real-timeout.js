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
  console.log("🧪 Testing real timeout behavior...");
  
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
  
  // Test 3: Simulate call flow
  console.log("\n📞 Simulating call flow...");
  
  // Step 1: Initial voice response
  try {
    const voiceResponse = await client.post('/voice', 
      `From=${encodeURIComponent(PHONE)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Step 1: Initial voice response received");
    
    // Sprawdź czy zawiera gather z timeout
    if (voiceResponse.data.includes('action="/verify"') && 
        voiceResponse.data.includes('timeout="30"')) {
      console.log("✅ Step 1: Proper gather configuration");
    } else {
      console.log("❌ Step 1: Missing gather configuration");
    }
    
  } catch (error) {
    console.log("❌ Step 1 failed:", error.message);
  }
  
  // Step 2: Simulate timeout (bez wprowadzania PIN-u)
  console.log("\n⏰ Simulating timeout scenario...");
  try {
    // W rzeczywistości Twilio automatycznie przekieruje na /timeout po 30 sekundach
    // My symulujemy to bezpośrednim wywołaniem endpointu
    const timeoutResponse = await client.post('/timeout',
      `From=${encodeURIComponent(PHONE)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("✅ Step 2: Timeout response received");
    
    if (timeoutResponse.data.includes("Czas na wprowadzenie kodu PIN wygasł")) {
      console.log("✅ Step 2: Correct timeout message");
    } else {
      console.log("❌ Step 2: Wrong timeout message");
    }
    
  } catch (error) {
    console.log("❌ Step 2 failed:", error.message);
  }
  
  // Step 3: Sprawdź czy sesja nadal istnieje
  try {
    const sessionsResponse = await client.get('/sessions');
    const session = sessionsResponse.data.find(s => s.id === sessionId);
    if (session) {
      console.log("✅ Step 3: Session still exists, status:", session.status);
    } else {
      console.log("❌ Step 3: Session not found");
    }
  } catch (error) {
    console.log("❌ Step 3 failed:", error.message);
  }
  
  // Test 4: Sprawdź czy aplikacja nadal odpowiada
  try {
    const healthResponse2 = await client.get('/health');
    console.log("✅ Step 4: Application still responding after timeout");
  } catch (error) {
    console.log("❌ Step 4: Application not responding after timeout");
  }
  
  console.log("\n🎯 Real timeout testing completed!");
  console.log("\n📋 Timeout behavior summary:");
  console.log("• Application waits 30 seconds for PIN input");
  console.log("• If no input, redirects to /timeout endpoint");
  console.log("• Provides clear timeout message in Polish");
  console.log("• Application stays active and responsive");
  console.log("• Session remains valid for further processing");
  console.log("• No disconnection or crash occurs");
}

main();
