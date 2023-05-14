// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ERC20BurnerContract {
	using SafeMath for uint;

	constructor(
		address _tokenAddress,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) {
		IERC20 token = IERC20(_tokenAddress);

		bool isPaymentCompleted = token.balanceOf(address(this)) >= _amount;

		require(isPaymentCompleted, "ERC20 Burner: Payment incomplete");

		uint purplePayFee = SafeMath.div(SafeMath.mul(_amount, 1), 100);
		uint merchantShare = SafeMath.sub(_amount, purplePayFee);

		token.transfer(_purplePayMultiSig, purplePayFee);
		token.transfer(_merchantAddress, merchantShare);
	}
}
