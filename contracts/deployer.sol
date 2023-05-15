// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./erc20burner.sol";
import "./nativeburner.sol";
import "./errors.sol";

contract PurplePayBurnerDeployer is Ownable {
	using SafeMath for uint;

	address public immutable nativeAddress;
	bool public isPaused = true;

	constructor(address _nativeAddress) Ownable() {
		nativeAddress = _nativeAddress;
		isPaused = false;
	}

	function pauseContract() public onlyOwner {
		isPaused = !isPaused;
	}

	function deploy(
		string memory _salt,
		address _tokenAddress,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) public onlyOwner returns (address) {
		if (isPaused) revert PausedContract();

		if (_tokenAddress == nativeAddress) {
			NativeBurnerContract nativeBurner = new NativeBurnerContract{
				salt: bytes32(keccak256(abi.encodePacked(_salt)))
			}(_amount, _merchantAddress, _purplePayMultiSig);

			return address(nativeBurner);
		}

		ERC20BurnerContract erc20Burner = new ERC20BurnerContract{
			salt: bytes32(keccak256(abi.encodePacked(_salt)))
		}(_tokenAddress, _amount, _merchantAddress, _purplePayMultiSig);

		return address(erc20Burner);
	}

	function predictAddress(
		string memory _salt,
		address _tokenAddress,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) public view returns (address) {
		if (isPaused) revert PausedContract();

		bytes memory nativeContractBytecode = abi.encodePacked(
			type(NativeBurnerContract).creationCode,
			abi.encode(_amount),
			abi.encode(_merchantAddress),
			abi.encode(_purplePayMultiSig)
		);

		bytes memory erc20ContractBytecode = abi.encodePacked(
			type(ERC20BurnerContract).creationCode,
			abi.encode(_tokenAddress),
			abi.encode(_amount),
			abi.encode(_merchantAddress),
			abi.encode(_purplePayMultiSig)
		);

		bytes memory contractBytecode = _tokenAddress == nativeAddress
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
