import { MetadataCb } from ".";
import fetch from "node-fetch";

export const fetchMetadata =
  (cb: MetadataCb) =>
  async (uri: string): Promise<{ name: string; image: string }> => {
    console.log('URI: ', uri)

    // Proxy URI if it is IPFS protocol
    if (uri.substring(0,4) == 'ipfs') {
      uri = 'https://ipfs.io/ipfs/' + uri.substring(7)
      console.log('Modified URI: ', uri)
    }

    var res = await fetch(uri).then((r) => r.json());

    // Proxy image URL if it is IPFS protocol
    if (res.image.substring(0,4) == 'ipfs') {
      res.image = 'https://ipfs.io/ipfs/' + res.image.substring(7)
    }

    return cb(res);
  };
