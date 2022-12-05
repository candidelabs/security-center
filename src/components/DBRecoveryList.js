import React, { useState, useEffect } from 'react'
import { Stack } from '@mui/material'
import axios from 'axios'
import { RecoveryRequestCard } from './RecoveryRequestCard'
import { getSocialModuleInstance } from '../utils/contractSource'
import { useConnectWallet } from '@web3-onboard/react'
import { ethers } from 'ethers'

let provider

export const DBRecoveryList = props => {
  const {
    toAddress,
    setLoadingActive,
    setSnackBarMessage,
    setOpenSnackBar,
    readyToTransact
  } = props
  const [, setFetchingRequests] = useState(false)
  const [recoveryRequests, setRecoveryRequests] = useState([])
  const [minimumSignatures, setMinimumSignatures] = useState(0)

  const [{ wallet }] = useConnectWallet()

  useEffect(() => {
    if (!wallet?.provider) {
      provider = null
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
    }
  }, [wallet])

  const showFetchingError = errorMessage => {
    setFetchingRequests(false)
    setOpenSnackBar(true)
    setSnackBarMessage(errorMessage)
  }

  const fetchRecoveryRequests = async () => {
    setRecoveryRequests([])
    setFetchingRequests(true)
    const response = await axios.get(
      `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/fetchByAddress`,
      { params: { walletAddress: toAddress.toLowerCase(), network: 'Goerli' } }
    )
    console.log(response.data)
    if (response.data.length === 0) {
      showFetchingError(`No recovery requests found for ${toAddress}`)
      return
    }
    //
    let guardians = []
    let minimumSignatures = 0
    if (provider == null) return // not ready to interact with chain
    try {
      const lostWallet = await getSocialModuleInstance(
        response.data[0].socialRecoveryAddress,
        provider
      )
      guardians = await lostWallet.getFriends()
      guardians = guardians.map(element => {
        return element.toLowerCase()
      })
      console.log(guardians)
      //
      minimumSignatures = (await lostWallet.threshold()).toNumber()
      //
    } catch (e) {
      console.error(e)
      showFetchingError('Unable to check request status')
      return
    }
    const signer = provider.getUncheckedSigner()
    const signerAddress = (await signer.getAddress()).toLowerCase()
    console.log(signerAddress.toLowerCase())
    console.log(guardians[0])
    console.log(typeof guardians[0])
    if (!guardians.includes(signerAddress.toLowerCase())) {
      showFetchingError('You are not a guardian for this wallet')
      return
    }
    //
    setMinimumSignatures(minimumSignatures)
    setRecoveryRequests(response.data)
    setFetchingRequests(false)
  }

  useEffect(() => {
    fetchRecoveryRequests()
  }, [toAddress])

  return (
    <Stack>
      {recoveryRequests.map((object, i) => (
        <RecoveryRequestCard
          request={object}
          key={object.id}
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
