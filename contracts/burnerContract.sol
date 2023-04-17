// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract BurnerContract {

    using SafeMath for uint;

    address private immutable erc20Token;
    uint256 private immutable amount;
    address private immutable merchantAddress;
    address private immutable purplePayMultiSig;

    constructor(
        address _erc20Token,
        uint256 _amount,
        address _merchantAddress,
        address _purplePayMultisig
    ) {
        erc20Token = _erc20Token;
        amount = _amount;
        merchantAddress = _merchantAddress;
        purplePayMultiSig = _purplePayMultisig;

        distributeFunds();
    }

    receive() external payable { }
    fallback() external payable { }

    function distributeFunds() public {

        bool tokenBalance = IERC20(erc20Token).balanceOf(address(this)) >= amount;
        require(tokenBalance, "Payment isn't completed yet.");

        uint purplePayFee = SafeMath.div(SafeMath.mul(amount, 1), 100);
        uint merchantShare = SafeMath.sub(amount, purplePayFee);

        if(erc20Token != address(0)) {
            IERC20(erc20Token).transfer(purplePayMultiSig, purplePayFee);

            IERC20(erc20Token).transfer(merchantAddress, merchantShare);
            return;
        }

        payable(purplePayMultiSig).transfer(purplePayFee);
        payable(merchantAddress).transfer(merchantShare);

    }
}