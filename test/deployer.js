const { expect } = require("chai");

describe("Deployer contract", function () {
    const [deployer] = await ethers.getSigners();
    
    const deployerContract = await hre.ethers.getContractFactory("DeployCreate2");
    const contract = await deployerContract.deploy();
    
//   it("testingr", async function () {
    
//   });
});