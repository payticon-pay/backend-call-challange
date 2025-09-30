import axios from "axios";

const URL = "https://paycadoo-call-challange.prod.kubeticon.com";
const TOKEN = "dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh"
const PHONE = "+48663366883"
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
    url: "https://krs.requestcatcher.com/test"
  });
  const code = response.data;
  console.log("Code created", code);

  
}

main();