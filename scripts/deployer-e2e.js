const { ethers } = require("hardhat");
const chalk = require("chalk");

const main = async () => {
	try {
		// PurpleProtocolDeployerFactory deployer address
		// Only for testing, you don't need to deploy this
		const deployerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";

		const [owner] = await ethers.getSigners();
		const deployerContract = await ethers.getContractFactory(
			"PurpleProtocolDeployerFactory"
		);
		const contract = deployerContract.attach(deployerAddress);

		const res = await contract.deployPurpleProtocol(owner.address, 100);

		const response = await res.wait();

		console.log({ response, res });

		// console.log(
		// 	chalk.green(`New Deployer address: ${JSON.stringify(response)}`)
		// );
	} catch (error) {
		console.error(error);
	}
};

main();
