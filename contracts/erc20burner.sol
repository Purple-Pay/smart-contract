// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./errors.sol";

contract ERC20BurnerContract {
	constructor(
		address _tokenAddress,
		uint _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) {
		IERC20 token = IERC20(_tokenAddress);

		if (token.balanceOf(address(this)) < _amount) {
			revert InsufficientBalance(token.balanceOf(address(this)), _amount);
		}

		uint purplePayFee = _amount / 100;
		uint merchantShare = _amount - purplePayFee;

		token.transfer(_purplePayMultiSig, purplePayFee);
		token.transfer(_merchantAddress, merchantShare);
	}
}
