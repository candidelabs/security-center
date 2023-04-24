import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material'
import axios from 'axios'
import { useConnectWallet, useNotifications, useSetChain } from '@web3-onboard/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignature, faBolt, faBan, faCheck, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { ethers } from 'ethers'
import { getSocialModuleInstance } from '../utils/contractSource'
import { NetworksConfig } from '../utils/network'

export const RecoveryRequestCard = props => {
  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'long'
  })
  const {
    request,
    guardians,
    minimumSignatures,
    fetchRecoveryRequests,
    socialRecoveryAddress,
    showFetchingError,
    setLoadingActive,
    setSnackBarMessage,
    setOpenSnackBar,
    readyToTransact
  } = props;

  const [{ wallet }] = useConnectWallet();
  const [{ connectedChain }] = useSetChain()
  const [_notifications, customNotification, _updateNotify] = useNotifications()
  const [signer, setSigner] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [executeTransaction, setExecuteTransaction] = useState(true);

  const signerAddress = wallet.accounts[0].address.toLowerCase();

  useEffect(() => {
    if (wallet) {
      if (wallet.provider) {
        const ethereumSigner = new ethers.providers.Web3Provider(wallet.provider, 'any')
        setSigner(ethereumSigner);
      }
    }
    setInsufficientBalance(false)
  }, [wallet]);


  const signTypedData = async () => {

    let result = null;
    const network = await signer.getNetwork();
    const chainId = network.chainId;

    const lostAccount = await getSocialModuleInstance(
      socialRecoveryAddress,
      signer,
    );

    const lostAccountAddress = request.accountAddress;
    const nonce = await lostAccount.nonce(lostAccountAddress)
    const name = await lostAccount.NAME();
    const version = await lostAccount.VERSION();

    const domain = {
      name,
      version,
      chainId,
      verifyingContract: socialRecoveryAddress,
    };
    const types = {
      ExecuteRecovery: [
        { type: "address", name: "wallet" },
        { type: "address[]", name: "newOwners" },
        { type: "uint256", name: "newThreshold" },
        { type: "uint256", name: "nonce" },
      ],
    };
    const message = {
      wallet: request.accountAddress,
      newOwners: [request.newOwner],
      newThreshold: "1",
      nonce, // current nonce (nonce is obtained from the module not from the wallet),
    };
    try {
      const uncheckedSigner = await signer.getUncheckedSigner();
      result = await uncheckedSigner._signTypedData(domain, types, message);
    } catch (e) {
      return null
    }
    setLoadingActive(true)
    try {
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/sign`,
        {
          id: request.id,
          signer: signerAddress.toLowerCase(),
          signedMessage: result,
        }
      )
      await fetchRecoveryRequests(lostAccountAddress, socialRecoveryAddress);

      setLoadingActive(false);
    } catch (e) {
      setLoadingActive(false);
      showFetchingError('Error occurred while submitting signature');
      return null
    }
    return result;
  }

  const onClickSign = async () => {
    const ready = await readyToTransact()
    if (!ready) return
    try {
      await signTypedData()
    } catch (e) {
      setSnackBarMessage('User cancelled signing operation')
      setOpenSnackBar(true)
      return
    }
  }

  const submitRecovery = async (
    id,
    accountAddress,
    newOwner,
    signatures
  ) => {
    setLoadingActive(true)

    const uncheckedSigner = await signer.getUncheckedSigner();

    let transaction = {
      to: socialRecoveryAddress,
      value: 0,
      gasLimit: 168463 * 2
    }
    let transactionResponse = null
    try {
      const lostWallet = await getSocialModuleInstance(
        socialRecoveryAddress,
        signer,
      );

      let callData = lostWallet.interface.encodeFunctionData(
        'multiConfirmRecovery',
        [
          accountAddress, // account address to be recovered
          [newOwner], // new owner of account
          1, // new threshold for gnosis safe account
          signatures, // signatures aquired by guardians
          true,
        ]
      )
      transaction.data = callData

      transactionResponse = await uncheckedSigner.sendTransaction(transaction)

      const { update, dismiss } = customNotification({
        eventCode: 'txPool',
        type: 'pending',
        message: 'Transaction submitted. This may take a few secs',
        onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResponse.hash}`),
      });

      const transactionResult = await transactionResponse.wait();
      dismiss();

      setTimeout(
        () =>
          update({
            eventCode: 'success',
            message: 'Transaction success',
            type: 'success',
            onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResult.transactionHash}`)
          }),
        1000,
      );

      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/submit`,
        { id, transactionHash: transactionResult.transactionHash }
      )

      setTimeout(
        async () => await fetchRecoveryRequests(accountAddress, socialRecoveryAddress),
        3000,
      );

    } catch (e) {
      console.log(e);
      if (e.code === 'INSUFFICIENT_FUNDS') {
        setInsufficientBalance(true)
        const estimatedCost = (await uncheckedSigner.getGasPrice()).mul(transaction.gasLimit)
        setSnackBarMessage(`Insufficient balance to cover networks fees. Required: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        setOpenSnackBar(true);
      } else if (e.code === 4001) {
        setSnackBarMessage('You cancelled the operation');
        setOpenSnackBar(true);
      } else if (e.code === 'CALL_EXCEPTION') {
        setSnackBarMessage('Transaction Failed');
        setOpenSnackBar(true);
      } else {
        showFetchingError('Error occurred while submitting recovery request')
      }
    }
    setLoadingActive(false)
  }

  const onClickSubmit = async () => {
    const ready = await readyToTransact()
    if (!ready) return
    try {
      await submitRecovery(
        request.id,
        request.accountAddress,
        request.newOwner,
        request.signatures
      )
    } catch (e) {
      showFetchingError('Transaction Failed. Error occurred while submitting recovery request')
      return null
    }
  }

  const signAndSubmit = async (
    id,
    accountAddress,
    newOwner,
    signatures
  ) => {
    setLoadingActive(true);
    const uncheckedSigner = await signer.getUncheckedSigner();

    let transaction = {
      to: socialRecoveryAddress,
      value: 0,
      gasLimit: 168463 * 2
    }
    let transactionResponse = null;

    const newSignatures = [...signatures];
    newSignatures.push([signerAddress, "0x"]);
    newSignatures.sort((a, b) => a[0] - b[0]);

    console.log(newSignatures, 'newSignatures');

    try {
      const lostWallet = await getSocialModuleInstance(
        socialRecoveryAddress,
        signer,
      );

      let callData = lostWallet.interface.encodeFunctionData(
        'multiConfirmRecovery',
        [
          accountAddress, // account address to be recovered
          [newOwner], // new owner of account
          1, // new threshold for gnosis safe account
          newSignatures, // signatures aquired by guardians,
          true,
        ]
      )
      transaction.data = callData;

      transactionResponse = await uncheckedSigner.sendTransaction(transaction);

      const { update, dismiss } = customNotification({
        eventCode: 'txPool',
        type: 'pending',
        message: 'Transaction submitted. This may take a few secs',
        onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResponse.hash}`),
      });

      const transactionResult = await transactionResponse.wait();
      dismiss();

      if (transactionResult.status === 1) {
        setTimeout(
          () =>
            update({
              eventCode: 'success',
              message: 'Transaction success',
              type: 'success',
              onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResult.transactionHash}`)
            }),
          1000,
        );

        await axios.post(
          `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/submit`,
          { id, transactionHash: transactionResult.transactionHash }
        )

        setTimeout(
          async () => await fetchRecoveryRequests(accountAddress, socialRecoveryAddress),
          3000,
        );
      } else {
        setTimeout(
          () =>
            update({
              eventCode: 'error',
              message: 'Transaction failed',
              type: 'error',
              onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResult.transactionHash}`)
            }),
          1000,
        );
      }
    } catch (e) {
      if (e.code === 'INSUFFICIENT_FUNDS') {
        setInsufficientBalance(true)
        const estimatedCost = (await uncheckedSigner.getGasPrice()).mul(transaction.gasLimit)
        setSnackBarMessage(`Insufficient balance to cover networks fees. Required: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        setOpenSnackBar(true);
      } else if (e.code === 4001) {
        setSnackBarMessage('You cancelled the operation');
        setOpenSnackBar(true);
      } else if (e.code === 'CALL_EXCEPTION') {
        setSnackBarMessage('Transaction Failed');
        setOpenSnackBar(true);
      } else {
        showFetchingError(e.message)
      }
    }
    setLoadingActive(false)
  };

  const onClickSignAndSubmit = async () => {
    const ready = await readyToTransact()
    if (!ready) return
    try {
      await signAndSubmit(
        request.id,
        request.accountAddress,
        request.newOwner,
        request.signatures
      )
    } catch (e) {
      showFetchingError(`Transaction Failed. ${e.message}`)
      return null
    }
  }

  const showActionButton = () => {
    // if is guardian and wants to sign and submit
    if (guardians.includes(signerAddress) && minimumSignatures <= request.signaturesAcquired + 1 && executeTransaction && !didSign) {
      return (
        <Button
          variant="contained"
          style={{
            background: '#F8ECE1',
            padding: '0.55rem 1.4rem',
            color: '#1F2546'
          }}
          startIcon={<FontAwesomeIcon icon={faBolt} />}
          onClick={onClickSignAndSubmit}
        >
          Sign & Submit
        </Button>
      )
    }
    // if is guardian and wants to only sign
    else if (guardians.includes(signerAddress) && (!executeTransaction || request.signaturesAcquired + 1 <= minimumSignatures)) {
      return (
        <Button
          variant="contained"
          style={{
            background: '#F8ECE1',
            padding: '0.55rem 1.4rem',
            color: didSign ? 'grey' : '#1F2546',
          }}
          startIcon={<FontAwesomeIcon icon={didSign ? faCheck : faSignature} />}
          onClick={onClickSign}
          disabled={didSign}
        >
          {didSign ? 'Signed' : 'Sign'}
        </Button>
      )
    } // is guardian or not, all signatures aquired, want to submit
    else if (minimumSignatures <= request.signaturesAcquired) {
      return (
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
      )
    }
    else if (insufficientBalance) {
      return (
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
      )
    }
  }

  // get guardians who already signed
  const signedGuardians = request.signatures.map((i) => i[0]);
  const didSign = signedGuardians.includes(signerAddress.toLowerCase());

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
          color="white"
          gutterBottom
        >
          Created {dateFormat.format(Date.parse(request.createdAt))}
        </Typography>
        <Typography variant="h6" noWrap color="white">
          {request.accountAddress}
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: 'Gilroy' }} color="white">
          Collected {request.signaturesAcquired ?? '0'} out of{' '}
          {minimumSignatures ?? '1'} minimum signatures
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: 'Gilroy' }} color="white">
          {!executeTransaction
            ? "Only sign if these emojis match those on the owner's screen"
            : "Only submit if these emojis match those on the owner's screen. You will start the recovery grace period"}
        </Typography>
        <Typography variant={'h5'} sx={{ mb: 1.5 }}>
          {request.emoji}
        </Typography>
        {guardians.includes(signerAddress) && (!didSign && (request.signaturesAcquired + 1 >= minimumSignatures))
          ? (
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked
                    onChange={(e) => setExecuteTransaction(e.target.checked)}
                    sx={{
                      color: "green",
                      '&.Mui-checked': {
                        color: "green",
                      },
                    }} />
                }
                label="Execute Transaction"
                sx={{ color: "white" }} />
              <FontAwesomeIcon
                icon={faCircleInfo}
                color="white"
                size="lg"
                title="If you want to sign the recovery now but manually execute it later, uncheck this box"
              />
            </FormGroup>
          )
          : null}
      </CardContent>
      <CardActions sx={{ mr: 5 }}>
        {showActionButton()}
      </CardActions>
    </Card>
  )
}
