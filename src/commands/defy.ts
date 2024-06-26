import {
  type CacheType,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from "discord.js";
import type { Command } from "../interface";
import type { DefyUser } from "../types";
import db from "../utils/database";
import config from "../config";

export default {
  data: new SlashCommandBuilder()
    .setName("defy")
    .setDescription("Manage Defy Related details")
    .setDMPermission(false)
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
      subcommand
        .setName("link")
        .setDescription("Link Your Defy Waller")
        .addStringOption((input) =>
          input
            .setName("wallet-address")
            .setDescription("Your Defy Wallet Address")
            .setRequired(true),
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.guild) return;
    if (!interaction.member) return;

    await interaction.reply("Fetching your Defy Details...");
    const walletAdress = interaction.options.getString("wallet-address");
    await interaction.editReply(
      `Fetching Defy Details for the wallet \`${walletAdress}\``,
    );

    if (!walletAdress) {
      return await interaction.editReply(
        "Failed to fetch the wallet address from the command. Contact Developer for this erorr!",
      );
    }

    const userDetails = await (await db())
      .collection<DefyUser>("users")
      .findOne({ walletAddress: walletAdress });

    if (!userDetails) {
      return await interaction.editReply(
        `Cant find a wallet with the given address!\nwallet: \`${walletAdress}\``,
      );
    }

    await interaction.editReply(
      "Wallet Details Fetched... Authenticating Details",
    );

    if (!userDetails.connections || userDetails.connections.length === 0) {
      return await interaction.editReply(
        "No Connections found for the wallet address",
      );
    }

    const userConnection = userDetails.connections.find((connection) => {
      if (connection.provider === "discord") {
        return true;
      }
    });

    if (!userConnection) {
      return await interaction.editReply(
        "No Connections found for the wallet address",
      );
    }

    if (userConnection.id !== interaction.user.id) {
      return await interaction.editReply(
        "Verification Failed! Connected Discord Account does not match the user",
      );
    }

    await interaction.editReply(
      "Verification Successful! Fetching Verified Role...",
    );

    const Trole = interaction.guild.roles.cache.get(config.VERIFIED_ROLE_ID);
    const Tmember = interaction.guild.members.cache.get(interaction.user.id);

    if (!Trole || !Tmember) {
      return await interaction.editReply(
        "Verification Successful! Fetching Role **Failed**! ",
      );
    }

    try {
      await Tmember.roles.add(Trole);
    } catch (err) {
      return await interaction.editReply(
        "Verification Successful! Can't Add the Verified Role. Ask an admin to fix permissions!",
      );
    }

    await interaction.editReply(
      "Verification Successful! Added the Verified Role Successfully!",
    );
  },
} as Command;
