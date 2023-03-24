// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/safeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./interfaces/IFACTORY.sol";


contract MerchantWallet is Ownable {

    using SafeMath for uint;

    // @dev
    // MerchantWallet is called from PurplePayFactory contract and hence the msg.sender while calling is always parent contract.
    // msg.sender -> parent contract's address
    address public parentAddress = address(0);

    modifier erc20Allowed(address _erc20Token) {
        IFACTORY factoryContract = IFACTORY(payable(parentAddress));
        require(
            factoryContract.isTokenAllowed(_erc20Token),
            "MerchantWallet: ERC20 not allowed"
        );
        _;
    }

    constructor() {
        parentAddress = msg.sender;
    }

    event PaymentRecieved(string merchantOrderId, string paymentId, string sessionId, uint amount, address sender, address merchantWallet);

    receive() external payable { }

    function recievePayments(string memory merchantOrderId, string memory paymentId, string memory sessionId) payable public {

        require(msg.value > 0, "Payment has to be more than 0");

        uint purplePayFee = SafeMath.div(SafeMath.mul(msg.value, 1), 100);

        payable(parentAddress).transfer(purplePayFee);

        emit PaymentRecieved(merchantOrderId, paymentId, sessionId, msg.value, msg.sender, address(this));
    }

    function withdraw(address _erc20Token) external onlyOwner erc20Allowed(_erc20Token) {
        if(_erc20Token == address(0)){
            payable(owner()).transfer(address(this).balance);
        }
        else{
            IERC20 erc20Token = IERC20(_erc20Token);
            erc20Token.transfer(msg.sender, erc20Token.balanceOf(address(this)));
        }
    }
}
