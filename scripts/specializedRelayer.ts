import {
	parseVaa,
	parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import * as wh from "@certusone/wormhole-sdk";
import { Connection,PublicKey, PublicKeyInitData, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHelloWorldProgramInterface, deriveConfigKey, deriveForeignEmitterKey, deriveReceivedKey, getReceivedData, payerToWallet } from "./utils";
import { derivePostedVaaKey, getPostMessageCpiAccounts } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole";
import { deriveAddress, signSendAndConfirmTransaction } from "@certusone/wormhole-sdk/lib/cjs/solana";
import { ethers } from "ethers";
import abi from "../abi/helloworld.json";


/**
 * Flow is this 
 * - deploy wormhole smart contract on polygon mumbai
 * - call transaction from polygon mumbai
 * - get sequence from this transaction using wormhole SDK
 * - use this sequence to generate VAA hash of the message
 * - post the VAA hash on the bridge (between EVM and Solana)
 * - call recieve message on solana
 * 
 *  */
import { Keypair } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";


const main = async()=>{
	// On Polygon Mumbai
	const emmitterAddress = "0x23c290898e049f5EEE7776B18EEfaCb13D8C925b"
	const providerPolygon = new ethers.providers.JsonRpcProvider(
		"https://polygon-testnet.public.blastapi.io"
	);
	const walletPolygon = new ethers.Wallet(
		process.env.PRIVATE_KEY!,
		providerPolygon
	);
	console.log("Got wallet")
	const helloWorldContractPolygon = new ethers.Contract(
		emmitterAddress,
		abi,
		providerPolygon
	);
	// console.log({helloWorldContractPolygon})
	const contract = helloWorldContractPolygon.connect(walletPolygon)
	console.log("Got Contract Sending Message");

	const name = "hello7.eth";
	const chain = "polygon";

	const isSenderRegistered = await contract.isSenderRegistered(
		name,
		chain
	);
	console.log(isSenderRegistered);
	if (isSenderRegistered) {
			console.log("User already registered find a new namespace");
            const currentID = await contract.fetchIDFromAddress();
	        console.log("Current ID: " + currentID);
            return;
	}

	const registerId = await contract.storeID(name, chain, ""); //initially no data
	console.log("Registering : ", registerId);

	const nameHash = await contract.getNameHash(name, chain);
	console.log("Name hash is : ", nameHash);

	console.log("Fetching current ID from contract");
	const currentID = await contract.fetchIDFromAddress();
	console.log("Current ID: " + currentID);

	console.log(
			"Adding address of different chain (solana with address 0x1234)"
	);
	const addChain = await contract.addChain(
			name,
			chain,
			"solana",
			"0x1234",
			{
				gasLimit: 50000,
			}
		);
	console.log("Chain Added successfully", addChain);
	const dataPacket = await contract.fetchIDFromAddress();
	console.log("Identity now is : ", dataPacket);

	const encodedDataPacket = await contract.getEncodedID();
	console.log("Encoded data packet is ", encodedDataPacket)
	console.log("Length is : ", encodedDataPacket.length);

	const sendMessageTransaction = await contract.sendMessage()
	const sendMessageTransactionReciept = await sendMessageTransaction.wait();

	const seq = parseSequenceFromLogEth(sendMessageTransactionReciept,"0x0CBE91CF822c73C2315FB05100C2F714765d5c20")
	console.log("seq:",seq);
	
	const vaa = await getVAAFromAPI(emmitterAddress, seq, 5); // 5 for polygon
	console.log("VAA :",vaa);

	//Keeping this VAA on solana bridge

	const buff = Buffer.from(vaa, "base64");
	const kp = Keypair.fromSecretKey(
		bs58.decode(
			"6WpXR3jyrexf4or1yJWz9Jiksfb4jC78dnnZnMWTWxShtU8ikqH7ahrcWeAvu4wBgyg1e2w5fwnUwB8YUYgJTnc"
		)
	);

	const core = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5");
	const conn = new Connection("https://api.devnet.solana.com", "finalized");

	const res = await wh.postVaaSolana(
		conn,
		async (transaction) => {
			transaction.partialSign(kp);
			return transaction;
		},
		core,
		kp.publicKey,
		buff
	);

	console.log({res});

	const programId = new PublicKey("5KxKv5gBp1GVBqJjXDz9SRkqaXHHTCmjzKFMw41jGjbg")
	// get contract on solana
	const program = createHelloWorldProgramInterface(conn, programId);
	const parsed = parseVaa(buff);
	console.log({parsed})

	//initialize solana contract (only once per contract)
	// const tx = await createInitializeInstruction(
	// 	conn,
    //     programId,
    //     kp.publicKey,
    //     core
	// )
	// const temp = new Transaction().add(tx);
	// console.log("Transaction made")
	// const { blockhash: blockHash } = await conn.getLatestBlockhash();
	// temp.recentBlockhash = blockHash;
	// temp.feePayer = kp.publicKey;
	// console.log("Signing....")

	// const sign = await temp.sign(kp);
	// console.log("Sending Transaction....")
	// const txids = await conn.sendTransaction(temp, [kp]);

	// console.log("Confriming: ",await conn.confirmTransaction(txids));
	// add emitter address once per address
	const methods = program.methods
	console.log({methods})
	console.log("Adding emmiter address.....");
	const baseEmitter = "00000000000000000000000023c290898e049f5EEE7776B18EEfaCb13D8C925b"
	const bufferEmitterAddress = Buffer.from(baseEmitter, 'hex');
	console.log(bufferEmitterAddress)

	const tx = await createRegisterForeignEmitterInstruction(
		conn,
        programId,
        kp.publicKey,
		5,
		bufferEmitterAddress
	)
	console.log({tx})
	const temp = new Transaction().add(tx);
	console.log("Transaction made....emitter address")
	//? what is commitment
	const { blockhash: blockHash } = await conn.getLatestBlockhash();
	temp.recentBlockhash = blockHash;
	temp.feePayer = kp.publicKey;
	console.log("Signing....emitter address")

	const sign = await temp.sign(kp);
	console.log("Sending Transaction....emitter address")
	const txids = await conn.sendTransaction(temp, [kp]);

	console.log("Confriming: ",await conn.confirmTransaction(txids));

	console.log("Calling recieve method......")
	const foreignEmitter = deriveForeignEmitterKey(programId,5);
	console.log({foreignEmitter})

	// receive contract on solana
	const ix = await program.methods
		.receiveMessage([...parsed.hash])
		.accounts({
			payer: kp.publicKey,
			config: deriveConfigKey(programId),
			wormholeProgram: core,
			posted: derivePostedVaaKey(core, parsed.hash),
			foreignEmitter: foreignEmitter,
			received: deriveReceivedKey(
			programId,
			5,
			parsed.sequence
			),
		})
		.instruction();

		
	const transaction = new Transaction().add(ix);
	const { blockhash } = await conn.getLatestBlockhash();
	transaction.recentBlockhash = blockhash;
	transaction.feePayer = kp.publicKey;
	const signed = await transaction.sign(kp);
	const txid = await conn.sendTransaction(transaction, [kp]);

	const confirmation = await conn.confirmTransaction(txid);

	console.log("Confirmation :", confirmation);
	console.log("Reading message.....");

	const message = await getReceivedData(conn,programId,5,BigInt(seq));
	console.log("Message object : ", {message}); 

	console.log(message.message.toString('utf-8'));


}

main();

export async function createRegisterForeignEmitterInstruction(
	connection: Connection,
	programId: PublicKeyInitData,
	payer: PublicKeyInitData,
	emitterChain: number,
	emitterAddress: Buffer
  ): Promise<TransactionInstruction> {
	const program = createHelloWorldProgramInterface(connection, programId);
	return program.methods
	  .registerEmitter(emitterChain, [...emitterAddress])
	  .accounts({
		owner: new PublicKey(payer),
		config: deriveConfigKey(program.programId),
		foreignEmitter: deriveForeignEmitterKey(program.programId, emitterChain as wh.ChainId),
	  })
	  .instruction();
  }

export async function createInitializeInstruction(
	connection: Connection,
	programId: PublicKeyInitData,
	payer: PublicKeyInitData,
	wormholeProgramId: PublicKeyInitData
  ): Promise<TransactionInstruction> {
	const program = createHelloWorldProgramInterface(connection, programId);
	const message = deriveWormholeMessageKey(programId, 1n);
	const wormholeAccounts = getPostMessageCpiAccounts(
	  program.programId,
	  wormholeProgramId,
	  payer,
	  message
	);
	return program.methods
	  .initialize()
	  .accounts({
		owner: new PublicKey(payer),
		config: deriveConfigKey(programId),
		wormholeProgram: new PublicKey(wormholeProgramId),
		...wormholeAccounts,
	  })
	  .instruction();
  }
export function deriveWormholeMessageKey(
    programId: PublicKeyInitData,
    sequence: bigint
  ) {
    return deriveAddress(
      [
        Buffer.from("sent"),
        (() => {
          const buf = Buffer.alloc(8);
          buf.writeBigUInt64LE(sequence);
          return buf;
        })(),
      ],
      programId
    );
  }
export const getVAAFromAPI = async (emitter: string,sequence: string,chainId):Promise<String>=>{
	const url = `https://api.testnet.wormholescan.io/api/v1/vaas/${chainId}/${emitter}/${sequence}`;
	const response = await fetch(url);
	const res = await response.json();
	const data = res.data;
	console.log(data);
	const vaa = data.vaa;

	return vaa;

}


// export function deriveReceivedKey(
//   programId: PublicKeyInitData,
//   chain: ChainId,
//   sequence: bigint
// ) {
//   return deriveAddress(
//     [
//       Buffer.from("received"),
//       (() => {
//         const buf = Buffer.alloc(10);
//         buf.writeUInt16LE(chain, 0);
//         buf.writeBigInt64LE(sequence, 2);
//         return buf;
//       })(),
//     ],
//     programId
//   );
// }

// export interface Received {
//   batchId: number;
//   message: Buffer;
// }

// export async function getReceivedData(
//   connection: Connection,
//   programId: PublicKeyInitData,
//   chain: ChainId,
//   sequence: bigint
// ): Promise<Received> {
//   const received = await createHelloWorldProgramInterface(connection, programId)
//     .account.received.fetch(deriveReceivedKey(programId, chain, sequence));

//   return {
//     batchId: received.batchId as any,
//     message: received.message as Buffer
//   };
// }
  



