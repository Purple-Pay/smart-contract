// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./IWormholeRelayer.sol";
import "./IWormholeReceiver.sol";


contract CrossChainIdentityPOC is IWormholeReceiver {
    struct IDStruct {
		bytes namehash;
		address sender_address;
		bytes serialisedData;
		bytes[] multi_chain_address;
	}

	mapping(bytes => IDStruct) db; //mapping of nameHash => ID
	mapping(address => bytes) reverseDBMapping; //exists only on main chain!
    
    //****************************FUNCTIONS FOR NAMESPACE AND DATA ADDITION*************************/
	function isSenderRegistered(string memory _name,string memory _chain) public view returns (bool) {
		bytes memory nameHash = computeNameChainhash(_name, _chain);
		if (db[nameHash].sender_address == msg.sender) {
			return true;
		}
		return false;
	}

	function computeNameChainhash(string memory _name, string memory _chain) internal pure returns (bytes memory namehash) {
		namehash = abi.encode(_name, _chain);
	}

	function getNameHash(string memory _name, string memory _chain) external pure returns (bytes memory) {
		return computeNameChainhash(_name, _chain);
	}

	function getID(bytes memory nameHash) external view returns (IDStruct memory) {
		return db[nameHash];
	}

	function getSerialisedID(bytes memory nameHash) external view returns (bytes memory) {
		return db[nameHash].serialisedData;
	}

	function decode(bytes memory _data) external pure returns (string memory) {
		return abi.decode(_data, (string));
	}

	function fetchIDFromAddress() public view returns (IDStruct memory userID) {
		bytes memory nameHash = reverseDBMapping[msg.sender];
		return db[nameHash];
	}

	function storeID(string memory _name,string memory _parent_chain,string memory _data) external returns (IDStruct memory) {
		bool isRegistered = isSenderRegistered(_name, _parent_chain);

		if (isRegistered) {
			revert("Sender already registered");
		}

		bytes memory nameHash = computeNameChainhash(_name, _parent_chain);

		bytes memory serialisedData = abi.encode(_data); // other identity data

		// hashedChain is using address instead of string
		// address => string before hashing
		bytes memory hashedChain = abi.encode(_parent_chain, msg.sender);

		bytes[] memory multi_chain_address = new bytes[](1);

		multi_chain_address[0] = hashedChain;

		IDStruct memory id = IDStruct(
			nameHash,
			msg.sender,
			serialisedData,
			multi_chain_address
		);
		db[nameHash] = id;
		reverseDBMapping[msg.sender] = nameHash;

		return id;
	}

	function addChain(string memory _name,
		string memory _registered_chain,
		string memory _new_chain,
		string memory _new_chain_address
	) external {
		bytes memory nameHash = computeNameChainhash(_name, _registered_chain);

		if (db[nameHash].sender_address != msg.sender) {
			revert("Sender not registered");
		}

		bytes memory newHashedChain = abi.encode(
			_new_chain,
			_new_chain_address
		);

		db[nameHash].multi_chain_address.push(newHashedChain);
	}

	function decodeChain(
		bytes memory _hash
	) external pure returns (string memory chain, string memory user_address) {
		(chain, user_address) = abi.decode(_hash, (string, string));
	}

	function decodeRegisteringChain(
		bytes memory _hash
	) external pure returns (string memory chain, address user_address) {
		(chain, user_address) = abi.decode(_hash, (string, address));
	}

    //************************************** Wormhole Part ****************************************************** */    
    event IDSynced(IDStruct greeting, uint16 senderChain, address sender);

    uint256 constant GAS_LIMIT = 500_000;

    IWormholeRelayer public immutable wormholeRelayer;

    constructor(address _wormholeRelayer) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
    }

    function quoteCrossChainIdentitySyncPrice(uint16 targetChain) public view returns (uint256 cost) {
        (cost,) = wormholeRelayer.quoteEVMDeliveryPrice(targetChain, 0, GAS_LIMIT);
    }
 
    function syncCrossChainIdentity(uint16 targetChain, address targetAddress) public payable {
        bytes memory nameHash = reverseDBMapping[msg.sender];
        uint256 cost = quoteCrossChainIdentitySyncPrice(targetChain);
        require(msg.value == cost);
        IDStruct memory structToForward = db[nameHash];
        wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(structToForward, msg.sender), // payload
            0, // no receiver value needed since we're just passing a message
            GAS_LIMIT
        );
    }

    mapping(bytes32 => bool) public seenDeliveryVaaHashes;

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory, // additionalVaas
        bytes32, // address that called 'sendPayloadToEvm' (HelloWormhole contract address)
        uint16 sourceChain,
        bytes32 deliveryHash // this can be stored in a mapping deliveryHash => bool to prevent duplicate deliveries
    ) public payable override {
        require(msg.sender == address(wormholeRelayer), "Only relayer allowed");

        // Ensure no duplicate deliveries
        require(!seenDeliveryVaaHashes[deliveryHash], "Message already processed");
        seenDeliveryVaaHashes[deliveryHash] = true;

        // Parse the payload and do the corresponding actions!
        (IDStruct memory identity, address sender) = abi.decode(payload, (IDStruct, address));
        bytes memory nameHash = identity.namehash;
        db[nameHash] = identity;
        emit IDSynced(db[nameHash], sourceChain, sender);
    }

}