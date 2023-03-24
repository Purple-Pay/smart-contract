// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IFACTORY{
    function isTokenAllowed(address _token) external view returns(bool);
}