// npm i @neynar/nodejs-sdk
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("Make sure you set NEYNAR_API_KEY in your .env file");
}

// make sure to set your NEYNAR_API_KEY .env
// don't have an API key yet? get one at neynar.com
const config = new Configuration({
  apiKey:process.env.NEYNAR_API_KEY,
});

const neynarClient = new NeynarAPIClient(config);

export default neynarClient;