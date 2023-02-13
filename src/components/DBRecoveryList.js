import React, { useState, useEffect, useCallback } from 'react'
import { Stack } from '@mui/material'
import axios from 'axios'
import { RecoveryRequestCard } from './RecoveryRequestCard'
import { getSocialModuleInstance } from '../utils/contractSource'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'
import { ethers } from 'ethers'
import { NetworksConfig } from '../utils/network'
import FinilizeCard from './FinilizeCard'

export const DBRecoveryList = props => {
  const {
    toAddress,
    setLoadingActive,
    setSnackBarMessage,
    setOpenSnackBar,
    readyToTransact
  } = props
  const [{ connectedChain }, _setChain] = useSetChain()
  const [recoveryRequests, setRecoveryRequests] = useState([])
  const [minimumSignatures, setMinimumSignatures] = useState(0);
  const [signerAddress, setSignerAddress] = useState('');
  const [moduleAddressOnConnectedNetwork, setModuleAddressOnConnectedNetwork] = useState('');
  const [isNetworkSupported, setIsNetworkSupported] = useState(false);
  const [recoveryModuleContractInstance, setRecoveryModuleContractInstance] = useState();
  const [signer, setSigner] = useState();
  const [guardianAddresses, setGuardianAddresses] = useState([]);

  const [{ wallet }] = useConnectWallet();

  useEffect(() => {
    if (wallet && wallet.provider) {
      const newSigner = new ethers.providers.Web3Provider(wallet.provider, 'any');
      setSigner(newSigner);
    }

    if (wallet && wallet.accounts) {
      setSignerAddress(wallet.accounts[0].address.toLowerCase() || '');
    }
  }, [wallet]);

  const showFetchingError = useCallback((errorMessage) => {
    setOpenSnackBar(true)
    setSnackBarMessage(errorMessage)
  }, [setOpenSnackBar, setSnackBarMessage]);

  const fetchRecoveryRequests = async (accountAddress) => {
    setRecoveryRequests([])

    if (isNetworkSupported && recoveryModuleContractInstance) {
      const nonce = await recoveryModuleContractInstance.nonce(accountAddress)

      const response = await axios.get(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/fetchByAddress`, {
        params: {
          accountAddress: accountAddress.toLowerCase(),
          network: NetworksConfig[Number(connectedChain.id)].name,
          nonce: Number(nonce),
        }
      });

      if (response.data.length === 0) {
        setSnackBarMessage(`No new recovery requests found for ${accountAddress}`);
        setOpenSnackBar(true);
        return
      }

      let guardians = []
      let minSig = 0
      if (signer == null) return // not ready to interact with chain
      try {
        guardians = await recoveryModuleContractInstance.getGuardians(accountAddress);
        guardians = guardians.map(element => {
          return element.toLowerCase()
        })
        //
        minSig = (await recoveryModuleContractInstance.threshold(accountAddress)).toNumber()

        setGuardianAddresses(guardians);
        setMinimumSignatures(minSig)
      } catch (e) {
        console.error(e)
        showFetchingError('Unable to check request status')
        return
      }

      // filter recovery requests with old nonces
      const filteredExpiredRecoveryRequests = response.data.filter((i) => i.nonce !== nonce);

      if (guardians.includes(signerAddress)) {
        if (filteredExpiredRecoveryRequests) {
          setRecoveryRequests(filteredExpiredRecoveryRequests);
        } else {
          showFetchingError(`Previous recovery requests expired for ${accountAddress}`)
        }
      } else {
        // check if minSign has been collected and transaction is ready to be executed or finilized
        const recoveryRequestsReadyToBeSubmited = filteredExpiredRecoveryRequests.filter((i) => i.signaturesAcquired >= minSig);

        if (recoveryRequestsReadyToBeSubmited && recoveryRequestsReadyToBeSubmited.length > 0) {
          setRecoveryRequests(recoveryRequestsReadyToBeSubmited);
        } else {
          showFetchingError('You are not a guardian for this wallet')
        }
      }
    }
  };

  useEffect(() => {
    if (recoveryModuleContractInstance && isNetworkSupported) {
      fetchRecoveryRequests(toAddress);
    }
  }, [recoveryModuleContractInstance, toAddress, isNetworkSupported, signerAddress]);

  useEffect(() => {
    if (connectedChain && connectedChain.id) {
      const ischainSupported = NetworksConfig.hasOwnProperty(Number(connectedChain.id));

      setIsNetworkSupported(ischainSupported);
      if (ischainSupported) {
        const { socialRecoveryModuleAddress } = NetworksConfig[Number(connectedChain.id)];

        setModuleAddressOnConnectedNetwork(socialRecoveryModuleAddress);
        getRecoveryModuleContractInstance(socialRecoveryModuleAddress);
      } else {
        showFetchingError(`Unsupported Network. Change to ${NetworksConfig[10].name} or Goerli networks`);
      }
    }
  }, [connectedChain, connectedChain.id, signer, showFetchingError]);

  const getRecoveryModuleContractInstance = async (socialRecoveryModuleAddress) => {
    if (signer) {
      const unCheckedsigner = signer.getUncheckedSigner();
      const result = await getSocialModuleInstance(
        socialRecoveryModuleAddress,
        unCheckedsigner,
      );

      setRecoveryModuleContractInstance(result);
    }
  };

  return (
    <Stack>
      <FinilizeCard
        lostAccountContractInstance={recoveryModuleContractInstance}
        lostAccountAddress={toAddress}
        setLoadingActive={setLoadingActive}
        setSnackBarMessage={setSnackBarMessage}
        setOpenSnackBar={setOpenSnackBar}
        readyToTransact={readyToTransact}
        showFetchingError={showFetchingError} />
      {recoveryRequests.map((object, i) => (
        <RecoveryRequestCard
          guardians={guardianAddresses}
          request={object}
          key={object.id}
          socialRecoveryAddress={moduleAddressOnConnectedNetwork}
          minimumSignatures={minimumSignatures}
          showFetchingError={showFetchingError}
          fetchRecoveryRequests={fetchRecoveryRequests}
          setLoadingActive={setLoadingActive}
          setSnackBarMessage={setSnackBarMessage}
          setOpenSnackBar={setOpenSnackBar}
          readyToTransact={readyToTransact}
        />
      ))}
    </Stack>
  )
}
