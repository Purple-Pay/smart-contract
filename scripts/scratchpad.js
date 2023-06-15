const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const main = async () => {
	const provider = new HDWalletProvider(
		"b237f649ffc422a5b2546911b2d948ae9cf0366d2840fc86b097a86420b91833",
		"https://astar.public.blastapi.io"
	);

	const wallet = new ethers.providers.Web3Provider(provider);

	const signer = wallet.getSigner();
	const address = await signer.getAddress();

	console.log("Got signer", address);

	const contract = new ethers.Contract(
		"0x9afd73664942DaA64aa67075F831539d453E7777",
		[
			{
				inputs: [],
				name: "PausedContract",
				type: "error",
			},
			{
				anonymous: false,
				inputs: [
					{
						indexed: true,
						internalType: "address",
						name: "previousOwner",
						type: "address",
					},
					{
						indexed: true,
						internalType: "address",
						name: "newOwner",
						type: "address",
					},
				],
				name: "OwnershipTransferred",
				type: "event",
			},
			{
				inputs: [
					{
						internalType: "string",
						name: "_salt",
						type: "string",
					},
					{
						internalType: "address",
						name: "_tokenAddress",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "_amount",
						type: "uint256",
					},
					{
						internalType: "address",
						name: "_merchantAddress",
						type: "address",
					},
					{
						internalType: "address",
						name: "_purplePayMultiSig",
						type: "address",
					},
				],
				name: "deploy",
				outputs: [
					{
						internalType: "address",
						name: "",
						type: "address",
					},
				],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [],
				name: "isPaused",
				outputs: [
					{
						internalType: "bool",
						name: "",
						type: "bool",
					},
				],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "owner",
				outputs: [
					{
						internalType: "address",
						name: "",
						type: "address",
					},
				],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "pauseContract",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [
					{
						internalType: "string",
						name: "_salt",
						type: "string",
					},
					{
						internalType: "address",
						name: "_tokenAddress",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "_amount",
						type: "uint256",
					},
					{
						internalType: "address",
						name: "_merchantAddress",
						type: "address",
					},
					{
						internalType: "address",
						name: "_purplePayMultiSig",
						type: "address",
					},
				],
				name: "predictAddress",
				outputs: [
					{
						internalType: "address",
						name: "",
						type: "address",
					},
				],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "renounceOwnership",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [
					{
						internalType: "address",
						name: "newOwner",
						type: "address",
					},
				],
				name: "transferOwnership",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
		],
		signer
	);

	console.log("Got contract", contract.address);

	const response = await contract.isPaused();

	console.log(response);
};

main();
