import {
	getSignedVAAWithRetry,
	parseVaa,
	CHAIN_ID_SOLANA,
	CHAIN_ID_ETH,
	postVaaSolana,
	isBytes,
} from "@certusone/wormhole-sdk";

import {CONTRACTS} from '@certusone/wormhole-sdk'
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createHelloWorldProgramInterface, deriveConfigKey, deriveForeignEmitterKey, deriveReceivedKey, payerToWallet } from "./utils";
import { derivePostedVaaKey } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole";
import { signSendAndConfirmTransaction } from "@certusone/wormhole-sdk/lib/cjs/solana";

const RPC_HOSTS = [
	/* ...*/
	"https://wormhole-v2-testnet-api.certus.one", //For testnet
];

//? how to get sequence ID of message
//? what is IDL

async function getVAA(
	emitter: string,
	sequence: string,
	chainId
): Promise<Uint8Array> {
	// Wait for the VAA to be ready and fetch it from
	// the guardian network
	const { vaaBytes } = await getSignedVAAWithRetry(
		RPC_HOSTS,
		chainId,
		emitter,
		sequence
	);
	return vaaBytes;
}

const contractOnPolygon = "0xdeadbeef"

const vaaBytes = await getVAA(contractOnPolygon,"1", CHAIN_ID_ETH);


const NETWORK = "solana"

export const WORMHOLE_CONTRACTS = CONTRACTS[NETWORK];
export const CORE_BRIDGE_PID = new PublicKey(WORMHOLE_CONTRACTS.solana.core);

const programId = "" //contract address on solana
const connection = new Connection("https://api.devnet.solana.com");
const signer = new Keypair();
const wallet = payerToWallet(signer)
const wormholeProgramId = "" //Add wormhole core contract address on solana testnet



// First, post the VAA to the core bridge
await postVaaSolana(
    connection,
    wallet.signTransaction,
    CORE_BRIDGE_PID,
    wallet.key(),
    vaaBytes as any
);

const program = createHelloWorldProgramInterface(connection, programId);
const parsed = isBytes(wormholeMessage)
    ? parseVaa(wormholeMessage)
    : wormholeMessage;

const ix = await program.methods
    .receiveMessage([...parsed.hash])
    .accounts({
        payer: new PublicKey(signer),
        config: deriveConfigKey(programId),
        wormholeProgram: new PublicKey(wormholeProgramId),
        posted: derivePostedVaaKey(wormholeProgramId, parsed.hash),
        foreignEmitter: deriveForeignEmitterKey(programId, parsed.emitterChain),
        received: deriveReceivedKey(
        programId,
        parsed.emitterChain,
        parsed.sequence
        ),
    })
    .instruction();

const transaction = new Transaction().add(ix);
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = new PublicKey(signer.publicKey);

const txid = await signSendAndConfirmTransaction(
	connection,
	new PublicKey(signer.publicKey),
	wallet.signTransaction,
	transaction
)

console.log("txid :", txid.response.toString());

// await connection.confirmTransaction(txid);



