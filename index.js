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

app.get("/health", (_, res) => res.end())

app.post('/session', auth, parser.json(), (request, response) => {
  const {phone, url, secret} = request.body;
  const id = randomUUID();
  sessions.push({id, phone, url, status: "pending",secret, createdAt: new Date()});
  console.log(`Session created for ${phone} ${id}`);
  response.json({id});
});


app.post('/voice', parser.urlencoded({ extended: false }), (request, response) => {
  const twiml = new VoiceResponse();
  const from = request.body.From;
  const session = sessions.find(code => code.phone === from);

  if (!session) {
   twiml.say(twimlOptions,"Dla numeru, z którego dzwonisz, nie ma aktywnej transakcji do płatności.")
   console.log("Number rejected ", from)
  } else {
    twiml.say(twimlOptions, "Witaj w pejtikon kropka kom. Rozpoczynasz zakupy kart podarunkowych w usłudze „Płacę z Play”. Wpisz kod PIN z SMS-a i naciśnij krzyżyk.")
    twiml.gather({
      action: '/verify',
      method: 'POST'
    });
  }
  
  response.type('text/xml');
  response.send(twiml.toString());
});


app.post('/verify', parser.urlencoded({ extended: false }), async (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;
  const code = req.body.Digits;
  const session = sessions.find(code => code.phone === from);
  if (!session) {
    res.status(404)
    return;
  }

  const response = await axios.post(session.url, {...session, code}, {validateStatus: () => true});
  console.log("Session verifivation response code:", response.status, session.id)
  if (response.status === 200) {
    twiml.say(twimlOptions, "Kod poprawny. Trwa finalizacja transakcji.")
    session.status = "verified"
    console.log("Session is verified", session.id)
  } else {
    twiml.say(twimlOptions, "Kod niepoprawny. Wpisz kod z SMS-a. W razie błędu zacznij od początku.")
    twiml.gather({
      action: '/verify',
      method: 'POST'
    });
  }
  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(3000);

function auth(req, res, next) {
  if (req.header('x-api-key') !== TOKEN) {
    res.status(403).json({message: "unauthorized"})
    return;
  }
  next()
}