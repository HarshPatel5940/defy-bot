import {
  type CacheType,
  type ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../interface";
import type { DefyUser } from "../types";
import db, { cacheClient } from "../utils/database";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboards-waitlist")
    .setDescription("Get the Waitlist Leaderbaords of defy community.")
    .addStringOption((option) =>
      option
        .setName("page")
        .setDescription("The page number to fetch the leaderboards")
        .setRequired(false)
        .addChoices(
          { name: "Top 50", value: "1,50" },
          { name: "Top 100", value: "1,100" },
          { name: "1 - 20", value: "1,20" },
          { name: "20 - 40", value: "21,40" },
          { name: "40 - 50", value: "41,60" },
          { name: "50 - 70", value: "61,80" },
          { name: "70 - 90", value: "81,100" },
        ),
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.guild) return;
    await interaction.reply("Fetching Leaderboards...");
    const page = interaction.options.getString("page") || "1,20";
    const range = page.split(",");
    let users: any = cacheClient.get(page);

    const embed = new EmbedBuilder()
      .setTitle("Waitlist Leaderboards")
      .setDescription("Leaderboards for the Defy Community.")
      .setColor(Colors.Green)
      .setTimestamp();

    if (!users) {
      users = await (
        await db()
      )
        .collection<DefyUser>("users")
        .find(
          {},
          {
            sort: { "balance.totalPointsEarned": -1 },
            projection: {
              walletAddress: 1,
              "balance.totalPointsEarned": 1,
            },
          },
        )
        .toArray();
      cacheClient.set(page, users);
    } else {
      embed.setFooter({ text: "Data fetched from cache" });
    }

    let userList = "";
    const embeds = [embed];

    const diff = range[1] === "50" || range[1] === "100" ? 50 : 20;

    for (let i = Number(range[0]), j = 1; i <= Number(range[1]); i++, j++) {
      userList += `${i}. Wallet 0x${users[i]?.walletAddress.slice(-5, -1)} - ${users[i]?.balance.totalPointsEarned}\n`;

      if (j % diff === 0) {
        const emb = new EmbedBuilder()
          .setDescription(userList)
          .setColor(Colors.Green);
        embeds.push(emb);

        userList = "";
        j = 0;
      }
    }

    return await interaction.editReply({
      content: "",
      embeds: embeds,
    });
  },
} as Command;
