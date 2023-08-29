// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./IWormholeRelayer.sol";
import "./IWormholeReceiver.sol";

contract SimpleDataTransfer is IWormholeReceiver {
    struct IDStruct {
		bytes namehash;
		address sender_address;
		bytes serialisedData;
		bytes[] multi_chain_address;
	}

    event IdentityReceived(IDStruct identity, uint16 senderChain, address sender);

    uint256 constant GAS_LIMIT = 50_000;

    IWormholeRelayer public immutable wormholeRelayer;

    IDStruct public latestIdentityRecieved;

    constructor(address _wormholeRelayer) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
    }

    function quoteCrossChainGreeting(uint16 targetChain) public view returns (uint256 cost) {
        (cost,) = wormholeRelayer.quoteEVMDeliveryPrice(targetChain, 0, GAS_LIMIT);
    }

    function sendCrossChainIdentity(uint16 targetChain, address targetAddress, IDStruct memory identity) public payable {
        uint256 cost = quoteCrossChainGreeting(targetChain);
        require(msg.value == cost);
        wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(identity, msg.sender), // payload
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
        latestIdentityRecieved = identity;
        emit IdentityReceived(latestIdentityRecieved, sourceChain, sender);
    }

}