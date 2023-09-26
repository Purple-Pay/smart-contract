// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./errors.sol";

contract NativeBurner {
	constructor(
		uint256 _amount,
		address _merchantAddress,
		address _ownerAddress,
		uint _commissionFee
	) {
		if (address(this).balance < _amount) {
			revert InsufficientBalance(address(this).balance, _amount);
		}

		uint256 commisionFee = (_amount * _commissionFee) / 10000;
		uint256 merchantShare = _amount - commisionFee;

		(bool feeSent, ) = _ownerAddress.call{value: commisionFee}("");

		if (!feeSent) {
			revert FailedToDisperseFund(merchantShare, _merchantAddress);
		}

		(bool settlementSent, ) = _merchantAddress.call{value: merchantShare}(
			""
		);

		if (!settlementSent) {
			revert FailedToDisperseFund(merchantShare, _merchantAddress);
		}
	}
}
