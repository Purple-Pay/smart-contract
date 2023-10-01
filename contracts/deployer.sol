// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./erc20burner.sol";
import "./nativeburner.sol";

contract PurpleProtocol is Ownable {
	uint commissionFee = 0;

	constructor(address _ownerAddress, uint _commissionFee) {
		commissionFee = _commissionFee;

		transferOwnership(_ownerAddress);
	}

	event PaymentRecieved(
		address indexed _from,
		address indexed _to,
		address indexed _tokenAddress,
		uint _amount
	);

	bool public isPaused = true;

	/**
	 * @dev Updates the commission fee of the Purple Protocol contract.
	 * @param _commissionFee The new commission fee of the Purple Protocol contract, _commissionFee * 100
	 */
	function updateCommissionFee(uint _commissionFee) public onlyOwner {
		commissionFee = _commissionFee;
	}

	/**
	 * @dev Pauses the Purple Protocol contract.
	 */
	function pauseContract() public onlyOwner {
		isPaused = !isPaused;
	}

	/**
	 * @dev Deploys a new burner contract.
	 * @param _salt The salt of the burner contract, unique key for generating burner contracts.
	 * @param _tokenAddress The address of the ERC20 token to accept funds in, send address(0) for Native transfers.
	 * @param _amount The amount of tokens to be burned, _amount * 10**decimals
	 * @param _merchantAddress The address of the merchant in which they will recieve the funds.
	 * @return address The address of the deployed burner contract.
	 *
	 * @notice The args for generating burner contracts, should be same as used to predict the address of the burner contract.
	 */
	function deploy(
		string memory _salt,
		address _tokenAddress,
		uint _amount,
		address _merchantAddress
	) public onlyOwner returns (address) {
		if (isPaused) revert PausedContract();

		if (_tokenAddress == address(0)) {
			NativeBurner nativeBurner = new NativeBurner{
				salt: bytes32(keccak256(abi.encodePacked(_salt)))
			}(_amount, _merchantAddress, owner(), commissionFee);

			emit PaymentRecieved(
				msg.sender,
				address(nativeBurner),
				_tokenAddress,
				_amount
			);

			return address(nativeBurner);
		}

		ERC20Burner erc20Burner = new ERC20Burner{
			salt: bytes32(keccak256(abi.encodePacked(_salt)))
		}(_tokenAddress, _amount, _merchantAddress, owner(), commissionFee);

		emit PaymentRecieved(
			msg.sender,
			address(erc20Burner),
			_tokenAddress,
			_amount
		);

		return address(erc20Burner);
	}

	/**
	 * @dev Predicts the address of the burner contract.
	 * @param _salt The salt of the burner contract, unique key for generating burner contracts.
	 * @param _tokenAddress The address of the ERC20 token to accept funds in, send address(0) for Native transfers.
	 * @param _amount The amount of tokens to be burned, _amount * 10**decimals
	 * @param _merchantAddress The address of the merchant in which they will recieve the funds.
	 * @return address The address of the deployed burner contract.
	 */
	function predictAddress(
		string memory _salt,
		address _tokenAddress,
		uint _amount,
		address _merchantAddress
	) public view returns (address) {
		if (isPaused) revert PausedContract();

		bytes memory nativeContractBytecode = abi.encodePacked(
			type(NativeBurner).creationCode,
			abi.encode(_amount),
			abi.encode(_merchantAddress),
			abi.encode(owner()),
			abi.encode(commissionFee)
		);

		bytes memory erc20ContractBytecode = abi.encodePacked(
			type(ERC20Burner).creationCode,
			abi.encode(_tokenAddress),
			abi.encode(_amount),
			abi.encode(_merchantAddress),
			abi.encode(owner()),
			abi.encode(commissionFee)
		);

		bytes memory contractBytecode = _tokenAddress == address(0)
			? nativeContractBytecode
			: erc20ContractBytecode;

		bytes32 hash = keccak256(
			abi.encodePacked(
				bytes1(0xff),
				address(this),
				bytes32(keccak256(abi.encodePacked(_salt))),
				keccak256(contractBytecode)
			)
		);

		return (address(uint160(uint(hash))));
	}
}
