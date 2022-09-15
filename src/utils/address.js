export const isValid = (address) => {
  return address.match(/^0x[a-fA-F0-9]{40}$/);
};
