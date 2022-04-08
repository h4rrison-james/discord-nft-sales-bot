import Web3 from "web3";
import { AbiItem } from "web3-utils";
import abi from "./erc721abi.json";
import BN from "bignumber.js";
import { createMessage, discordSetup } from "./discord";
import { fetchMetadata } from "./utils";
import debug from "debug";

type TransferEvent = {
  returnValues: {
    from: string;
    to: string;
    tokenId: string;
  };
  transactionHash: string;
  blockNumber: number;
};

export type MetadataCb = (metadata: any) => {
  name: string;
  image: string;
};

type Options = {
  metadataCb?: MetadataCb;
  websocketURI: string;
  contractAddress: string;
  discordBotToken: string;
  discordChannelId: string;
};

const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();

async function nftSalesBot(options: Options) {
  console.log("Setting up discord bot");
  const channel = await discordSetup(
    options.discordBotToken,
    options.discordChannelId
  );
  console.log("Setting up discord bot complete");

  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(options.websocketURI, {
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
  );

  var contracts = []
  for (const contractAddress in options.contractAddresses) {
    // Create new contract and push onto array
    contracts.push(new web3.eth.Contract(
      abi as unknown as AbiItem,
      contractAddress
    ));
  }

  async function transferCallback(res: TransferEvent) {
    console.log("Transfer event received.");
    console.log("Getting transaction");
    const tx = await web3.eth.getTransaction(res.transactionHash);
    console.log("Getting transaction receipt");
    const txReceipt = await web3.eth.getTransactionReceipt(res.transactionHash);
    let wethValue = new BN(0);
    console.log(txReceipt.logs);
    txReceipt?.logs.forEach((currentLog) => {
      // check if WETH was transferred during this transaction
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
    let value = new BN(web3.utils.fromWei(tx.value));
    console.log(`WETH Value: ${wethValue.toFixed()}, ETH Value: ${value.toFixed()}`);
    value = value.gt(0) ? value : wethValue;
    if (value.gt(0)) {
      const uri = await contract.methods
        .tokenURI(res.returnValues.tokenId)
        .call();
      const metadata = await fetchMetadata(
        options.metadataCb ?? ((m: any) => m)
      )(uri);

      console.log('Metadata: ', metadata);

      const block = await web3.eth.getBlock(res.blockNumber);
      const message = createMessage(
        metadata,
        value.toFixed(),
        res.returnValues.to,
        res.returnValues.from,
        block.timestamp,
        options.contractAddress,
        res.returnValues.tokenId
      );
      console.log("Try sending message: ", message);
      try {
        await channel.send({ embeds: [message] });
      } catch (e: any) {
        console.log("Error sending message", " ", e.message);
      }
    }
  }

  for (var contract in contracts) {
    console.log("Adding contract event listener for contract: ", contract.options.address);
    contract.events.Transfer(async (err: any, res: TransferEvent) => {
      if (!err) {
        await transferCallback(res);
      }
    });
  }

  return {
    test: transferCallback,
  };
}

export default nftSalesBot;
