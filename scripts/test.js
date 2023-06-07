const { ethers } = require("hardhat");
const chalk = require("chalk");

const logger = (label, data = "") => {
	console.log("");
	console.log("====================================");
	console.log(chalk.yellow(label));
	console.log("------------------------------------");
	console.log(chalk.blue(JSON.stringify(data, null, 4)));
	console.log("------------------------------------");
	console.log("");
};

const storeIDOnChain = async (contract, name, chain) => {
	console.log(chalk.yellow("Storing ID on chain..."));

	const res = await contract.storeID(name, chain);

	console.log(chalk.green("Stored ID on chain..."));

	logger("Stored ID on chain", { name, chain });

	return res;
};

const getChains = async (contract, name, chain) => {
	console.log(chalk.yellow("Getting chains from chain..."));

	const res = await contract.getRegisteredChains(name, chain);

	logger("All chains", res);
};

const getName = async (contract, name, chain) => {
	console.log(chalk.yellow("Getting name from chain..."));

	const res = await contract.getNameHash(name, chain);

	console.log(chalk.green("Got name from chain..."));

	return res;
};

const getID = async (contract, name, parentChain) => {
	const nameHash = await getName(contract, name, parentChain);
	console.log(chalk.yellow("Getting ID from chain..."));
	const res = await contract.getID(nameHash);
	console.log(chalk.green("Got ID from chain..."));

	logger("ID Struct", res);

	return res;
};

const decodeData = async (contract, data) => {
	console.log(chalk.yellow("Getting decoded data..."));

	const res = await contract.decode(data);

	console.log(chalk.green("Got decoded data..."));

	logger("Decoded serialised data", res);
};

const addChain = async (contract, name, parentChain, newChain, newAddress) => {
	console.log(chalk.yellow("Adding chain to chain..."));
	console.log({ name, parentChain, newChain, newAddress });

	const res = await contract.addChain(
		name,
		parentChain,
		newChain,
		newAddress
	);

	console.log(chalk.green("Added chain to chain..."));

	return res;
};

const main = async () => {
	try {
		const [owner] = await ethers.getSigners();

		const address = "0x5067457698fd6fa1c6964e416b3f42713513b3dd";
		const deployerContract = await ethers.getContractFactory(
			"CrossChainKYCPOC"
		);
		const contract = deployerContract.attach(address);

		const name = "abhishekkumar.eth";
		const parentChain = "polygon";

		await storeIDOnChain(contract, name, parentChain);

		const structResponse = await getID(contract, name, parentChain);

		const [_nameHash, _address, serialisedData] = structResponse;

		await decodeData(contract, serialisedData);

		const newChain = "ethereum";
		const newAddress = "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707";
		await addChain(contract, name, parentChain, newChain, newAddress);

		logger("Clone data from Polygon to Ethereum's SC");

		const newChain1 = "solana";
		const newAddress1 = "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707123";
		await addChain(contract, name, parentChain, newChain1, newAddress1);

		logger("Clone data from Polygon to Solana's SC");
		logger("Update existing Ethereum's SC with the Solana being added");

		const [nameHash, ad, data, chains] = await getID(
			contract,
			name,
			parentChain
		);

		const [registeringChainData, ...otherChains] = chains;

		const registeringChain = await contract.decodeRegisteringChain(
			registeringChainData
		);

		logger("Registering chain", registeringChain);

		const allChains = otherChains.map(
			async (hash) => await contract.decodeChain(hash)
		);
		const response = await Promise.all(allChains);

		logger("Other chains", response);
	} catch (error) {
		console.error(error);
	}
};

main();
