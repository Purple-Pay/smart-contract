// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./errors.sol";

contract ERC20Burner {
	constructor(
		address _tokenAddress,
		uint256 _amount,
		address _merchantAddress,
		address _purplePayMultiSig
	) {
		IERC20 token = IERC20(_tokenAddress);

		if (token.balanceOf(address(this)) < _amount) {
			revert InsufficientBalance(token.balanceOf(address(this)), _amount);
		}

		uint256 purplePayFee = _amount / 100;
		uint256 merchantShare = _amount - purplePayFee;

		token.transfer(_purplePayMultiSig, purplePayFee);
		token.transfer(_merchantAddress, merchantShare);
	}
}
