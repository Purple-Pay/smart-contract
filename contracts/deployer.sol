// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./erc20burner.sol";
import "./nativeburner.sol";

contract PurplePayBurnerDeployer {

    using SafeMath for uint;

    event ContractDeployed(address burnerContract);

    function deploy(
        string memory _salt,
        address _erc20Token,
        uint _amount,
        address _merchantAddress,
        address _purplePayMultiSig
    ) public returns(address) {

        if(_erc20Token != address(0)) {
            ERC20BurnerContract erc20newContract = new ERC20BurnerContract{
                salt: bytes32(keccak256(abi.encodePacked(_salt)))
            }(
                _erc20Token,
                _amount,
                _merchantAddress,
                _purplePayMultiSig
            );

            emit ContractDeployed(address(erc20newContract));
            return address(erc20newContract);

        }

        NativeBurnerContract newContract = new NativeBurnerContract{
            salt: bytes32(keccak256(abi.encodePacked(_salt)))
        }(
            _amount,
            _merchantAddress,
            _purplePayMultiSig
        );
        emit ContractDeployed(address(newContract));
        return address(newContract);
    }

    function predictAddress(
        string memory _salt,
        address _erc20Token,
        uint _amount, // 10 USDC -> 10000000; 0.005 eth 5000000000000000
        address _merchantAddress,
        address _purplePayMultiSig
    ) public view returns (address) {
        bytes memory nativeContractBytecode = abi.encodePacked(
            type(NativeBurnerContract).creationCode,
            abi.encode(_amount),
            abi.encode(_merchantAddress),
            abi.encode(_purplePayMultiSig)
        );

        bytes memory erc20ContractBytecode = abi.encodePacked(
            type(ERC20BurnerContract).creationCode,
            abi.encode(_erc20Token),
            abi.encode(_amount),
            abi.encode(_merchantAddress),
            abi.encode(_purplePayMultiSig)
        );

        bytes memory contractBytecode = _erc20Token == address(0)
            ? nativeContractBytecode
            : erc20ContractBytecode;

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                bytes32(keccak256(abi.encodePacked(_salt))),
                keccak256(contractBytecode)
            )
        );

        return (
            address(uint160(uint(hash)))
        );
    }
}