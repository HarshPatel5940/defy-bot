import {
  type CacheType,
  type ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../interface";
import type { DefyUser } from "../types";
import db from "../utils/database";

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
    const range = (interaction.options.getString("page") || "1,20").split(",");

    // TODO: we can optimise this when have ability to write to db and mark user
    // are exsisting... this was we reduce the number of users to fetch repeatedly

    const users = await (
      await db()
    )
      .collection<DefyUser>("users")
      .find(
        {
          "connections.provider": "discord",
        },
        {
          sort: { "balance.totalPointsEarned": -1 },
          projection: {
            _id: 0, // To exclude the default MongoDB _id field, set this to 0.
            "balance.totalPointsEarned": 1,
            connections: {
              $filter: {
                input: "$connections",
                as: "connection",
                cond: { $eq: ["$$connection.provider", "discord"] },
              },
            },
          },
        },
      )
      .toArray();

    const embed = new EmbedBuilder()
      .setTitle("Leaderboards")
      .setDescription("Top 50 users with highest total points earned.")
      .setColor(Colors.Green)
      .setTimestamp();

    // Cache using node cache
    let transformedUsers = users.map((user) => ({
      id: user.connections[0]?.id as string,
      points: user.balance.totalPointsEarned,
    }));

    transformedUsers = transformedUsers.filter((user) => {
      const member = interaction.guild?.members.cache.get(user.id);
      return member;
    });

    console.log(transformedUsers.length);

    const fields = [];

    for (let i = Number(range[0]); i < Number(range[1]); i += 10) {
      const batch = transformedUsers.slice(i, i + 10);
      const field = {
        name: `Rank ${i} - ${i + 10}`,
        value: batch
          .map(
            (user, index) =>
              `${i + index}. <@${user.id}> - ${user.points} points`,
          )
          .join("\n"),
        inline: false,
      };
      fields.push(field);
    }

    embed.addFields(fields);

    return await interaction.editReply({
      content: "",
      embeds: [embed],
    });
  },
} as Command;
