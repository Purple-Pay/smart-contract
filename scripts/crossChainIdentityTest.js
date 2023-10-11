const { ethers } = require("hardhat");
const { tryNativeToHexString, CHAINS } = require("@certusone/wormhole-sdk");
const abi = require("../abi/crossChainIdentityABI.json");
const { ethers_contracts } = require("@certusone/wormhole-sdk");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chainIdToWormholeCoreAddress = {
	80001: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
	44787: "0x88505117CA88e7dd2eC6EA1E13f0948db2D50D56",
};

const chainIdToWormholeRelayerAddress = {
	80001: "0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0",
	44787: "0x306B68267Deb7c5DfCDa3619E22E9Ca39C374f84",
};

async function getDeliveryHash(rx, chainId, provider) {
	console.log({ rx, chainId, provider });
	const sourceChain = "Polygon";
	const wormholeAddress = chainIdToWormholeCoreAddress[chainId];
	if (!wormholeAddress) {
		throw Error(`No wormhole contract on ${sourceChain}`);
	}
	const wormholeRelayerAddress = chainIdToWormholeRelayerAddress[chainId];
	if (!wormholeRelayerAddress) {
		throw Error(`No wormhole relayer contract on ${sourceChain}`);
	}
	console.log("Found required addresses");
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
	console.log(`Log is ${log}`);
	const wormholePublishedMessage =
		ethers_contracts.Implementation__factory.createInterface().parseLog(
			log
		);
	console.log(`wormholePublishedMessage is ${wormholePublishedMessage}`);
	const block = await provider.getBlock(rx.blockHash);
	console.log(`block is ${block}`);
	const body = ethers.utils.solidityPack(
		["uint32", "uint32", "uint16", "bytes32", "uint64", "uint8", "bytes"],
		[
			block.timestamp,
			wormholePublishedMessage.args["nonce"],
			5,
			log.topics[1],
			wormholePublishedMessage.args["sequence"],
			wormholePublishedMessage.args["consistencyLevel"],
			wormholePublishedMessage.args["payload"],
		]
	);

	console.log(`body is ${body}`);

	const deliveryHash = ethers.utils.keccak256(ethers.utils.keccak256(body));
	console.log(`Delivery hash is ${deliveryHash}`);
	return deliveryHash;
}

const main = async () => {
	try {
		const fromChainContractAddress =
			"0x4E30009F3EDD4B6809b6836BBa6d9A95df853f9E"; //mumbai
		const providerPolygon = new ethers.providers.JsonRpcProvider(
			"https://polygon-testnet.public.blastapi.io"
		);
		const walletPolygon = new ethers.Wallet(
			process.env.PRIVATE_KEY,
			providerPolygon
		);
		const mainChainContract = new ethers.Contract(
			fromChainContractAddress,
			abi,
			providerPolygon
		);
		const contract = mainChainContract.connect(walletPolygon);

		const name = "HelloWorld1.eth";
		const chain = "polygon";

		const isSenderRegistered = await contract.isSenderRegistered(
			name,
			chain
		);
		console.log(isSenderRegistered);
		if (isSenderRegistered) {
			console.log("User already registered find a new namespace");
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
			"Adding address of different chain (solana with address 0x1234"
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
		console.log("Chain Added successfully");
		const dataPacket = await contract.fetchIDFromAddress();
		console.log("Identity now is : ", dataPacket);

		console.log("Toggling KYC....");
		const toggleRes = await contract.toggleKYC(nameHash);
		console.log("KYC Toggled :", { toggleRes });

		console.log("KYC successfully");
		const dataPacket1 = await contract.fetchIDFromAddress();
		console.log("Identity now is : ", dataPacket1);

		//Let's begin the cross chain piece :)
		//sending this datapacket crossChain

		const cost = await contract.quoteCrossChainIdentitySyncPrice(14);
		console.log(
			`Cost of sending the greeting: ${ethers.utils.formatEther(
				cost
			)} testnet Polygon Mumbai`
		);
		console.log(`Sending dataPacket: ${dataPacket}`);
		const destinationContractAddress =
			"0xe2945a7AED7439D9c955D42f18d0dB31B7aa6df8";
		const tx = await contract.syncCrossChainIdentity(
			14,
			destinationContractAddress,
			{
				value: cost,
				gasLimit: 500000,
			}
		);

		const rx = await tx.wait();
		console.log(`Transaction hash: ${tx.hash}`);

		const deliveryHash = await getDeliveryHash(rx, 80001, providerPolygon);

		// celo starts
		const providerCelo = new ethers.providers.JsonRpcProvider(
			"https://alfajores-forno.celo-testnet.org"
		);
		const destinationChainContract = new ethers.Contract(
			destinationContractAddress,
			abi,
			providerCelo
		);

		const walletCelo = new ethers.Wallet(
			process.env.PRIVATE_KEY,
			providerCelo
		);
		const destContract = destinationChainContract.connect(walletCelo);
		console.log("Waiting for delivery...");
		while (true) {
			await sleep(1000);
			const completed = await destContract.seenDeliveryVaaHashes(
				deliveryHash
			);
			console.log(`isCompleted : ${completed}`);
			if (completed) {
				break;
			}
		}
		//Reading Identity from celo contract

		console.log("getting id on celo chain");
		const celoId = await destContract.getID(nameHash);
		console.log("celo id is :", celoId);
	} catch (error) {
		console.error(error);
	}
};

main();
