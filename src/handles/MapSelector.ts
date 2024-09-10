import { Category } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteraction,
} from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On, Slash, SlashOption } from "discordx";
import { channelsConfig, Global } from "../global/global.js";

@Discord()
@Category("Map Selector")
export abstract class MapSelector {
  static fetchingMessage = "Loading...";
  static errorMessage =
    "An error occured while fetching the best comp for the map. Please try again later.";

  @Slash({ name: "map", description: "Best comp to play on a map" })
  async prompt(
    @SlashOption({
      description: "Prompt for the chat",
      name: "prompt",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    prompt: string,
    @SlashOption({
      description: "Private message",
      name: "private",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    })
    ephemeral: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
    if (Global.IS_DEV) return;
    const DMChannel = interaction.channel?.type == ChannelType.DM;
    if (!DMChannel) {
      await interaction.reply({
        content: MapSelector.fetchingMessage,
        ephemeral: ephemeral,
      });
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await interaction.editReply({
          content: "Ascent: /n 50%wr - 500 - Jett, Sova, Astra, KAY/O, KillJoy",
        });
      } catch (e) {
        await interaction.editReply({
          content: MapSelector.errorMessage,
        });
      }
    }
  }
}
