
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./burnerContract.sol";

contract DeployCreate2 {

    event ContractDeployed(address burnerContract);

    function deploy(
        string memory _salt,
        address _erc20Token,
        uint256 _amount,
        address _merchantAddress,
        address _purplePayMultisig
    ) public returns(address) {

        BurnerContract newContract = new BurnerContract{
            salt: bytes32(keccak256(abi.encodePacked(_salt)))
        }(
            _erc20Token,
            _amount,
            _merchantAddress,
            _purplePayMultisig
        );

        emit ContractDeployed(address(newContract));

        return address(newContract);
    }

    function getBytecode(
        string memory _salt,
        address _erc20Token,
        uint256 _amount,
        address _merchantAddress,
        address _purplePayMultisig
    ) public view returns (address, bytes memory) {
        
        bytes memory bytecode = type(BurnerContract).creationCode;

        bytes memory contractBytecode = abi.encodePacked(
            bytecode,
            abi.encode(_erc20Token),
            abi.encode(_amount),
            abi.encode(_merchantAddress),
            abi.encode(_purplePayMultisig)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                bytes32(keccak256(abi.encodePacked(_salt))),
                keccak256(contractBytecode)
            )
        );

        return (
            address(uint160(uint(hash))),
            contractBytecode
        );
    }
}