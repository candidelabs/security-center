import {ethers} from "ethers";
import socialSource from "./source/SocialRecoveryModule.json";
import walletSource from "./source/EIP4337Manager.json";

export const getNonce = async (
  walletAddress,
  provider,
) => {
  const w = getInstance(walletAddress, provider);
  return w.nonce().then((nonce) => nonce.toNumber());
};

export const getInstance = (address, provider) =>
  new ethers.Contract(address, walletSource.abi, provider);

export const getSocialModuleInstance = (address, provider) =>
  new ethers.Contract(address, socialSource.abi, provider);