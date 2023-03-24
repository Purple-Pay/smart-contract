// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./merchantWallet.sol";

contract PurplePayFactory is Ownable {

    // Mapping to store list of allowed tokens
    mapping(address => bool) private tokenAllowed;

    constructor() { }

    event MerchatWalletCreated(address merchantAddress, address merchantWallet);

    receive() external payable { }

    function createMerchantWallet() public returns(address) {

        MerchantWallet newWallet = new MerchantWallet();

        newWallet.transferOwnership(msg.sender);
        emit MerchatWalletCreated(msg.sender, address(newWallet));

        address newMerchantWallet = address(newWallet);

        return newMerchantWallet;
    }

    function addErc20Token(address _token) external onlyOwner{
        tokenAllowed[_token] = true;
    }

    function isTokenAllowed(address _token) external view returns(bool){
        return tokenAllowed[_token];
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

}