require("@nomicfoundation/hardhat-toolbox");
require("dotenv")

const private_key  = `private_key`

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: `https://rpc.ankr.com/eth_goerli`,
      accounts: [private_key]
    }
  }
};
