const initNetworksConfig = () => {
  return {
    5: {
      name: "Goerli",
      chainId: "5",
      socialRecoveryModuleAddress: "0x8fe391F70B6d3fe30920D9a91cd9ba34a2D9f6FB",
      client: process.env.REACT_APP_GOERLI_RPC,
      blockExplorer: "https://goerli.etherscan.io/"
    },
    420: {
      name: "Goerli-Optimism",
      chainId: "420",
      socialRecoveryModuleAddress: "0x8fe391F70B6d3fe30920D9a91cd9ba34a2D9f6FB",
      client: process.env.REACT_APP_GOERLI_RPC,
      blockExplorer: "https://goerli-optimism.etherscan.io",
    },
    10: {
      name: "Optimism",
      chainId: "10",
      socialRecoveryModuleAddress: "0x8fe391F70B6d3fe30920D9a91cd9ba34a2D9f6FB",
      client: process.env.REACT_APP_GOERLI_RPC,
      blockExplorer: "https://optimism.etherscan.io",
    },
  };
};

export const NetworksConfig = initNetworksConfig();