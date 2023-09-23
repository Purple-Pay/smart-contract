// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "../modules/wormhole/IWormhole.sol";
import "../modules/utils/BytesLib.sol";

import "./HelloWorldGetters.sol";
import "./HelloWorldMessages.sol";

contract HelloWorld is HelloWorldGetters, HelloWorldMessages {
    using BytesLib for bytes;
    string public id_string;

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

    function sendMessage(
        string memory helloWorldMessage
    ) public payable returns (uint64 messageSequence) {
        require(
            abi.encodePacked(helloWorldMessage).length < type(uint16).max,
            "message too large"
        );
        IWormhole wormhole = wormhole();
        uint256 wormholeFee = wormhole.messageFee();
        id_string = helloWorldMessage;

        require(msg.value == wormholeFee, "insufficient value");

        HelloWorldMessage memory parsedMessage = HelloWorldMessage({
            payloadID: uint8(1),
            message: helloWorldMessage
        });

        bytes memory encodedMessage = encodeMessage(parsedMessage);

        messageSequence = wormhole.publishMessage{value: wormholeFee}(
            0, // batchID
            encodedMessage,
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

        HelloWorldMessage memory parsedMessage = decodeMessage(
            wormholeMessage.payload
        );
        require(!isMessageConsumed(wormholeMessage.hash), "message already consumed");
        consumeMessage(wormholeMessage.hash, parsedMessage.message);
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
