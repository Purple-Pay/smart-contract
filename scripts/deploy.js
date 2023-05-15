const { ethers, upgrades } = require("hardhat");

async function main() {
	const gas = await ethers.provider.getGasPrice();
	const burnerContract = await ethers.getContractFactory("PurplePay");
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

// polygon: 0x68B1d4A8BE40d1Db5000e5Ea374F910acC9ba024
// mumbai: 0x0A18A0cE3103Cd3Cdb1181d1AcC89bF9534A77D8
// goerli: 0x60b5477329527f5644dD94DA3b0933A9Ce17f65D
