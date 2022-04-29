import nftSalesBot from './dist/index.js';
import 'dotenv/config';

nftSalesBot.default({
  // Websocket connection to Ethereum
  websocketURI: process.env.WEBSOCKET_URI,

  // Array of smart contract addresses to monitor
  contractArray: JSON.parse(process.env.CONTRACT_ARRAY),

  // Bot token set up in Discord developer portal
  discordBotToken: process.env.DISCORD_BOT_TOKEN,

  // ID of channel (turn on Developer mode in Discord to get this)
  discordChannelId: process.env.DISCORD_CHANNEL_ID,
}).catch((e) => {
  // Something went wrong
  console.log('Error: ', e);
});
