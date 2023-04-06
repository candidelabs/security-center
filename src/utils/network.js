const initNetworksConfig = () => {
  return {
    0x5: {
      name: "Goerli",
      chainId: "5",
      socialRecoveryModuleAddress: "0xCbf67d131Fa0775c5d18676c58de982c349aFC0b",
      client: process.env.REACT_APP_GOERLI_RPC,
      blockExplorer: "https://goerli.etherscan.io/"
    },
    0x1a4: {
      name: "Optimism Goerli",
      chainId: "420",
      socialRecoveryModuleAddress: "0xCbf67d131Fa0775c5d18676c58de982c349aFC0b",
      client: process.env.REACT_APP_OPTIMISM_GOERLI_RPC,
      blockExplorer: "https://goerli-optimism.etherscan.io",
    },
  };
};

export const NetworksConfig = initNetworksConfig();