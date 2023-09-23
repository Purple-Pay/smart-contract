const { ethers, upgrades } = require("hardhat");

async function main() {
	const chainIDToCoreAddress = {
		80001: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
		44787: "0x306B68267Deb7c5DfCDa3619E22E9Ca39C374f84",
	};

	const chainIDToWormholeChainId = {
		80001: 5,
		44787: 14,
	};

	const gas = await ethers.provider.getGasPrice();
	const network = await ethers.provider.getNetwork();
	const chainId = network.chainId;
	console.log(`Deploying to chain ${chainId}`);
	const coreAddress = chainIDToCoreAddress[chainId];
	const wormholeFinality = 1;
	console.log("Deploying HelloWorld...");
	const wormholecontract = await ethers.deployContract("HelloWorld", [
		coreAddress,
		chainIDToWormholeChainId[chainId],
		wormholeFinality,
	]);
	console.log("HelloWorld being deployed...");
	await wormholecontract.deployed();
	console.log("HelloWorld deployed to:", wormholecontract.address);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
