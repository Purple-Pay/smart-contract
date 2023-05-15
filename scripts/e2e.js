const { ethers } = require("hardhat");
const chalk = require("chalk");

const { v4: uuidv4 } = require("uuid");

let salt = "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const tokenAddress = "0x0000000000000000000000000000000000001010";
const amount = "10000000000000000";
const merchantAddress = "0x107C189B0aa1C309bA65FD6fc22bE1AA513A459C";
const purplePayAddress = "0xf229ceB323115a30EDEd92A953BA5c581e99751C";

const getBalance = async (address, label) => {
	const balance = await ethers.provider.getBalance(address);
	console.log(`Balance of ${label}`);
	console.log(`${address}: ${ethers.utils.formatEther(balance)}`);
	console.log(``);
};

const predictAddress = async (contract) => {
	const res = await contract.predictAddress(
		salt,
		tokenAddress,
		amount,
		merchantAddress,
		purplePayAddress
	);

	return res;
};

const deployBurner = async (contract) => {
	const res = await contract.deploy(
		salt,
		tokenAddress,
		amount,
		merchantAddress,
		purplePayAddress
	);

	return res;
};

const main = async () => {
	try {
		salt = uuidv4().replace(/-/g, "");

		const [owner] = await ethers.getSigners();

		const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
		const deployerContract = await ethers.getContractFactory(
			"PurplePayBurnerDeployer"
		);
		const contract = deployerContract.attach(address);

		// balance of owner address
		await getBalance(owner.address, "Owner address");

		// balance of merchant address
		await getBalance(merchantAddress, "Merchant address");

		// balance of purplepay address
		await getBalance(purplePayAddress, "PurplePay address");

		// predict address
		const predictedAddress = await predictAddress(contract);

		await getBalance(predictedAddress, "Predicted address");

		// send amount to predicted address
		await owner.sendTransaction({
			from: owner.address,
			to: predictedAddress,
			value: ethers.utils.parseEther("0.1"),
		});

		// balance of predicted address
		await getBalance(predictedAddress, "POST transfer: Predicted address");

		// deploy burner
		await deployBurner(contract);

		// balance of merchant address
		await getBalance(merchantAddress, "Merchant address");

		// balance of purplepay address
		await getBalance(purplePayAddress, "PurplePay address");
	} catch (error) {
		console.error(error);
	}
};

main();
