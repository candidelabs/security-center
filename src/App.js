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
import { isValid } from "./utils/address";
import { RecoveryRequestCard } from "./components/RecoveryRequestCard";
import axios from "axios";
import LoadingButton from "@mui/material/Button";
import Grid2 from '@mui/material/Unstable_Grid2';
import { Alert, Snackbar } from "@mui/material";
import LoadingOverlay from 'react-loading-overlay';
import {getSocialModuleInstance} from "./utils/contractSource";
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


  const signDataHash = async (dataHash, id) => {
    const signer = provider.getUncheckedSigner()
    let result = null;
    try {
      result = await signer.signMessage(ethers.utils.arrayify(dataHash));
    } catch (e) {
      return null;
    }
    setLoadingActive(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/sign`,
        { id, signedMessage: result },
      )
      await fetchRecoveryRequests();
      setLoadingActive(false);
    } catch (e) {
      setLoadingActive(false);
      showFetchingError("Error occurred while submitting signature");
      return null;
    }
    return result;
  }

  const submitRecovery = async (id, socialRecoveryAddress, oldOwner, newOwner, signatures) => {
    const signer = provider.getUncheckedSigner()
    let result = null;
    setLoadingActive(true);
    try {
      const lostWallet = await getSocialModuleInstance(socialRecoveryAddress, provider);
      let callData = lostWallet.interface.encodeFunctionData("confirmAndRecoverAccess", [
        "0x0000000000000000000000000000000000000001",
        oldOwner,
        newOwner,
        signatures,
      ]);
      result = await signer.sendTransaction({
        to: socialRecoveryAddress,
        value: 0,
        data: callData,
        gasLimit: 168463*2,
      });
      await axios.post(
        `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/submit`,
        { id, transactionHash: result.hash },
      );
      await fetchRecoveryRequests();
      setLoadingActive(false);
    } catch (e) {
      setLoadingActive(false);
      showFetchingError("Error occurred while submitting recovery request");
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
    const response = await axios.get(
      `${process.env.REACT_APP_SECURITY_URL}/v1/guardian/fetchByAddress`,
      { params: { walletAddress: toAddress.toLowerCase(), network: "Goerli" } },
    );
    console.log(response.data);
    if (response.data.length === 0) {
      showFetchingError("No recovery requests found for this wallet");
      return;
    }
    //
    let guardians = [];
    let minimumSignatures = 0;
    try { //
      const lostWallet = await getSocialModuleInstance(response.data[0].socialRecoveryAddress, provider);
      //
      guardians = await lostWallet.getFriends();
      guardians = guardians.map(element => {
        return element.toLowerCase();
      });
      console.log(guardians);
      //
      minimumSignatures = (await lostWallet.threshold()).toNumber();
      //
    } catch (e) {
      showFetchingError("No recovery requests found for this wallet");
      return;
    }
    const signer = provider.getUncheckedSigner()
    const signerAddress = (await signer.getAddress()).toLowerCase();
    console.log(signerAddress.toLowerCase());
    console.log(guardians[0]);
    console.log(typeof guardians[0]);
    if (!guardians.includes(signerAddress.toLowerCase())) {
      showFetchingError("You are not a guardian for this wallet");
      return;
    }
    //
    setMinimumSignatures(minimumSignatures);
    setRecoveryRequests(response.data);
    setFetchingRequests(false);
  }

  const onClickSign = async (dataHash, id) => {
    const ready = await readyToTransact();
    if (!ready) return;
    try {
      const result = await signDataHash(dataHash, id);
      console.log(result);
    } catch (e) {
      setSnackBarMessage("User cancelled signing operation");
      setOpenSnackBar(true);
      return;
    }
  }

  const onClickSubmit = async (id, socialRecoveryAddress, oldOwner, newOwner, signatures) => {
    const ready = await readyToTransact();
    if (!ready) return;
    try{
      const result = await submitRecovery(id, socialRecoveryAddress, oldOwner, newOwner, signatures);
    } catch (e){
      setSnackBarMessage("User cancelled submit operation");
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
      <Grid2 container spacing={2}>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={openSnackBar}
          onClose={() => setOpenSnackBar(false)}
          autoHideDuration={4000}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {snackBarMessage}
          </Alert>
        </Snackbar>
        <Grid2 xs={12} className="aside">
          <Grid2 xs={12} display="flex" justifyContent="center" alignItems="center">
            <img
              className="logo"
              src={logo}
              alt="Candide Logo"
              style={{ maxHeight: "80%" }}
            />
          </Grid2 >
          <Grid2 display="flex" justifyContent="center" alignItems="center">
            <text style={{ fontFamily: 'Gilroy', fontWeight: 'bold', color: '#1F2546', fontSize: '2rem' }}>Recover a lost wallet</text>
          </Grid2>
          <Grid2 display="flex" justifyContent="center" alignItems="center">
            {!wallet && (
              <Grid2>
                <Grid2 display="flex" justifyContent="center" alignItems="center">
                  <text style={{ fontFamily: 'Gilroy', color: '#1F2546', fontSize: '1.2rem', textAlign: 'center' }}>
                    Let's first start by connecting your Guardian Wallet
                  </text>
                </Grid2>
                <Grid2 display="flex" justifyContent="center" alignItems="center">
                  <button
                    className="default-button"
                    onClick={async () => {
                      const walletsConnected = await connect()
                      console.log('connected wallets: ', walletsConnected)
                    }}
                  >
                    Connect your Wallet
                  </button>
                </Grid2>
              </Grid2>
            )}
            {wallet && <div className="account-center-actions">
              <div style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <text style={{ fontFamily: 'Gilroy', color: '#1F2546', fontSize: '1.2rem' }}>
                  Public address of lost wallet
                </text>
                <div style={{ height: '5px' }} />
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
                <div style={{ height: '1rem' }} />
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
          </Grid2>
          <Grid2>
            {recoveryRequests.map((object, i) => <RecoveryRequestCard
              request={object}
              key={object.id}
              minimumSignatures={minimumSignatures}
              onClickSign={() => object.signaturesAcquired === minimumSignatures ? onClickSubmit(object.id, object.socialRecoveryAddress, object.oldOwner, object.newOwner, object.signatures) : onClickSign(object.dataHash, object.id)}
            />)}
          </Grid2>
        </Grid2>
      </Grid2>
    </LoadingOverlay >
  )
}

export default App
