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
    twiml.say(twimlOptions, "Witaj w pejtikon kropka kom. Rozpoczynasz zakupy kart podarunkowych w usludze \"Place z Play\". Wpisz kod PIN z SMS-a i nacisnij krzyzyk.")
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30, // 30 sekund na wprowadzenie PIN-u
      finishOnKey: '#', // Zakończ po naciśnięciu #
      actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wprowadzono nic
    });
  }
  
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/verify', parser.urlencoded({ extended: false }), async (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;
  const digits = req.body.Digits;
  
  if (!from || !digits) {
    return res.status(400).send('Missing From or Digits parameter');
  }
  
  const session = sessions.find(s => s.phone === from);
  if (!session) {
    return res.status(404).send('Session not found');
  }

  try {
    const response = await axios.post(session.url, {...session, code: digits}, {
      validateStatus: () => true,
      timeout: 10000 // 10 sekund timeout
    });
    
    console.log("Session verification response code:", response.status, session.id);
    
    if (response.status === 200) {
      twiml.say(twimlOptions, "Kod poprawny. Trwa finalizacja transakcji.")
      session.status = "verified"
      console.log("Session is verified", session.id)
      
      // Natychmiastowe usunięcie zweryfikowanej sesji
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions.splice(sessionIndex, 1);
        console.log(`Session ${session.id} removed immediately after verification`);
      }
    } else {
      twiml.say(twimlOptions, "Kod niepoprawny. Wpisz kod z SMS-a. W razie błędu zacznij od początku.")
      twiml.gather({
        action: '/verify',
        method: 'POST',
        timeout: 30, // 30 sekund na wprowadzenie PIN-u
        finishOnKey: '#', // Zakończ po naciśnięciu #
        actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wprowadzono nic
      });
    }
  } catch (error) {
    console.error("Error during verification:", error.message);
    twiml.say(twimlOptions, "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie później.")
    twiml.gather({
      action: '/verify',
      method: 'POST',
      timeout: 30, // 30 sekund na wprowadzenie PIN-u
      finishOnKey: '#', // Zakończ po naciśnięciu #
      actionOnEmptyResult: '/timeout' // Przekieruj na timeout gdy nie wprowadzono nic
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
  
  twiml.say(twimlOptions, "Czas na wprowadzenie kodu PIN wygasł. Dziękujemy za skorzystanie z usługi. Do widzenia.")
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