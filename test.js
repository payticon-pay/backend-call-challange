import axios from "axios";

const URL = "https://paycadoo-krs-call-challange.dev.kubeticon.com";
const TOKEN = "dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh"
const PHONE = "+48518801987"
const CODE = "123456"

const client = axios.create({
    baseURL: URL,
    headers: {
        'x-api-key': TOKEN
    }
})

async function main() {
  const response = await client.post(`/session`, {
    phone: PHONE,
    code: CODE,
    url: "https://wp.pl"
  });
  const code = response.data;
  console.log("Code created", code);

  
}

main();