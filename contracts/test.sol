// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Test is Initializable, OwnableUpgradeable {
    function intialize() public initializer {
        __Ownable_init();
    }

    function foo() public pure returns (uint) {
        return 1;
    }

    function bar() public view onlyOwner returns (uint) {
        return 2;
    }
}
