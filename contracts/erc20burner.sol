// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract ERC20BurnerContract {

    using SafeMath for uint;

    constructor(
        address _erc20Token,
        uint _amount,
        address _merchantAddress,
        address _purplePayMultiSig
    ) {

        IERC20 token = IERC20(_erc20Token);

        bool isPaymentCompleted = token.balanceOf(address(this)) >= _amount;

        require(isPaymentCompleted,
            string.concat(
                "ERC20 Burner: Payment not completed at ",
                Strings.toHexString(uint256(uint160(address(this))), 20)
            )
        );

        uint purplePayFee = SafeMath.div(SafeMath.mul(_amount, 1), 100);
        uint merchantShare = SafeMath.sub(_amount, purplePayFee);

        token.transfer(_purplePayMultiSig, purplePayFee);
        token.transfer(_merchantAddress, merchantShare);
    }
}