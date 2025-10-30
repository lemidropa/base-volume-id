import { Alchemy, Network } from 'alchemy-sdk';

const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;

export const alchemy = new Alchemy({ apiKey, network: Network.BASE_MAINNET });
