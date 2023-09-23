import {
	parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import abi from "../abi/helloworld.json";


const main = async()=>{
	// On Polygon Mumbai
	const emmitterAddress = "0x43bE81D5eb04cDaC7cAEf4E546EdED15bA46522c"
	const providerPolygon = new ethers.providers.JsonRpcProvider(
		"https://polygon-testnet.public.blastapi.io"
	);
	const walletPolygon = new ethers.Wallet(
		process.env.PRIVATE_KEY!,
		providerPolygon
	);
	const helloWorldContractPolygon = new ethers.Contract(
		emmitterAddress,
		abi,
		providerPolygon
	);
	// console.log({helloWorldContractPolygon})
	const contract = helloWorldContractPolygon.connect(walletPolygon)
	console.log("Got Contract Sending Message");
	
    const name = "hello8.eth";
	const chain = "polygon";

	const isSenderRegistered = await contract.isSenderRegistered(
		name,
		chain
	);
	console.log(isSenderRegistered);
	if (isSenderRegistered) {
			console.log("User already registered find a new namespace");
            const currentID = await contract.fetchIDFromAddress();
	        console.log("Current ID: " + currentID);
            return;
	}

	const registerId = await contract.storeID(name, chain, ""); //initially no data
	console.log("Registering : ", registerId);

	const nameHash = await contract.getNameHash(name, chain);
	console.log("Name hash is : ", nameHash);

	console.log("Fetching current ID from contract");
	const currentID = await contract.fetchIDFromAddress();
	console.log("Current ID: " + currentID);

	console.log(
			"Adding address of different chain (solana with address 0x1234)"
	);
	const addChain = await contract.addChain(
			name,
			chain,
			"solana",
			"0x1234",
			{
				gasLimit: 50000,
			}
		);
	console.log("Chain Added successfully");
	const dataPacket = await contract.fetchIDFromAddress();
	console.log("Identity now is : ", dataPacket);

    
    const sendMessageTransaction = await contract.sendMessage()
	const sendMessageTransactionReciept = await sendMessageTransaction.wait();

	const seq = parseSequenceFromLogEth(sendMessageTransactionReciept,"0x0CBE91CF822c73C2315FB05100C2F714765d5c20")
	console.log("seq:",seq);
	
	const vaa = await getVAAFromAPI(emmitterAddress, seq, 5); // 5 for polygon
	console.log("VAA :",vaa);

    const vaaBytes = ethers.utils.toUtf8Bytes(vaa as string);
    console.log("VAA bytes :",vaaBytes);

    const destinationContractAddress = "0x57AF6AcEE438d96F5E95470b3Ba2B04d3D79E084"

    const providerCelo = new ethers.providers.JsonRpcProvider(
        "https://alfajores-forno.celo-testnet.org"
    );
    const destinationChainContract = new ethers.Contract(
        destinationContractAddress,
        abi,
        providerCelo
    );

    const walletCelo = new ethers.Wallet(
        process.env.PRIVATE_KEY!,
        providerCelo
    );
    const destContract = destinationChainContract.connect(walletCelo);
    console.log("Waiting for delivery...");

    const receipt = await destContract
    .receiveMessage(vaaBytes, {gasLimit: 5000000 })
    .then((tx: ethers.ContractTransaction) => tx.wait())
    .catch((msg: any) => {
        console.error(msg);
        return null;
    });

    console.log("Received message!", receipt);

    console.log("getting id on celo chain");
	const celoId = await destContract.getID(nameHash);
	console.log("celo id is :", celoId);

}

main();

export const getVAAFromAPI = async (emitter: string,sequence: string,chainId):Promise<String>=>{
	const url = `https://api.testnet.wormholescan.io/api/v1/vaas/${chainId}/${emitter}/${sequence}`;
	const response = await fetch(url);
	const res = await response.json();
	const data = res.data;
	console.log(data);
	const vaa = data.vaa;

	return vaa;

}
  



