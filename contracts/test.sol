// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PurplePayBurnerDeployer {
	using SafeMath for uint;

	address public immutable nativeAddress;

	constructor(address _nativeAddress) {
		nativeAddress = _nativeAddress;
	}

	function deploy(
		string memory _salt,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig,
		address _nativeAddress
	) public returns (address) {
		require(_nativeAddress == nativeAddress, "Not same bruh");
		NativeBurnerContract nativeBurner = new NativeBurnerContract{
			salt: bytes32(keccak256(abi.encodePacked(_salt)))
		}(_amount, _merchantAddress, _purplePayMultiSig);

		return address(nativeBurner);
	}

	function predictAddress(
		string memory _salt,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) public view returns (address) {
		bytes memory nativeContractBytecode = abi.encodePacked(
			type(NativeBurnerContract).creationCode,
			abi.encode(_amount),
			abi.encode(_merchantAddress),
			abi.encode(_purplePayMultiSig)
		);

		bytes32 hash = keccak256(
			abi.encodePacked(
				bytes1(0xff),
				address(this),
				bytes32(keccak256(abi.encodePacked(_salt))),
				keccak256(nativeContractBytecode)
			)
		);

		return (address(uint160(uint(hash))));
		// return address(0);
	}
}

contract NativeBurnerContract {
	using SafeMath for uint;

	constructor(
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) {
		bool isPaymentCompleted = address(this).balance >= _amount;

		require(isPaymentCompleted, "Native Burner: Payment incomplete");

		uint purplePayFee = SafeMath.div(SafeMath.mul(_amount, 1), 100);
		uint merchantShare = SafeMath.sub(_amount, purplePayFee);

		payable(_purplePayMultiSig).transfer(purplePayFee);
		payable(_merchantAddress).transfer(merchantShare);
	}
}
