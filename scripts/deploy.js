const { ethers, upgrades } = require("hardhat");

async function main() {
	const purpleProtocol = await ethers.getContractFactory("PurpleProtocol");
	console.log("Deploying PurpleProtocol...");

	const contract = await purpleProtocol.deploy({});
	console.log("PurpleProtocol being deployed...");

	await contract.deployed();
	console.log("PurpleProtocol deployed to:", contract.address);

	await contract.pauseContract();
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
