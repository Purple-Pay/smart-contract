require("@nomicfoundation/hardhat-toolbox");
require("dotenv")

const private_key  = process.env.PRIVATE_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: `https://rpc.ankr.com/eth_goerli`,
      accounts: [private_key]
    },
    matic: {
      url: `https://rpc-mainnet.maticvigil.com/v1/`,
      accounts: [private_key]
    },
  }
};
