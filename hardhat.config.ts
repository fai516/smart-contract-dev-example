import * as dotenv from "dotenv";
import { HardhatUserConfig, task, extendEnvironment } from "hardhat/config";
import { EthereumProvider } from "hardhat/types/provider";
import { createProvider } from "hardhat/internal/core/providers/construction";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat/types/runtime";

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    // Mainnet
    ETH_MAINNET: {
      url: "https://eth-mainnet.alchemyapi.io/v2/dsEdmqmOuRQwbkJtGi7FUrDLxqMbOP-j",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
    BSC_MAINNET: {
      url: "https://bsc-dataseed.binance.org",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ],
    },
    POLYGON_MAINNET: {
      url: "https://polygon-rpc.com",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ],
    },
    // Testnet
    ETH_TESTNET: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/zR33NsRcaSNFcfwhV39SVlc-ehblp38o",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
    BSC_TESTNET: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
    POLYGON_TESTNET: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [
        // Insert your private key
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
    hardhat: {
      accounts: [
        {
          privateKey:
            "0x1d76a5769b11b3c2a1ecbc0aad242a0b1547171b000e62e9e09ab459f963a090",
          balance: "100000000000000000000000",
        },
        {
          privateKey:
            "0x5a0ed8e56a2a0cdfec9cfba5ba651e31dddac2b0c78b2f0e1cfd55000d1539d1",
          balance: "100000000000000000000000",
        },
        {
          privateKey:
            "0x272e3a1ee4f364fa7c95a2ff44a07061b09790995ade446ee4d521ad1e4feba3",
          balance: "100000000000000000000000",
        },
      ],
      mining: {
        auto: true,
        interval: 5000,
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
