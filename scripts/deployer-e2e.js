const { ethers } = require("hardhat");
const chalk = require("chalk");

const { v4: uuidv4 } = require("uuid");

const main = async () => {
	try {
		// PurpleProtocolDeployerFactory deployer address
		// Only for testing, you don't need to deploy this
		const deployerAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

		const [owner] = await ethers.getSigners();
		const deployerContract = await ethers.getContractFactory(
			"PurpleProtocol"
		);
		const contract = deployerContract.attach(deployerAddress);

		const res = await contract.deployPurpleProtocol(owner.address, 100);

		console.log(chalk.green(`New Deployer address: ${res}`));
	} catch (error) {
		console.error(error);
	}
};

main();
