pragma solidity ^0.8.18;

import "./deployer.sol";

contract PurpleProtocolDeployerFactory {
	event PurpleProtocolDeployed(
		address indexed owner,
		address indexed purplePay
	);

	/**
	 * @dev Deploys a new Purple Protocol contract.
	 * @param _ownerAddress The address of the owner of the Purple Protocol contract.
	 * @param _commissionFee The commission fee of the Purple Protocol contract, _commissionFee * 100
	 * @return deployedFactory The address of the deployed Purple Protocol contract.
	 */
	function deployPurpleProtocol(
		address _ownerAddress,
		uint _commissionFee
	) public returns (address) {
		address deployedPurpleProtocol = address(
			new PurpleProtocol(_ownerAddress, _commissionFee)
		);

		emit PurpleProtocolDeployed(_ownerAddress, deployedPurpleProtocol);

		return deployedPurpleProtocol;
	}
}
