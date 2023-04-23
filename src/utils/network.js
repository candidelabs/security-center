const initNetworksConfig = () => {
  return {
    0xa: {
      name: "Optimism",
      chainId: "10",
      socialRecoveryModuleAddress: "0xbc1920b63F35FdeD45382e2295E645B5c27fD2DA",
      client: process.env.REACT_APP_OPTIMISM,
      blockExplorer: "https://optimism.etherscan.io",
    },
  };
};

export const NetworksConfig = initNetworksConfig();