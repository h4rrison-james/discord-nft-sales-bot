import { format } from "date-fns";
import Discord, { Intents, TextChannel } from "discord.js";

const MessageAuthor = {
  name: 'Space Sales Bot',
  url: 'https://www.spacepunks.club/',
  iconURL: 'https://api.spacepunks.club/punks/image/5112'
};

export const discordSetup = (
  discordBotToken: string,
  discordChannelId: string
): Promise<TextChannel> => {
  const discordBot = new Discord.Client({
    intents: [Intents.FLAGS.GUILD_MESSAGES],
  });
  return new Promise<TextChannel>((resolve, reject) => {
    discordBot.login(discordBotToken);
    discordBot.on("ready", async () => {
      const channel = await discordBot.channels.fetch(discordChannelId);
      resolve(channel as TextChannel);
    });
  });
};

export const createMessage = (
  metadata: { name: string; image: string },
  value: string,
  buyer: string,
  seller: string,
  timestamp: string | number,
  contractAddress: string,
  tokenId: string
) =>
  new Discord.MessageEmbed()
    .setColor("#66ff82")
    .setTitle(`${metadata.name} sold!`)
    .setAuthor(MessageAuthor)
    .addFields(
      { name: "Name", value: metadata.name },
      { name: "Amount", value: `${value} Ξ` },
      { name: "Buyer", value: buyer },
      { name: "Seller", value: seller },
      {
        name: "Block Time",
        value: format(
          new Date(parseInt(timestamp as string) * 1000),
          "MMM do y h:mm a"
        ),
      }
    )
    .setURL(`https://opensea.io/assets/${contractAddress}/${tokenId}`)
    .setImage(metadata.image);
