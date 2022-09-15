import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import VConsole from 'vconsole'
import { initWeb3Onboard } from './services'
import {
  useConnectWallet,
  useNotifications,
  useSetChain,
  useWallets,
} from '@web3-onboard/react'
import logo from './icons/logov3.svg'
import './App.css'
import {isValid} from "./utils/address";
import {RecoveryRequestCard} from "./components/RecoveryRequestCard";
import axios from "axios";
import LoadingButton from "@mui/material/Button";
import {Alert, Snackbar} from "@mui/material";
import LoadingOverlay from 'react-loading-overlay';
import {contracts} from "testing-wallet-helper-functions";
require('dotenv').config()

if (window.innerWidth < 700) {
  new VConsole()
}

let provider

const App = () => {
  const [{ wallet }, connect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const [notifications, customNotification] = useNotifications()
  const connectedWallets = useWallets()
  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [toAddress, setToAddress] = useState('')
  const [fetchingRequests, setFetchingRequests] = useState(false)
  const [loadingActive, setLoadingActive] = useState(false)
  const [openSnackBar, setOpenSnackBar] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState("")
  const [recoveryRequests, setRecoveryRequests] = useState([])
  const [minimumSignatures, setMinimumSignatures] = useState(0)

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
  }, [])

  useEffect(() => {
    console.log(notifications)
  }, [notifications])

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
    if (!wallet?.provider) {
      provider = null
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
    }
  }, [wallet])

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
    // prompt user to switch to Gorli for test
    await setChain({ chainId: '0x5' })

    return true
  }


  const signRequestId = async (requestId, id) => {
    const signer = provider.getUncheckedSigner()
    let result = null;
    try {
      result = await signer.signMessage(ethers.utils.arrayify(requestId));
    } catch (e) {
      return null;
    }
    setLoadingActive(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/sign`,
        {id, signedMessage: result},
      )
      await fetchRecoveryRequests();
      setLoadingActive(false);
    } catch (e) {
      setLoadingActive(false);
      showFetchingError("Error occurred while fetching signature");
      return null;
    }
    return result;
  }

  const showFetchingError = (errorMessage) => {
    setRecoveryRequests([]);
    setMinimumSignatures(0);
    setFetchingRequests(false);
    setOpenSnackBar(true);
    setSnackBarMessage(errorMessage);
  }

  const fetchRecoveryRequests = async () => {
    setRecoveryRequests([]);
    setFetchingRequests(true);
    const guardians = [];
    let minimumSignatures = 0;
    try { //
      const lostWallet = await contracts.Wallet.getInstance(provider).attach(toAddress);
      //
      const guardiansCount = (await lostWallet.getGuardiansCount()).toNumber();
      for (let i = 0; i < guardiansCount; i++) {
        const guardianAddress = await lostWallet.getGuardian(i);
        guardians.push(guardianAddress.toString().toLowerCase());
      }
      //
      minimumSignatures = (await lostWallet.getMinGuardiansSignatures()).toNumber();
      //
    } catch (e) {
      showFetchingError("No recovery requests found for this wallet");
      return;
    }
    const signer = provider.getUncheckedSigner()
    const signerAddress = (await signer.getAddress()).toLowerCase();
    if (!guardians.includes(signerAddress)){
      showFetchingError("You are not a guardian for this wallet");
      return;
    }
    //
    const response = await axios.get(
      `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/fetchByAddress`,
        {params: {walletAddress: toAddress.toLowerCase(), network: "Goerli"}},
    );
    if (response.data.length === 0){
      showFetchingError("No recovery requests found for this wallet");
      return;
    }
    setMinimumSignatures(minimumSignatures);
    setRecoveryRequests(response.data);
    setFetchingRequests(false);
  }

  const onClickSign = async(requestId, id) => {
    const ready = await readyToTransact();
    if (!ready) return;
    try {
      const result = await signRequestId(requestId, id);
      console.log(result);
    } catch (e) {
      setSnackBarMessage("User cancelled signing operation");
      setOpenSnackBar(true);
      return;
    }
  }

  if (!web3Onboard) return <div>Loading...</div>

  return (
    <LoadingOverlay
      active={loadingActive}
      spinner
      text='Loading...'
    >
      <main>
        <Snackbar
          anchorOrigin={{vertical:'bottom', horizontal:'center'}}
          open={openSnackBar}
          onClose={() => setOpenSnackBar(false)}
          autoHideDuration={4000}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {snackBarMessage}
          </Alert>
        </Snackbar>
        <section className="main">
          <div className="main-content">
            <div className="vertical-main-container">
              <div className="container onboard">
                <div style={{height: '2rem'}}/>
                <img
                  className="logo"
                  src={logo}
                />
                <div style={{height: '3rem'}}/>
                <text style={{fontFamily: 'Gilroy', fontWeight: 'bold', color: '#1F2546', fontSize: '2rem'}}>Recover a lost wallet</text>
                <div style={{height: '5rem'}}/>
                {!wallet && (
                  <div className="account-center-actions">
                    <div style={{flexDirection: "column", alignItems: "center"}}>
                      <text style={{fontFamily: 'Gilroy', color: '#1F2546', fontSize: '1.2rem', textAlign: 'center'}}>
                        Let's first start by connecting<br/>your wallet (as a Guardian)
                      </text>
                      <div style={{height: '5px'}}/>
                      <button
                        className="default-button"
                        onClick={async () => {
                          const walletsConnected = await connect()
                          console.log('connected wallets: ', walletsConnected)
                        }}
                      >
                        Connect your Wallet
                      </button>
                    </div>
                  </div>
                )}
                {wallet && <div className="account-center-actions">
                  <div style={{flexDirection: "column", alignItems: "flex-start"}}>
                    <text style={{fontFamily: 'Gilroy', color: '#1F2546', fontSize: '1.2rem'}}>
                      Public address of lost wallet
                    </text>
                    <div style={{height: '5px'}}/>
                    <input
                      type="text"
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        width: '18rem'
                      }}
                      value={toAddress}
                      placeholder="0x153ade556......"
                      onChange={e => setToAddress(e.target.value)}
                    />
                    <div style={{height: '1rem'}}/>
                    <LoadingButton
                      disabled={!isValid(toAddress)}
                      loading={fetchingRequests}
                      variant="contained"
                      style={{
                        opacity: !isValid(toAddress) || fetchingRequests ? "0.5" : "1",
                        background: "#1F2546",
                        padding: "0.55rem 1.4rem",
                        color: "#F8ECE1",
                      }}
                      onClick={fetchRecoveryRequests}
                    >
                      Next
                    </LoadingButton>
                  </div>
                </div>}
              </div>
            </div>
            <div style={{marginLeft: "15px", marginTop: "15px", marginRight: "15px"}}>
              <tbody style={{justifyContent: 'center', alignItems: 'center'}}>
              {recoveryRequests.map((object, i) => <RecoveryRequestCard
                request={object}
                key={object.id}
                minimumSignatures={minimumSignatures}
                onClickSign={() => onClickSign(object.requestId, object.id)}
              />)}
              </tbody>
            </div>
          </div>
        </section>
      </main>
    </LoadingOverlay>
  )
}

export default App
