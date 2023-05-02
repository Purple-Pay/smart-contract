// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./erc20burner.sol";
import "./nativeBurner.sol";

contract PurplePayBurnerDeployer is Ownable {
    using SafeMath for uint;

    event ContractDeployed(address burnerContract);

    function deploy(
        string memory _salt,
        address _erc20Token,
        uint _amount,
        address _merchantAddress,
        address _purplePayMultiSig
    ) public onlyOwner returns (address) {
        if (_erc20Token != address(0)) {
            ERC20BurnerContract erc20Burner = new ERC20BurnerContract{
                salt: bytes32(keccak256(abi.encodePacked(_salt)))
            }(_erc20Token, _amount, _merchantAddress, _purplePayMultiSig);
            emit ContractDeployed(address(erc20Burner));
            return address(erc20Burner);
        }

        NativeBurnerContract nativeBurner = new NativeBurnerContract{
            salt: bytes32(keccak256(abi.encodePacked(_salt)))
        }(_amount, _merchantAddress, _purplePayMultiSig);
        emit ContractDeployed(address(nativeBurner));
        return address(nativeBurner);
    }

    function predictAddress(
        string memory _salt,
        address _erc20Token,
        uint _amount,
        address _merchantAddress,
        address _purplePayMultiSig
    ) public view onlyOwner returns (address) {
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

        return (address(uint160(uint(hash))));
    }
}
