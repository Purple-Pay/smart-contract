// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NativeBurnerContract {

    using SafeMath for uint;

    constructor(
        uint _amount,
        address _merchantAddress,
        address _purplePayMultiSig
    ) {

        bool isPaymentCompleted = address(this).balance >= _amount;

        require(isPaymentCompleted,
            string.concat(
                "Native Burner: Payment not completed at ",
                Strings.toString((address(this).balance))
            )
        );

        uint purplePayFee = SafeMath.div(SafeMath.mul(_amount, 1), 100);
        uint merchantShare = SafeMath.sub(_amount, purplePayFee);

        payable(_purplePayMultiSig).transfer(purplePayFee);
        payable(_merchantAddress).transfer(merchantShare);
    }
}