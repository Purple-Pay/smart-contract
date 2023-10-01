const { ethers } = require("hardhat");

async function main() {
	const purpleProtocol = await ethers.getContractFactory(
		"PurpleProtocolDeployerFactory"
	);
	console.log("Deploying PurpleProtocol...");

	const contract = await purpleProtocol.deploy({});
	console.log("PurpleProtocol being deployed...");

	await contract.deployed();
	console.log("PurpleProtocol deployed to:", contract.address);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
