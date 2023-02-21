import React, { useState, useEffect } from 'react'
import VConsole from 'vconsole'
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

if (window.innerWidth < 700) {
  new VConsole()
}

const App = () => {
  const [{ wallet }, connect] = useConnectWallet()
  const [{ connectedChain }, setChain] = useSetChain()
  const [notifications, _customNotification, updateNotify] = useNotifications()
  const connectedWallets = useWallets()
  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [recoverAccountAddress, setRecoverAccountAddress] = useState('')
  const [loadingActive, setLoadingActive] = useState(false)
  const [openSnackBar, setOpenSnackBar] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
    const searchParams = new URLSearchParams(window.location.search)
    if (
      searchParams.has('lostAddress') &&
      isValid(searchParams.get('lostAddress'))
    ) {
      setRecoverAccountAddress(searchParams.get('lostAddress'))
    }
  }, [])

  useEffect(() => {
    console.log(notifications)
  }, [notifications])

  useEffect(() => {
    updateNotify({ position: 'bottomLeft' })
  }, [updateNotify]);

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
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
        setSnackBarMessage(`Unsupported Network. Change to ${NetworksConfig[10].name} or to Goerli test network`)
        setOpenSnackBar(true)
      } else {
        return true;
      }
    }
  }

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
                    Public address of lost account
                  </div>
                  <div style={{ height: '5px' }} />
                  <input
                    type="text"
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      width: '18rem'
                    }}
                    value={recoverAccountAddress}
                    placeholder="0x153ade556......"
                    onChange={e => setRecoverAccountAddress(e.target.value)}
                  />
                </div>
              </div>
            )}
          </Stack>
          {isValid(recoverAccountAddress) && wallet && (
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
