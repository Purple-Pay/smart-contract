require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("--> ", process.env.PRIVATE_KEY);

const private_key = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.18",
	networks: {
		goerli: {
			url: `https://eth-goerli.api.onfinality.io/public`,
			accounts: [private_key],
		},
		matic: {
			url: `https://rpc-mainnet.maticvigil.com/v1/`,
			accounts: [private_key],
		},
		mumbai: {
			url: "https://rpc.ankr.com/polygon_mumbai",
			accounts: [private_key],
		},
	},
	etherscan: {
		apiKey: {
			goerli: "I3542R4GUIGY42EGBWUTPAKHEI33UDYGVQ",
		},
	},
};
