import Web3 from "web3";
import { AbiItem } from "web3-utils";
import abi from "./erc721abi.json";
import BN from "bignumber.js";
import { createMessage, createAttachment, discordSetup } from "./discord";
import { TextChannel } from "discord.js";
import { fetchMetadata } from "./utils";
import debug from "debug";

type TransferEvent = {
  address: string;
  returnValues: {
    from: string;
    to: string;
    tokenId: string;
  }
  transactionHash: string;
  blockNumber: number;
}

export type MetadataCb = (metadata: any) => {
  name: string;
  image: string;
}

type Options = {
  metadataCb?: MetadataCb;
  websocketURI: string;
  contractArray: string[];
  discordBotToken: string;
  discordChannelId: string;
}

const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase()
const web3 = new Web3()
var channel:TextChannel

async function nftSalesBot(options: Options) {

  console.log("Setting up discord bot")
  channel = await discordSetup(
    options.discordBotToken,
    options.discordChannelId
  );
  console.log("Setting up discord bot complete")

  web3.setProvider(new Web3.providers.WebsocketProvider(options.websocketURI, {
      clientConfig: {
        keepalive: true,
        keepaliveInterval: 60000,
      },
      reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 25,
        onTimeout: false,
      },
    })
  )

  for(const contractAddress of options.contractArray) {
    // Loop through contracts and add an event listener for each one
    const contract = new web3.eth.Contract(
      abi as unknown as AbiItem,
      contractAddress
    )

    console.log("Adding contract event listener for contract: ", contract.options.address);
    contract.events.Transfer(async (err: any, res: TransferEvent) => {
      if (!err) {
        await transferCallback(res)
      }
    })
  }

  return {
    test: transferCallback,
  };
}

async function transferCallback(res: TransferEvent) {

  const tx = await web3.eth.getTransaction(res.transactionHash);
  console.log("Getting transaction receipt");
  const txReceipt = await web3.eth.getTransactionReceipt(res.transactionHash);
  let wethValue = new BN(0);
  console.log(txReceipt.logs);

  txReceipt?.logs.forEach((currentLog) => {
    // Check if WETH was transferred during this transaction
    if (
      currentLog.topics[2]?.toLowerCase() ==
        web3.utils.padLeft(res.returnValues.from, 64).toLowerCase() &&
      currentLog.address.toLowerCase() == WETH_ADDRESS &&
      currentLog.topics[0]?.toLowerCase() ==
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef".toLowerCase()
    ) {
      const v = `${parseInt(currentLog.data)}`;
      console.log(`Weth value found ${v}`);
      wethValue = wethValue.plus(web3.utils.fromWei(v));
    }
  });

  // Calculate the ETH value
  let value = new BN(web3.utils.fromWei(tx.value));
  console.log(`WETH Value: ${wethValue.toFixed()}, ETH Value: ${value.toFixed()}`);
  value = value.gt(0) ? value : wethValue;

  if (value.gt(0)) {
    // Re-create the contract using the transfer event address
    const contract = new web3.eth.Contract(
      abi as unknown as AbiItem,
      res.address
    )
    // Extract the image path from the metadata
    const uri = await contract.methods.tokenURI(res.returnValues.tokenId).call();
    const metadata = await fetchMetadata(
      // Remove the callback for now, as it required options to be in scope
      // options.metadataCb ?? ((m: any) => m)
      ((m: any) => m)
    )(uri);
    console.log('Metadata: ', metadata);

    const block = await web3.eth.getBlock(res.blockNumber)

    // Create image attachment, will return 'undefined' if no image specified
    const file = await createAttachment(metadata)

    const message = await createMessage(
      metadata,
      value.toFixed(),
      res.returnValues.to,
      res.returnValues.from,
      block.timestamp,
      res.address,
      res.returnValues.tokenId,
      file
    );
    console.log("Try sending message: ", message);
    try {
      if (file) {
        // Send image attachment with message
        await channel.send({ embeds: [message], files: [file] })
      } else {
        await channel.send({ embeds: [message] })
      }
    } catch (e: any) {
      console.log("Error sending message", " ", e.message);
    }
  }
}

export default nftSalesBot
