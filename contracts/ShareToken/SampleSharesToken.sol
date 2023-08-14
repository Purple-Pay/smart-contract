// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Shares.sol";

contract OwnerShareToken is
    Context,
    ERC20,
    ERC20Permit,
    ERC20Shares,
    Ownable
{
    // constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // function mint(address to, uint256 amount) public onlyOwner {
    //     _mint(to, amount);
    // }
    address[] private _holders;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20Permit(name) ERC20Shares() {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // only test function
    //TODO : Remove in prod
    function sendMe500Shares() external {
        _mint(_msgSender(), 500 * 10 ** decimals());
    }

    function getHolders() public view returns (address[] memory) {
        return _holders;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Shares) {
        super._beforeTokenTransfer(from, to, amount);

        if (balanceOf(to) == 0) {
            _holders.push(to);
        }
    }
}