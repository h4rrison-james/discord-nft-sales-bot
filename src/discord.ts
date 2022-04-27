import { format } from "date-fns";
import fetch from "node-fetch";
const FileType = require('file-type');
import Discord, { Intents, TextChannel, MessageAttachment } from "discord.js";

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

export const createAttachment = async (
  metadata: { name: string; image: string }
) => {

  // Fetch the image and load into a buffer
  const response = await fetch(metadata.image)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Determine the image extension
  const imageType = await FileType.fromBuffer(buffer)
  console.log('Image Type: ', imageType)
  if (imageType) {
    return new Discord.MessageAttachment(buffer, `image.${imageType.ext}`)
  } else {
    return undefined
  }

}

export const createMessage = async (
  metadata: { name: string; image: string },
  value: string,
  buyer: string,
  seller: string,
  timestamp: string | number,
  contractAddress: string,
  tokenId: string,
  file?: MessageAttachment
) => {

  return new Discord.MessageEmbed()
    .setColor("#66ff82")
    .setTitle(`${metadata.name} sold!`)
    .setAuthor(MessageAuthor)
    .addFields(
      { name: "Amount", value: `${value} Ξ`, inline: true },
      { name: "Buyer", value: `[${buyer.slice(-4)}](https://opensea.io/${buyer})`, inline: true },
      { name: "Seller", value: `[${seller.slice(-4)}](https://opensea.io/${seller})`, inline: true },
      {
        name: "Block Time",
        value: format(
          new Date(parseInt(timestamp as string) * 1000),
          "MMM do y h:mm a"
        ),
      }
    )
    .setURL(`https://opensea.io/assets/${contractAddress}/${tokenId}`)
    .setImage(file ? `attachment://${file.name}` : '');
}
