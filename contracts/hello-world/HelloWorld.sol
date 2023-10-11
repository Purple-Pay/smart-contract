// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "../modules/wormhole/IWormhole.sol";
import "../modules/utils/BytesLib.sol";

import "./HelloWorldGetters.sol";
import "./HelloWorldMessages.sol";

contract HelloWorld is HelloWorldGetters, HelloWorldMessages {
    using BytesLib for bytes;

    constructor(address wormhole_, uint16 chainId_, uint8 wormholeFinality_) {
        // sanity check input values
        require(wormhole_ != address(0), "invalid Wormhole address");
        require(chainId_ > 0, "invalid chainId");
        require(wormholeFinality_ > 0, "invalid wormholeFinality");

        // set constructor state values
        setOwner(msg.sender);
        setWormhole(wormhole_);
        setChainId(chainId_);
        setWormholeFinality(wormholeFinality_);
    }

    struct IDStruct {
		bool isVerified;
		address sender_address;
		bytes namehash;
		bytes solana_address;
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

	function getSerialisedID(bytes memory nameHash) external view returns (bool) {
		return db[nameHash].isVerified;
	}

	function decode(bytes memory _data) external pure returns (string memory) {
		return abi.decode(_data, (string));
	}

	function fetchIDFromAddress() public view returns (IDStruct memory userID) {
		bytes memory nameHash = reverseDBMapping[msg.sender];
		return db[nameHash];
	}

	function getEncodedID() public view returns (bytes memory) {
		bytes memory nameHash = reverseDBMapping[msg.sender];
		IDStruct memory userID = db[nameHash];
		return abi.encode(userID);
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

		IDStruct memory id = IDStruct(
			false,
			msg.sender,
			serialisedData,
			bytes("")
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

		db[nameHash].solana_address = newHashedChain;
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

    //WORMHOLE PART

    function sendMessage() public payable returns (uint64 messageSequence) {
        bytes memory nameHash = reverseDBMapping[msg.sender];
		IDStruct memory idStruct = db[nameHash];
        require(
            abi.encodePacked(nameHash).length < type(uint16).max,
            "message too large"
        );

        IWormhole wormhole = wormhole();
        uint256 wormholeFee = wormhole.messageFee();
        require(msg.value == wormholeFee, "insufficient value");
        messageSequence = wormhole.publishMessage{value: wormholeFee}(
            0, // batchID
            abi.encode(idStruct),
            wormholeFinality()
        );
    }

    function receiveMessage(bytes memory encodedMessage) public {
        // call the Wormhole core contract to parse and verify the encodedMessage
        (
            IWormhole.VM memory wormholeMessage,
            bool valid,
            string memory reason
        ) = wormhole().parseAndVerifyVM(encodedMessage);

        require(valid, reason);
        require(verifyEmitter(wormholeMessage), "unknown emitter");

        (IDStruct memory identity) = abi.decode(wormholeMessage.payload, (IDStruct));
        bytes memory nameHash = identity.namehash;
        db[nameHash] = identity;
        require(!isMessageConsumed(wormholeMessage.hash), "message already consumed");
        string memory converted = string(nameHash);
        consumeMessage(wormholeMessage.hash, converted);
    }

    function registerEmitter(
        uint16 emitterChainId,
        bytes32 emitterAddress
    ) public onlyOwner {
        require(
            emitterChainId != 0 && emitterChainId != chainId(),
            "emitterChainId cannot equal 0 or this chainId"
        );
        require(
            emitterAddress != bytes32(0),
            "emitterAddress cannot equal bytes32(0)"
        );
        setEmitter(emitterChainId, emitterAddress);
    }

    function verifyEmitter(IWormhole.VM memory vm) internal view returns (bool) {
        return getRegisteredEmitter(vm.emitterChainId) == vm.emitterAddress;
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "caller not the owner");
        _;
    }
}
