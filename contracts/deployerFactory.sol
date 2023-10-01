pragma solidity ^0.8.18;

import "./deployer.sol";

contract PurpleProtocolDeployerFactory {
	event PurpleProtocolDeployed(
		address indexed owner,
		address indexed purplePay
	);

	function deployPurpleProtocol(
		address _ownerAddress,
		uint _commissionFee
	) public returns (address deployedFactory) {
		deployedFactory = address(
			new PurpleProtocol(_ownerAddress, _commissionFee)
		);
		emit PurpleProtocolDeployed(_ownerAddress, deployedFactory);
	}
}
