const { ethers, upgrades } = require("hardhat");

async function main() {
	const gas = await ethers.provider.getGasPrice();
	const burnerContract = await ethers.getContractFactory("CrossChainKYCPOC");
	console.log("Deploying PurplePay...");
	// deploy

	const contract = await burnerContract.deploy();
	await contract.deployed();

	console.log("PurplePay deployed to:", contract.address);

	// const contract = await upgrades.deployProxy(burnerContract);
	// await contract.deployed();
	// console.log("V1 Contract deployed to:", contract.address);
	// upgrade
	// let upgrade = await upgrades.upgradeProxy(UPGRADEABLE_PROXY, V2Contract, {
	//     gasPrice: gas
	//  });
	//  console.log("V1 Upgraded to V2");
	//  console.log("V2 Contract Deployed To:", upgrade.address)
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

// polygon: 0x760e332E05681a3f36AD67fc6767ea8176AFf1fA
// mumbai:  0x09FFbf75FC24b4Ce3A434352Fb7c3839600ffcC8
// goerli:  0x711E1250e5f89f084F15A429ec864FE14A3B9B7C
// shibuya: 0x9afd73664942DaA64aa67075F831539d453E7777
