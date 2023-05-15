// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

error InsufficientBalance(uint256 available, uint256 required);
error PausedContract();
error FailedToDisperseFund(uint256 amount, address recipient);
