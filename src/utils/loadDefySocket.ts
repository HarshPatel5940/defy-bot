import { WebhookClient } from "discord.js";
import { io } from "socket.io-client";

export async function loadDefySocket() {
  try {
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

      const reward_type = String(data.reward_type);

      if (reward_type === "DEFY_COINS") {
        type = "Defy Coins";
      } else if (reward_type === "RAFFLE_TICKETS") {
        type = "Raffle Tickets";
      } else if (reward_type === "NFT") {
        type = "NFT";
      } else if (reward_type === "FREE_SPIN") {
        type = "Free Spin";
      } else if (reward_type.endsWith("EchoCoin002")) {
        type = "GUI";
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
  } catch (err) {
    console.error("Error While Connecting Defy Socket", err);
  }
}
