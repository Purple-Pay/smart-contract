const { ethers, upgrades } = require("hardhat");

async function main() {
	const gas = await ethers.provider.getGasPrice();
	const burnerContract = await ethers.getContractFactory(
		"PurplePayBurnerDeployer"
	);
	console.log("Deploying PurplePayBurnerDeployer...");
	// deploy

	const contract = await burnerContract.deploy(
		"0x0000000000000000000000000000000000001010"
	);
	await contract.deployed();
	console.log("PurplePayBurnerDeployer deployed to:", contract.address);

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
