import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography
} from '@mui/material'
import axios from 'axios'
import { useConnectWallet } from '@web3-onboard/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignature, faBolt, faBan } from '@fortawesome/free-solid-svg-icons'
import { ethers } from 'ethers'
import { getSocialModuleInstance } from '../utils/contractSource'

let provider

export const RecoveryRequestCard = props => {
  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'long'
  })
  const {
    request,
    minimumSignatures,
    fetchRecoveryRequests,
    showFetchingError,
    setLoadingActive,
    setSnackBarMessage,
    setOpenSnackBar,
    readyToTransact
  } = props
  const [{ wallet }] = useConnectWallet()

  const [insufficientBalance, setInsufficientBalance] = useState(false)

  useEffect(() => {
    if (!wallet?.provider) {
      provider = null
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
    }
    setInsufficientBalance(false)
  }, [wallet])

  const signDataHash = async (dataHash, id) => {
    const signer = provider.getUncheckedSigner()
    let result = null
    try {
      result = await signer.signMessage(ethers.utils.arrayify(dataHash))
    } catch (e) {
      return null
    }
    setLoadingActive(true)
    try {
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/sign`,
        {
          id,
          signedMessage: result
        }
      )
      await fetchRecoveryRequests()
      setLoadingActive(false)
    } catch (e) {
      setLoadingActive(false)
      showFetchingError('Error occurred while submitting signature')
      return null
    }
    return result
  }

  const onClickSign = async () => {
    const ready = await readyToTransact()
    if (!ready) return
    try {
      const result = await signDataHash(request.dataHash, request.id)
      console.log(result)
    } catch (e) {
      setSnackBarMessage('User cancelled signing operation')
      setOpenSnackBar(true)
      return
    }
  }

  const submitRecovery = async (
    id,
    socialRecoveryAddress,
    oldOwner,
    newOwner,
    signatures
  ) => {
    const signer = provider.getUncheckedSigner()
    let transaction = {
      to: socialRecoveryAddress,
      value: 0,
      gasLimit: 168463 * 2
    }
    let result = null
    setLoadingActive(true)
    try {
      const lostWallet = await getSocialModuleInstance(
        socialRecoveryAddress,
        provider
      )
      let callData = lostWallet.interface.encodeFunctionData(
        'confirmAndRecoverAccess',
        [
          '0x0000000000000000000000000000000000000001',
          oldOwner,
          newOwner,
          signatures
        ]
      )
      transaction.data = callData
      result = await signer.sendTransaction(transaction)
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/submit`,
        { id, transactionHash: result.hash }
      )
      await fetchRecoveryRequests()
      setLoadingActive(false)
    } catch (e) {
      if (e.code === 'INSUFFICIENT_FUNDS') {
        setInsufficientBalance(true)
        const estimatedCost = (await signer.getGasPrice()).mul(transaction.gasLimit)
        setSnackBarMessage(`Insufficient balance to cover networks fees. Required: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        setOpenSnackBar(true);
      }
      else {
        showFetchingError('Error occurred while submitting recovery request')
      }
      setLoadingActive(false)
      return null
    }
    return result
  }

  const onClickSubmit = async () => {
    const ready = await readyToTransact()
    if (!ready) return
    try {
      const result = await submitRecovery(
        request.id,
        request.socialRecoveryAddress,
        request.oldOwner,
        request.newOwner,
        request.signatures
      )
      console.log(result)
    } catch (e) {
      setSnackBarMessage('User cancelled submit operation')
      setOpenSnackBar(true)
      return
    }
  }

  return (
    <Card
      variant="outlined"
      style={{
        background: '#1F2546',
        borderRadius: '15px',
        margin: '10px'
      }}
      width={'100%'}
    >
      <CardContent>
        <Typography
          sx={{ fontSize: 14, fontFamily: 'Gilroy' }}
          color="#F8ECE1"
          gutterBottom
        >
          Created {dateFormat.format(Date.parse(request.createdAt))}
        </Typography>
        <Typography variant="h6" noWrap color="#F8ECE1">
          {request.walletAddress}
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: 'Gilroy' }} color="#F8ECE1">
          Collected {request.signaturesAcquired ?? '0'} out of{' '}
          {minimumSignatures ?? '1'} minimum signatures
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: 'Gilroy' }} color="#F8ECE1">
          {request.signaturesAcquired !== minimumSignatures
            ? "Only sign if these emojis match those on the owner's screen"
            : 'All signatures have been collected! You now need to submit this transaction to recover the account.'}
        </Typography>
        <Typography variant={'h5'} sx={{ mb: 1.5 }}>
          {request.emoji}
        </Typography>
      </CardContent>
      <CardActions sx={{ mr: 5 }}>
        {request.signaturesAcquired !== minimumSignatures ? (
          <Button
            variant="contained"
            style={{
              background: '#F8ECE1',
              padding: '0.55rem 1.4rem',
              color: '#1F2546'
            }}
            startIcon={<FontAwesomeIcon icon={faSignature} />}
            onClick={onClickSign}
          >
            Sign
          </Button>
        ) : insufficientBalance ? (
          <Button
            variant="contained"
            disabled
            style={{
              background: '#F8ECE1',
              padding: '0.55rem 1.4rem',
              color: '#1F2546'
            }}
            startIcon={<FontAwesomeIcon icon={faBan} />}
          >
            Insufficient Balance
          </Button>
        ) : (
          <Button
            variant="contained"
            style={{
              background: '#F8ECE1',
              padding: '0.55rem 1.4rem',
              color: '#1F2546'
            }}
            startIcon={<FontAwesomeIcon icon={faBolt} />}
            onClick={onClickSubmit}
          >
            Submit
          </Button>
        )}
      </CardActions>
    </Card>
  )
}
