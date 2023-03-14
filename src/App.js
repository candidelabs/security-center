import React, { useState, useEffect } from 'react'
import { initWeb3Onboard } from './services'
import {
  useConnectWallet,
  useNotifications,
  useSetChain,
  useWallets
} from '@web3-onboard/react'
import logo from './icons/logov3.svg'
import './App.css'
import { isValid } from './utils/address'
import { DBRecoveryList } from './components/DBRecoveryList'
import { NetworksConfig } from './utils/network'
import { Alert, Snackbar, Stack } from '@mui/material'
import LoadingOverlay from 'react-loading-overlay'
require('dotenv').config()

const App = () => {
  const [{ wallet }, connect] = useConnectWallet()
  const [{ connectedChain }] = useSetChain()
  const [notifications, _customNotification, updateNotify] = useNotifications()
  const connectedWallets = useWallets()
  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [recoverAccountAddressInput, setRecoverAccountAddressInput] = useState('')
  const [recoverAccountAddress, setRecoverAccountAddress] = useState('')
  const [isChainSupported, setIsChainSupported] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false)
  const [openSnackBar, setOpenSnackBar] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
  }, [])

  useEffect(() => {
    console.log(notifications)
  }, [notifications])

  useEffect(() => {
    updateNotify({ position: 'bottomLeft' })
  }, [updateNotify]);

  useEffect(() => {
    const checkIfReady = async () => {
      if (connectedChain && connectedChain.id) {
        const ischainSupported = NetworksConfig.hasOwnProperty(Number(connectedChain.id));

        if (!ischainSupported) {
          setSnackBarMessage(`Unsupported Network. Change to one of the supported networks`);
          setOpenSnackBar(true);
          setIsChainSupported(false);
          return false;
        } else {
          setIsChainSupported(true);
        }
      } else {
        return false;
      }
    }
    checkIfReady();
  }, [connectedChain]);

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
    if (connectedWalletsLabelArray.includes('Magic Wallet')) {
      const [magicWalletProvider] = connectedWallets.filter(
        provider => provider.label === 'Magic Wallet'
      );

      async function setMagicUser() {
        try {
          const { email } =
            await magicWalletProvider.instance.user.getMetadata()
          const magicUserEmail = localStorage.getItem('magicUserEmail')
          if (!magicUserEmail || magicUserEmail !== email)
            localStorage.setItem('magicUserEmail', email)
        } catch (err) {
          throw err
        }
      }
      setMagicUser()
    }
  }, [connectedWallets, wallet])

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        const walletConnected = await connect({
          autoSelect: previouslyConnectedWallets[0]
        })
        console.log('connected wallet: ', walletConnected)
      }
      setWalletFromLocalStorage()
    }
  }, [connect])

  const readyToTransact = async () => {
    if (!wallet) {
      const walletSelected = await connect()
      if (!walletSelected) return false
    }
    // prompt user to switch to supported networks
    if (connectedChain && connectedChain.id) {
      const ischainSupported = NetworksConfig.hasOwnProperty(Number(connectedChain.id));

      if (!ischainSupported) {
        setSnackBarMessage(`Unsupported Network. Change to one of the supported networks`)
        setOpenSnackBar(true)
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  const handleOnNextSubmit = (e) => {
    e.preventDefault();
    if (!isValid(recoverAccountAddressInput)) {
      setAlertMessage("Invalid Account Address");
    } else {
      setAlertMessage('');
      setRecoverAccountAddress(recoverAccountAddressInput);
    }
  };

  if (!web3Onboard) return <div>Loading...</div>

  return (
    <LoadingOverlay active={loadingActive} spinner text="Loading...">
      <Stack justifyContent="center" spacing={2}>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={openSnackBar}
          onClose={() => setOpenSnackBar(false)}
          autoHideDuration={4000}
        >
          <Alert severity="info" sx={{ width: '100%' }}>
            {snackBarMessage}
          </Alert>
        </Snackbar>
        <Stack xs={12} className="aside" spacing={2}>
          <Stack
            xs={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <img
              className="logo"
              src={logo}
              alt="Candide Logo"
              style={{ maxHeight: '80%' }}
            />
          </Stack>
          <Stack display="flex" justifyContent="center" alignItems="center">
            <div
              style={{
                fontFamily: 'Gilroy',
                fontWeight: 'bold',
                color: '#1F2546',
                fontSize: '2rem'
              }}
            >
              Recover a lost account
            </div>
          </Stack>
          <Stack display="flex" justifyContent="center" alignItems="center">
            {!wallet && (
              <Stack spacing={2}>
                <Stack
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <div
                    style={{
                      fontFamily: 'Gilroy',
                      color: '#1F2546',
                      fontSize: '1.2rem',
                      textAlign: 'center'
                    }}
                  >
                    Connect your Recovery Contact Wallet*
                  </div>
                </Stack>
                <Stack>
                  <div
                    style={{
                      fontFamily: 'Gilroy',
                      color: '#1F2546',
                      fontSize: '1rem',
                      textAlign: 'center'
                    }}
                  >
                    * If you have email recovery enabled, choose the{' '}
                    <b>Magic Wallet</b> Option
                  </div>
                </Stack>
                <Stack
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <button
                    className="default-button"
                    onClick={async () => {
                      const walletsConnected = await connect()
                      console.log('connected wallets: ', walletsConnected)
                    }}
                  >
                    Connect your Wallet
                  </button>
                </Stack>
              </Stack>
            )}
            {wallet && (
              <div className="account-center-actions">
                <div
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Gilroy',
                      color: '#1F2546',
                      fontSize: '1.2rem'
                    }}
                  >
                    Type the public address of the lost account
                  </div>
                  <div style={{ height: '5px' }} />
                  <form onSubmit={handleOnNextSubmit}>
                    <input
                      type="text"
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        width: '18rem',
                        marginRight: '10px',
                        marginBottom: '10px',
                      }}
                      value={recoverAccountAddressInput}
                      placeholder="0x153ade556......"
                      onChange={e => setRecoverAccountAddressInput(e.target.value)}
                      disabled={!isChainSupported}
                    />
                    <button
                      className="default-button"
                      type="submit"
                      disabled={!isChainSupported}
                    >
                      Next
                    </button>
                  </form>
                </div>
              </div>
            )}
            {alertMessage && (
              <Alert severity="info">
                {alertMessage}
              </Alert>
            )}
          </Stack>
          {recoverAccountAddress && wallet && isChainSupported && (
            <DBRecoveryList
              toAddress={recoverAccountAddress}
              setLoadingActive={setLoadingActive}
              setSnackBarMessage={setSnackBarMessage}
              setOpenSnackBar={setOpenSnackBar}
              readyToTransact={readyToTransact}
            />
          )}
        </Stack>
      </Stack>
    </LoadingOverlay>
  )
}

export default App
