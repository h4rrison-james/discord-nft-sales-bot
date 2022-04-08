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

    const res = await fetch(uri).then((r) => r.json());
    return cb(res);
  };
