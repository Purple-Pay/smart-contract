const { ethers, upgrades } = require("hardhat");

async function main() {
	const chainIDToRelayerAddress = {
		44787: "0x306B68267Deb7c5DfCDa3619E22E9Ca39C374f84",
		80001: "0x0591C25ebd0580E0d4F27A82Fc2e24E7489CB5e0",
	};
	const gas = await ethers.provider.getGasPrice();
	const network = await ethers.provider.getNetwork();
	const chainId = network.chainId;
	console.log(`Deploying to chain ${chainId}`);
	const relayerAddress = chainIDToRelayerAddress[chainId];
	console.log("Deploying CrossChainIdentityPOC...");
	const wormholecontract = await ethers.deployContract(
		"CrossChainIdentityPOC",
		[relayerAddress]
	);
	console.log("CrossChainIdentityPOC being deployed...");
	await wormholecontract.deployed();
	console.log("CrossChainIdentityPOC deployed to:", wormholecontract.address);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
