import { ChainId } from "@certusone/wormhole-sdk";
import { NodeWallet, deriveAddress } from "@certusone/wormhole-sdk/lib/cjs/solana";
import { Connection, PublicKeyInitData, Signer } from "@solana/web3.js";
import {PublicKey} from "@solana/web3.js";

import { Program, Provider } from "@coral-xyz/anchor";

import IDL from "./IDL.json";

export function createHelloWorldProgramInterface(
  connection: Connection,
  programId: PublicKeyInitData,
  payer?: PublicKeyInitData
): Program{
  const provider: Provider = {
    connection,
    publicKey: payer == undefined ? undefined : new PublicKey(payer),
  };
  return new Program(
    IDL as any,
    new PublicKey(programId),
    provider
  );
}


export function deriveForeignEmitterKey(
  programId: PublicKeyInitData,
  chain: ChainId
) {
  return deriveAddress(
    [
      Buffer.from("foreign_emitter"),
      (() => {
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(chain);
        return buf;
      })(),
    ],
    programId
  );
}

export interface ForeignEmitter {
  chain: ChainId;
  address: Buffer;
}

export async function getForeignEmitterData(
  connection: Connection,
  programId: PublicKeyInitData,
  chain: ChainId
): Promise<ForeignEmitter> {
  const { address } = await createHelloWorldProgramInterface(connection, programId)
    .account.foreignEmitter.fetch(deriveForeignEmitterKey(programId, chain));

  return {
    chain,
    address: Buffer.from(address as any),
  };
}


export function deriveConfigKey(programId: PublicKeyInitData) {
  return deriveAddress([Buffer.from("config")], programId);
}

export interface WormholeAddresses {
  bridge: PublicKey;
  feeCollector: PublicKey;
  sequence: PublicKey;
}

export interface ConfigData {
  owner: PublicKey;
  wormhole: WormholeAddresses;
}

export async function getConfigData(
  connection: Connection,
  programId: PublicKeyInitData
): Promise<ConfigData> {
  const data = await createHelloWorldProgramInterface(connection, programId)
    .account.config.fetch(deriveConfigKey(programId));

  return {
    owner: data.owner as any,
    wormhole: data.wormhole as any,
  };
}

export function deriveReceivedKey(
  programId: PublicKeyInitData,
  chain: ChainId,
  sequence: bigint
) {
  return deriveAddress(
    [
      Buffer.from("received"),
      (() => {
        const buf = Buffer.alloc(10);
        buf.writeUInt16LE(chain, 0);
        buf.writeBigInt64LE(sequence, 2);
        return buf;
      })(),
    ],
    programId
  );
}

export interface Received {
  batchId: number;
  message: Buffer;
}

export async function getReceivedData(
  connection: Connection,
  programId: PublicKeyInitData,
  chain: ChainId,
  sequence: bigint
): Promise<Received> {
  const received = await createHelloWorldProgramInterface(connection, programId)
    .account.received.fetch(deriveReceivedKey(programId, chain, sequence));

  return {
    batchId: received.batchId as any,
    message: received.message as Buffer
  };
}

export const payerToWallet = (payer: Signer) =>
     NodeWallet.fromSecretKey(payer.secretKey);


