// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

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

		(bool sent, ) = _purplePayMultiSig.call{value: purplePayFee}("");

		require(sent, "Native Burner: Failed to send fee to PurplePay");

		(bool merchantSent, ) = _merchantAddress.call{value: merchantShare}("");

		require(
			merchantSent,
			"Native Burner: Failed to send share to merchant"
		);
	}
}
