import neynarClient from "./neynarClient";

const SUPABASE_URL = "https://nsgjcgzucpdojbngqxqn.supabase.co/rest/v1/active-players";
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY!;

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      if (!process.env.SIGNER_UUID || !SUPABASE_API_KEY) throw new Error("Missing env vars");

      const body = await req.text();
      if (!body) return new Response("Empty body", { status: 400 });

      const hookData = JSON.parse(body);
      const originalText = hookData.data.text || "";
      const replyTo = hookData.data.hash;
      const signerUuid = process.env.SIGNER_UUID;

      const commandMatch = originalText.match(/!assist\s+(.*)/i);
      if (!commandMatch) return new Response("No !assist found", { status: 200 });

      const userInput = commandMatch[1].trim().toLowerCase();
      const usernameMatch = userInput.match(/@([a-zA-Z0-9_.-]+)/);
      const taggedUsername = usernameMatch ? usernameMatch[1] : null;

      let fid: number | null = null;
      let displayName: string | null = null;
      let userExists = false;

      if (taggedUsername) {
        // Look up FID
        const userRes = await fetch(`https://api.neynar.com/v2/farcaster/user/search?q=${taggedUsername}`, {
          headers: { "x-api-key": process.env.NEYNAR_API_KEY! }
        });
        const userJson = await userRes.json();
        const user = userJson.result?.users?.find((u: any) => u.username === taggedUsername);

        if (user) {
          fid = user.fid;
          displayName = `@${user.username}`;

          // Check if player exists on Supabase
          const checkRes = await fetch(`${SUPABASE_URL}?playerid=eq.${fid}`, {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
              "Content-Type": "application/json"
            }
          });

          const checkJson = await checkRes.json();
          userExists = checkJson.length > 0;

          // If user exists, update HP or MP
          if (userExists) {
            const current = checkJson[0];
            let updateBody: any = {};

            if (userInput.includes("with hp")) {
              updateBody.farcasterhp = current.farcasterhp + 50;
            } else if (userInput.includes("with mp")) {
              updateBody.farcastermp = current.farcastermp + 7;
            } else if (userInput.includes("with great helm of giants")) {
              updateBody.head = "great_helm_of_giants";
            } else if (userInput.includes("with dragonskin armor")) {
              updateBody.body = "dragonskin_armor";
            }

            if (Object.keys(updateBody).length > 0) {
              await fetch(`${SUPABASE_URL}?playerid=eq.${fid}`, {
                method: "PATCH",
                headers: {
                  apikey: SUPABASE_API_KEY,
                  Authorization: `Bearer ${SUPABASE_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(updateBody)
              });
            }
          }
        }
      }

      // Craft response
      let responseText = "";
      let embeds = [];

      if (userInput.includes("with mp")) {
        responseText = displayName
          ? userExists
            ? `🧙‍♂️ ${displayName} is gifted the Eye of the Hollow Star—your spells echo with the cold brilliance of forgotten constellations.`
            : `❌ ${displayName} is not registered. No magic for strangers.`
          : "🧙‍♂️ You are gifted the Eye of the Hollow Star—your spells echo with the cold brilliance of forgotten constellations.";

        embeds.push({
          type: "image",
          url: "https://violet-worldwide-sole-637.mypinata.cloud/ipfs/bafkreigu34emyip63si4u5g5jwg6qmcgugphwdfzev777thqjouheakhpa", // Replace with your MP image
        });

      } else if (userInput.includes("with hp")) {
        responseText = displayName
          ? userExists
            ? `💪 ${displayName} is gifted the Relic of the Withered Saint, its touch mending your wounds with the lingering mercy of the dead.`
            : `❌ ${displayName} is not registered. No health for strangers.`
          : "💪 You are gifted the Relic of the Withered Saint, its touch mending your wounds with the lingering mercy of the dead.";

        embeds.push({
          type: "image",
          url: "https://violet-worldwide-sole-637.mypinata.cloud/ipfs/bafkreihvv4ptjchkzjhh2auniybhenfa6xvwcca7nrvdpgrhi7yxclz2ti", // Replace with your HP image
        });

      } else if (userInput.includes("with great helm of giants")) {
        responseText = displayName
          ? userExists
            ? `💪 ${displayName} is bound by oath to the Helm of the Great Giants, pulsing with the wrath of its former wielder.`
            : `❌ ${displayName} is not registered. No health for strangers.`
          : "💪 You are bound by oath to the Helm of the Great Giants, pulsing with the wrath of its former wielder.";

        embeds.push({
          type: "image",
          url: "https://violet-worldwide-sole-637.mypinata.cloud/ipfs/bafkreigvpp46wzseijikx5ouablx7e5ex355eetq7ie46vqcuxefzyqvta", // Replace with your Helm image
        });

      } else if (userInput.includes("with dragonskin armor")) {
        responseText = displayName
          ? userExists
            ? `💪 ${displayName} is shrouded in the Armor of the Ancient Dragons—scaled in fire-forged myth, and thrumming with the breath of ages long extinguished.`
            : `❌ ${displayName} is not registered. No health for strangers.`
          : "💪 You are shrouded in the Armor of the Ancient Dragons—scaled in fire-forged myth, and thrumming with the breath of ages long extinguished.";

        embeds.push({
          type: "image",
          url: "https://violet-worldwide-sole-637.mypinata.cloud/ipfs/bafkreie3ay24wqchuu4ecgkxom6aiigtog23ezptcbfysall3ybk2py3iy", // Real image URL
        });

      } else {
        responseText = "❌ Your plea is unclear. Choose MP or HP, mortal.";
      }

      const reply = await neynarClient.publishCast({
        signerUuid,
        text: responseText,
        parent: replyTo,
        embeds, // Attach embeds
      });


      console.log("Reply sent:", reply.cast);
      return new Response("Cast sent successfully", { status: 200 });

    } catch (err) {
      console.error("Server Error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log("Server running on http://localhost:3000");
