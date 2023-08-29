const { ethers, upgrades } = require("hardhat");
const { tryNativeToHexString, CHAINS } = require("@certusone/wormhole-sdk");
const { networks } = require("../hardhat.config");
const abi = require("../abi/wormholeContractABI.json");

const chainIdToWormholeCoreAddress = {
	80001: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
	44787: "0x88505117CA88e7dd2eC6EA1E13f0948db2D50D56",
};

const chainIdToWormholeRelayerAddress = {
	80001: "0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0",
	44787: "0x306B68267Deb7c5DfCDa3619E22E9Ca39C374f84",
};

const sendDataPacket = async () => {
	const fromChainId = 80001;
	const toChainId = 44787;

	// struct IDStruct {
	//     bytes namehash;
	//     address sender_address;
	//     bytes serialisedData;
	//     bytes[] multi_chain_address;
	// }
	const dataPacket = {
		namehash: "0xabcd",
		sender_address: "0x648668c642855594FB48c50Fb5dc388fF86f94b9",
		serialisedData: "0xabcd",
		multi_chain_address: [],
	};

	const fromChainContractAddress =
		"0x2882726d9515bf551992B3557FDB07fDeD900e44"; //mumbai
	const providerPolygon = new ethers.providers.JsonRpcProvider(
		"https://polygon-testnet.public.blastapi.io"
	);
	const walletPolygon = new ethers.Wallet(
		process.env.PRIVATE_KEY,
		providerPolygon
	);
	const fromChainSimpleWormholeContract = new ethers.Contract(
		fromChainContractAddress,
		abi,
		providerPolygon
	);

	const providerCelo = new ethers.providers.JsonRpcProvider(
		"https://alfajores-forno.celo-testnet.org"
	);
	const walletCelo = new ethers.Wallet(process.env.PRIVATE_KEY, providerCelo);
	const toChainContractAddress = "0x4DF706A2d818D7e6b3dBc19C088eB14960280CcC"; //celo testnet
	const toChainSimpleWormholeContract = new ethers.Contract(
		toChainContractAddress,
		abi,
		providerCelo
	);

	console.log("GOT CONTRACTS");

	//Sending Transaction from Polygon Mumbai
	const cost = await fromChainSimpleWormholeContract.quoteCrossChainGreeting(
		14
	);
	console.log(
		`Cost of sending the greeting: ${ethers.utils.formatEther(
			cost
		)} testnet Polygon Mumbai`
	);
	console.log(`Sending dataPacket: ${dataPacket}`);
	const tx = await fromChainSimpleWormholeContract
		.connect(walletPolygon)
		.sendCrossChainIdentity(toChainId, toChainContractAddress, dataPacket, {
			value: cost,
			gasLimit: 50000,
		});
	console.log(`Transaction hash: ${tx.hash}`);
	const rx = await tx.wait();

	const deliveryHash = await getDeliveryHash(rx, fromChainId, provider);

	console.log("Waiting for delivery...");
	while (true) {
		await sleep(1000);
		const completed = await toChainSimpleWormholeContract
			.connect(walletCelo)
			.seenDeliveryVaaHashes(deliveryHash);
		if (completed) {
			break;
		}
	}

	console.log(`Reading Datapacket`);
	const readIdentity = await toChainSimpleWormholeContract
		.connect(walletCelo)
		.latestIdentityRecieved();
	console.log(`Latest identity: ${identity}`);
};

async function getDeliveryHash(rx, chainId, provider) {
	const sourceChain = "Polygon";
	const wormholeAddress = chainIdToWormholeCoreAddress[chainId];
	if (!wormholeAddress) {
		throw Error(`No wormhole contract on ${sourceChain}`);
	}
	const wormholeRelayerAddress = chainIdToWormholeRelayerAddress[chainId];
	if (!wormholeRelayerAddress) {
		throw Error(`No wormhole relayer contract on ${sourceChain}`);
	}
	const log = rx.logs.find(
		(log) =>
			log.address.toLowerCase() === wormholeAddress.toLowerCase() &&
			log.topics[1].toLowerCase() ===
				"0x" +
					tryNativeToHexString(
						wormholeRelayerAddress,
						"ethereum"
					).toLowerCase()
	);
	if (!log) throw Error("No wormhole relayer log found");
	const wormholePublishedMessage =
		ethers_contracts.Implementation__factory.createInterface().parseLog(
			log
		);
	const block = await provider.getBlock(rx.blockHash);
	const body = ethers.utils.solidityPack(
		["uint32", "uint32", "uint16", "bytes32", "uint64", "uint8", "bytes"],
		[
			block.timestamp,
			wormholePublishedMessage.args["nonce"],
			CHAINS[sourceChain],
			log.topics[1],
			wormholePublishedMessage.args["sequence"],
			wormholePublishedMessage.args["consistencyLevel"],
			wormholePublishedMessage.args["payload"],
		]
	);
	const deliveryHash = ethers.utils.keccak256(ethers.utils.keccak256(body));
	return deliveryHash;
}

sendDataPacket();
