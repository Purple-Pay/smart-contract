// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DeployCreate2 {

    event ContractDeployed(address burnerContract);

    function deploy(
        string memory _salt,
        address _erc20Token,
        uint256 _amount,
        address _merchantAddress,
        address _purplePayMultisig
    ) public returns(address) {

        BurnerContract newContract = new BurnerContract{
            salt: bytes32(keccak256(abi.encodePacked(_salt)))
        }(
            _erc20Token,
            _amount,
            _merchantAddress,
            _purplePayMultisig
        );

        emit ContractDeployed(address(newContract));

        return address(newContract);
    }

    function getBytecode(
        string memory _salt,
        address _erc20Token,
        uint256 _amount,
        address _merchantAddress,
        address _purplePayMultisig
    ) public view returns (address, bytes memory) {
        
        bytes memory bytecode = type(BurnerContract).creationCode;

        bytes memory contractBytecode = abi.encodePacked(
            bytecode,
            abi.encode(_erc20Token),
            abi.encode(_amount),
            abi.encode(_merchantAddress),
            abi.encode(_purplePayMultisig)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                bytes32(keccak256(abi.encodePacked(_salt))),
                keccak256(contractBytecode)
            )
        );

        return (
            address(uint160(uint(hash))),
            contractBytecode
        );
    }
}

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