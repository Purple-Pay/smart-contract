require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const private_key = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.19",
	networks: {
		goerli: {
			url: `https://eth-goerli.api.onfinality.io/public`,
			accounts: [private_key],
		},
		matic: {
			url: `https://polygon.llamarpc.com`,
			accounts: [private_key],
		},
		mumbai: {
			url: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
			accounts: [private_key],
		},
		shibuya: {
			url: "https://evm.shibuya.astar.network",
			chainId: 81,
			accounts: [private_key],
		},
		astar: {
			url: "https://astar.public.blastapi.io",
			chainId: 592,
			accounts: [private_key],
		},
		mantleTestnet: {
			url: "https://rpc.testnet.mantle.xyz",
			chainId: 5001,
			accounts: [private_key],
		},
	},
	etherscan: {
		apiKey: {
			goerli: "I3542R4GUIGY42EGBWUTPAKHEI33UDYGVQ",
			polygonMumbai: "6U5Q2T3HVNYVAVKFMXID47H5F9JRJ3KDNB",
			polygon: "6U5Q2T3HVNYVAVKFMXID47H5F9JRJ3KDNB",
		},
	},
};
