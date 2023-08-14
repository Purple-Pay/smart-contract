// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @DEV: THIS IS A PAYMENT TOKEN THAT USERS HAVE TO USE TO INTERACT WITH THE TIMBRE PLATFORM
contract PaymentTokens is ERC20, Ownable {
    constructor() ERC20("TPaymentToken", "TPMB") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}