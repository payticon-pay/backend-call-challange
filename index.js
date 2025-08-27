import axios from 'axios';
import parser from 'body-parser';
import { randomUUID } from 'crypto';
import express from 'express';
import pkg from 'twilio';
const { VoiceResponse } = pkg.twiml;

const TOKEN = process.env.API_KEY
const app = express();
const sessions = [];
const twimlOptions = {language: 'pl-PL'}

// Funkcja do czyszczenia starych sesji (starszych niż 1 godzina) oraz zweryfikowanych sesji
function cleanupOldSessions() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const initialLength = sessions.length;
  
  // Log wszystkich sesji przed cleanup
  console.log(`Cleanup: ${sessions.length} sessions before cleanup`);
  sessions.forEach(s => {
    console.log(`  - Session ${s.id}: ${s.phone}, status: ${s.status}, created: ${s.createdAt}`);
  });
  
  // Usuń sesje zweryfikowane oraz starsze niż 1 godzina
  const filteredSessions = sessions.filter(session => {
    if (session.status === "verified") {
      console.log(`Cleanup: Removing verified session ${session.id} (${session.phone})`);
      return false;
    }
    if (session.createdAt <= oneHourAgo) {
      console.log(`Cleanup: Removing old session ${session.id} (${session.phone}) - created ${session.createdAt}`);
      return false;
    }
    return true;
  });
  
  sessions.length = 0;
  sessions.push(...filteredSessions);
  
  if (initialLength !== sessions.length) {
    console.log(`Cleanup: Removed ${initialLength - sessions.length} sessions. ${sessions.length} sessions remaining`);
  } else {
    console.log(`Cleanup: No sessions removed. ${sessions.length} sessions remaining`);
  }
}

// Czyszczenie sesji co 30 minut
setInterval(cleanupOldSessions, 30 * 60 * 1000);

app.get("/health", (_, res) => res.end())

app.get("/sessions", auth, (_, res) => {
  res.json(sessions.map(s => ({id: s.id, phone: s.phone, status: s.status, createdAt: s.createdAt})));
});

app.post('/session', auth, parser.json(), (request, response) => {
  const {phone, url, secret} = request.body;
  
  // Walidacja danych wejściowych
  if (!phone || !url || !secret) {
    return response.status(400).json({
      error: "Missing required fields: phone, url, secret"
    });
  }
  
  // Walidacja formatu numeru telefonu (podstawowa)
  if (!phone.startsWith('+') || phone.length < 8) {
    return response.status(400).json({
      error: "Invalid phone number format. Must start with + and be at least 8 characters"
    });
  }
  
  // Walidacja URL
  try {
    new URL(url);
  } catch (error) {
    return response.status(400).json({
      error: "Invalid URL format"
    });
  }
  
  const id = randomUUID();
  sessions.push({id, phone, url, status: "pending", secret, createdAt: new Date()});
  console.log(`Session created for ${phone} ${id}`);
  response.json({id});
});

