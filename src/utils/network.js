const initNetworksConfig = () => {
  return {
    0x5: {
      name: "Goerli",
      chainId: "5",
      socialRecoveryModuleAddress: "0x831153c6b9537d0fF5b7DB830C2749DE3042e776",
      client: process.env.REACT_APP_GOERLI_RPC,
      blockExplorer: "https://goerli.etherscan.io/"
    },
    0x1a4: {
      name: "Optimism Goerli",
      chainId: "420",
      socialRecoveryModuleAddress: "0x831153c6b9537d0fF5b7DB830C2749DE3042e776",
      client: process.env.REACT_APP_OPTIMISM_GOERLI_RPC,
      blockExplorer: "https://goerli-optimism.etherscan.io",
    },
  };
};

export const NetworksConfig = initNetworksConfig();