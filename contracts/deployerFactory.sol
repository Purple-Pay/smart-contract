pragma solidity ^0.8.18;

import "./deployer.sol";

contract PurplePayDeployerFactory {
	event PurplePayDeployed(address indexed owner, address indexed purplePay);

	function deployPurplePay(
		address _ownerAddress,
		uint _commissionFee
	) public returns (address deployedFactory) {
		deployedFactory = address(new PurplePay(_ownerAddress, _commissionFee));
		emit PurplePayDeployed(_ownerAddress, deployedFactory);
	}
}