app.post('/voice', parser.urlencoded({ extended: false }), (request, response) => {
  const twiml = new VoiceResponse();
  const from = request.body.From;
  
  if (!from) {
    return response.status(400).send('Missing From parameter');
  }
  
  const session = sessions.find(s => s.phone === from);

  if (!session) {
   twiml.say(twimlOptions,"Dla numeru, z którego dzwonisz, nie ma aktywnej transakcji do płatności.")
   console.log("Number rejected ", from)
  } else {
    twiml.say(twimlOptions, "Witaj w pejtikon kropka kom. Rozpoczynasz zakupy kart podarunkowych w usludze \"Place z Play\". Wypowiedz kod PIN z SMS-a.")
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30, // 30 sekund na wypowiedzenie PIN-u
      speechTimeout: 'auto', // Automatyczny timeout po zakończeniu wypowiedzi
      speechModel: 'phone_call', // Model optymalizowany dla rozmów telefonicznych
      language: 'pl-PL', // Język polski
      actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
    });
  }
  
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/verify', parser.urlencoded({ extended: false }), async (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;
  const speechResult = req.body.SpeechResult;
  const confidence = req.body.Confidence;
  
  console.log(`[INFO] PIN verification started - Phone: ${from}, Speech: "${speechResult}", Confidence: ${confidence}`);
  
  if (!from || !speechResult) {
    console.log(`[ERROR] Missing parameters - From: ${from}, Speech: ${speechResult}`);
    return res.status(400).send('Missing From or SpeechResult parameter');
  }
  
  // Wyciągnij cyfry z wypowiedzianego tekstu
  const extractedDigits = speechResult.replace(/[^0-9]/g, '');
  
  if (!extractedDigits || extractedDigits.length < 4 || extractedDigits.length > 8) {
    console.log(`[WARNING] Invalid PIN format from speech - Phone: ${from}, Original: "${speechResult}" -> Extracted: "${extractedDigits}"`);
    const userMessage = "Nie udało się rozpoznać kodu PIN. Kod musi zawierać od 4 do 8 cyfr. Wypowiedz kod z SMS-a ponownie.";
    console.log(`[WARNING] User message: "${userMessage}"`);
    twiml.say(twimlOptions, userMessage)
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30,
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'pl-PL',
      actionOnEmptyResult: '/timeout'
    });
    res.type('text/xml');
    return res.send(twiml.toString());
  }
  
  // Sprawdź poziom pewności rozpoznania (opcjonalnie)
  if (confidence && parseFloat(confidence) < 0.7) {
    console.log(`[WARNING] Low confidence in speech recognition - Phone: ${from}, Confidence: ${confidence}, Extracted: "${extractedDigits}"`);
    const userMessage = "Kod został rozpoznany z niską pewnością. Wypowiedz kod z SMS-a ponownie wyraźnie.";
    console.log(`[WARNING] User message: "${userMessage}"`);
    twiml.say(twimlOptions, userMessage)
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30,
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'pl-PL',
      actionOnEmptyResult: '/timeout'
    });
    res.type('text/xml');
    return res.send(twiml.toString());
  }
  
  const session = sessions.find(s => s.phone === from);
  if (!session) {
    console.log(`[ERROR] Session not found for phone: ${from}`);
    return res.status(404).send('Session not found');
  }

  try {
    const response = await axios.post(session.url, {...session, code: extractedDigits}, {
      validateStatus: () => true,
      timeout: 30000 // 30 sekund timeout (zwiększone z 10 sekund)
    });
    
    // Konwertuj status na liczbę i dodaj szczegółowe logi
    const statusCode = parseInt(response.status);
    console.log("Session verification response code:", response.status, "parsed as:", statusCode, "type:", typeof response.status, "session:", session.id);
    console.log("Response data:", response.data);
    
    if (statusCode === 200) {
      // Sprawdź success w odpowiedzi
      if (response.data && response.data.success === true) {
        // PIN OK, płatność OK
        const userMessage = "Kod poprawny. Trwa finalizacja transakcji.";
        console.log(`[SUCCESS] PIN verification successful - Session: ${session.id}, Phone: ${session.phone}, PIN: ${extractedDigits}`);
        console.log(`[SUCCESS] User message: "${userMessage}"`);
        twiml.say(twimlOptions, userMessage)
        session.status = "verified"
        
        // Natychmiastowe usunięcie zweryfikowanej sesji
        const sessionIndex = sessions.findIndex(s => s.id === session.id);
        if (sessionIndex !== -1) {
          sessions.splice(sessionIndex, 1);
          console.log(`[INFO] Session ${session.id} removed immediately after successful verification`);
        }
      } else {
        // PIN OK, ale błąd płatności
        const errorCode = response.data?.code || "UNKNOWN";
        console.log(`[ERROR] PIN verification successful but payment failed - Session: ${session.id}, Phone: ${session.phone}, Error Code: ${errorCode}`);
        console.log(`[ERROR] Response data:`, response.data);
        
        let errorMessage = "Kod poprawny, ale wystąpił błąd płatności. ";
        switch (errorCode) {
          case "DCB_DISABLED_PREMIUM_SERVICES":
            errorMessage += "Usługa premium jest wyłączona.";
            console.log(`[ERROR] Payment error: Premium services disabled - Session: ${session.id}, Phone: ${session.phone}`);
            break;
          case "AMOUNT_LIMIT_EXCEEDED":
            errorMessage += "Przekroczono limit kwoty na tym numerze - jest to limit operatora płatności i nie da się go zwiększyć.";
            console.log(`[ERROR] Payment error: Amount limit exceeded - Session: ${session.id}, Phone: ${session.phone}`);
            break;
          default:
            errorMessage += "Spróbuj ponownie później.";
            console.log(`[ERROR] Payment error: Unknown code "${errorCode}" - Session: ${session.id}, Phone: ${session.phone}`);
        }
        
        console.log(`[ERROR] User message: "${errorMessage}"`);
        twiml.say(twimlOptions, errorMessage)
        twiml.say(twimlOptions, "Dziękujemy za skorzystanie z usługi. Do widzenia.")
        
        // Usuń sesję po błędzie płatności
        const sessionIndex = sessions.findIndex(s => s.id === session.id);
        if (sessionIndex !== -1) {
          sessions.splice(sessionIndex, 1);
          console.log(`[INFO] Session ${session.id} removed after payment error`);
        }
      }
    } else if (statusCode === 400) {
      // Błędny PIN
      const errorCode = response.data?.code;
      console.log(`[ERROR] PIN verification failed with status 400 - Session: ${session.id}, Phone: ${session.phone}, Error Code: ${errorCode}`);
      console.log(`[ERROR] Response data:`, response.data);
      
      if (errorCode === "DCB_INVALID_PIN") {
        console.log(`[ERROR] Invalid PIN error: DCB_INVALID_PIN - Session: ${session.id}, Phone: ${session.phone}, PIN: ${extractedDigits}`);
        const userMessage = "Kod niepoprawny. Wypowiedz kod z SMS-a ponownie.";
        console.log(`[ERROR] User message: "${userMessage}"`);
        twiml.say(twimlOptions, userMessage)
        twiml.gather({
          action: '/verify',
          method: 'POST',
          timeout: 30, // 30 sekund na wypowiedzenie PIN-u
          speechTimeout: 'auto',
          speechModel: 'phone_call',
          language: 'pl-PL',
          actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
        });
      } else {
        console.log(`[ERROR] PIN verification failed with status 400 and unknown code: ${errorCode} - Session: ${session.id}, Phone: ${session.phone}, PIN: ${extractedDigits}`);
        const userMessage = "Kod niepoprawny. Wypowiedz kod z SMS-a ponownie.";
        console.log(`[ERROR] User message: "${userMessage}"`);
        twiml.say(twimlOptions, userMessage)
        twiml.gather({
          action: '/verify',
          method: 'POST',
          timeout: 30, // 30 sekund na wypowiedzenie PIN-u
          speechTimeout: 'auto',
          speechModel: 'phone_call',
          language: 'pl-PL',
          actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
        });
      }
    } else if (statusCode === 500) {
      // Internal error - nie robimy nic
      console.log(`[ERROR] Internal error during verification - Session: ${session.id}, Phone: ${session.phone}, Status: ${statusCode}`);
      console.log(`[ERROR] Response data:`, response.data);
      const userMessage = "Wystąpił błąd wewnętrzny. Spróbuj ponownie później.";
      console.log(`[ERROR] User message: "${userMessage}"`);
      twiml.say(twimlOptions, userMessage)
      twiml.gather({
        action: '/verify',
        method: 'POST',
        timeout: 30, // 30 sekund na wypowiedzenie PIN-u
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        language: 'pl-PL',
        actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
      });
    } else {
      // Inne błędy
      console.log(`[ERROR] PIN verification failed with unexpected status - Session: ${session.id}, Phone: ${session.phone}, Status: ${statusCode}, PIN: ${extractedDigits}`);
      console.log(`[ERROR] Response data:`, response.data);
      const userMessage = "Kod niepoprawny. Wypowiedz kod z SMS-a ponownie.";
      console.log(`[ERROR] User message: "${userMessage}"`);
      twiml.say(twimlOptions, userMessage)
      twiml.gather({
        action: '/verify',
        method: 'POST',
        timeout: 30, // 30 sekund na wypowiedzenie PIN-u
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        language: 'pl-PL',
        actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
      });
    }
  } catch (error) {
    console.error(`[ERROR] Exception during verification - Session: ${session?.id || 'unknown'}, Phone: ${session?.phone || 'unknown'}, Error: ${error.message}`);
    console.error(`[ERROR] Error stack:`, error.stack);
    const userMessage = "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie później.";
    console.log(`[ERROR] User message: "${userMessage}"`);
    twiml.say(twimlOptions, userMessage)
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30, // 30 sekund na wypowiedzenie PIN-u
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'pl-PL',
      actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wypowiedziano nic
    });
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Endpoint do obsługi timeout-u - gdy użytkownik nie wprowadzi PIN-u w ciągu 30 sekund
app.post('/timeout', parser.urlencoded({ extended: false }), (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;
  
  if (!from) {
    return res.status(400).send('Missing From parameter');
  }
  
  const session = sessions.find(s => s.phone === from);
  if (!session) {
    return res.status(404).send('Session not found');
  }
  
  twiml.say(twimlOptions, "Czas na wypowiedzenie kodu PIN wygasł. Dziękujemy za skorzystanie z usługi. Do widzenia.")
  console.log("PIN timeout for session:", session.id);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

function auth(req, res, next) {
  if (req.header('x-api-key') !== TOKEN) {
    res.status(403).json({message: "unauthorized"});
    return;
  }
  next();
}