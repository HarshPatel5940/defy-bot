import { WebhookClient, type Client, type Collection } from "discord.js";
import { getFiles } from "./getFiles";
import type { Command } from "../interface";
import { io } from "socket.io-client";

export async function loadEvents(
  client: Client,
  commands: Collection<string, Command>,
) {
  const files = await getFiles("events");
  const events: string[] = [];
  await Promise.all(
    files.map(async (file: string) => {
      try {
        const { default: event } = (await import(file)).default;
        if (!event.name) {
          console.log(`Invalid Event File: ${file}`);
          return;
        }
        const execute = (...args: unknown[]) =>
          event.execute(...args, commands);

        if (event.once) {
          client.once(event.name, execute);
        } else {
          client.on(event.name, execute);
        }
        events.push(event);
      } catch (err) {
        console.log(`Failed to Load Event: ${file.split("/").pop()}`);
        console.log(err);
      }
    }),
  );
  console.log(`Loaded ${events.length} Events!`);

  const webhookClient = new WebhookClient({
    url: "https://discord.com/api/webhooks/1255858536378798100/82cFoCLPxjlS6sshMUerWWcwzvTk9-P5dGdHxulLe8pItV_gg_cUjRXq9KYyK5UwrlRB",
  });
  const socket = io("https://games-backend.azurewebsites.net");

  socket.on("live_activity", async (data) => {
    console.log(data);
    let title = data.game;
    let type = data.reward_type;

    if (data.game === "coin_flip") {
      title = "Coin Flip :coin:";
    } else if (data.game === "dice_roll") {
      title = "Dice Roll :game_die:";
    } else if (data.game === "fortune_wheel") {
      title = "Fortune Wheel :ferris_wheel:";
    } else if (data.game === "nft_spin") {
      title = "NFT Spin :slot_machine:";
    }

    if (data.reward_type === "DEFY_COINS") {
      type = "Defy Coins";
    }

    const getCDStamp = (timestamp = Date.now()) =>
      `<t:${Math.round(timestamp / 1000)}:R>`;
    await webhookClient.send({
      content: `## Someone Played ${title}\nWallet: ${data.player.slice(0, 4)}...${data.player.slice(-5, -1)}\nReward: ${data.reward_amount} ${type}\nTime: ${getCDStamp(data.timestamp)}\n\n`,
      avatarURL:
        "https://images-ext-1.discordapp.net/external/92conRaMkJxLvNjrhJdvPgh32kSEAnCzaHYQzH38ZSc/%3Fsize%3D4096/https/cdn.discordapp.com/icons/1230214657206128731/613dd29f09cab2d468b1d67c31a58dbe.png?format=webp&quality=lossless",
      username: "Defy Intern",
    });
  });
  socket.connect();

  console.log("Connected to Socket Server");
}
