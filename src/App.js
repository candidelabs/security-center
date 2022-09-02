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
import logo from './icons/logo.png'
import './App.css'

if (window.innerWidth < 700) {
  new VConsole()
}

let provider

const internalTransferABI = [
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'to',
        type: 'address'
      }
    ],
    name: 'internalTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
]

let internalTransferContract

const App = () => {
  const [{ wallet }, connect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const [notifications, customNotification] = useNotifications()
  const connectedWallets = useWallets()

  const [web3Onboard, setWeb3Onboard] = useState(null)

  const [toAddress, setToAddress] = useState('')

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

    // Check for Magic Wallet user session
    if (connectedWalletsLabelArray.includes('Magic Wallet')) {
      const [magicWalletProvider] = connectedWallets.filter(
        provider => provider.label === 'Magic Wallet'
      )
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
    if (!wallet?.provider) {
      provider = null
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')

      internalTransferContract = new ethers.Contract(
        '0xb8c12850827ded46b9ded8c1b6373da0c4d60370',
        internalTransferABI,
        provider.getUncheckedSigner()
      )
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
        console.log('connected wallets: ', walletConnected)
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

  const sendHash = async () => {
    if (!toAddress) {
      alert('An Ethereum address to send Eth to is required.')
      return
    }

    const signer = provider.getUncheckedSigner()

    await signer.sendTransaction({
      to: toAddress,
      value: 1000000000000000
    })
  }


  if (!web3Onboard) return <div>Loading...</div>

  return (
    <main>
      <section className="main">
        <div className="main-content">
          <div className="vertical-main-container">
          <h1>Guardians Security</h1>
            <div className="container onboard">
              <img
                className="logo"
                src={logo}
                alt="logo"
              />
              <h2>Recover a Wallet</h2>
              <div className="account-center-actions">
                <div>
                  {!wallet && (
                    <button
                      className="bn-demo-button"
                      onClick={async () => {
                        const walletsConnected = await connect()
                        console.log('connected wallets: ', walletsConnected)
                      }}
                    >
                      Connect your Wallet
                    </button>
                  )}

                  {wallet && (
                    <>
                      <input
                        type="text"
                        style={{
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '10px',
                          marginLeft: '0.5rem',
                          width: '18rem'
                        }}
                        value={toAddress}
                        placeholder="address"
                        onChange={e => setToAddress(e.target.value)}
                      />
                      <button
                        disabled={console.log('if not proper address')}
                        className="bn-demo-button"
                        onClick={async () => {
                          console.log('check if guardian is assigned to recover the address they put in the input')
                        }}
                      >
                        Initiate Recovery
                      </button>
                    </>
                  )}
                </div>
                <div>
                </div>
              </div>
            </div>
            <div className="container notify">
              <h2>Transaction Notifications with Notify</h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label>Send 0.001 Goerli Eth to:</label>
                  <input
                    type="text"
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '10px',
                      marginLeft: '0.5rem',
                      width: '18rem'
                    }}
                    value={toAddress}
                    placeholder="address"
                    onChange={e => setToAddress(e.target.value)}
                  />
                </div>
                <div className={'send-transaction-container'}>
                  <button
                    className="bn-demo-button"
                    onClick={async () => {
                      const ready = await readyToTransact()
                      if (!ready) return
                      sendHash()
                    }}
                  >
                    Send
                  </button>
                  with in-flight notifications
                </div>
              </div>
              <div>
                <button
                  className="bn-demo-button"
                  onClick={() => {
                    const { update, dismiss } = customNotification({
                      eventCode: 'dbUpdate',
                      type: 'hint',
                      message: 'Custom hint notification created by the dapp',
                      onClick: () => window.open(`https://www.blocknative.com`)
                    })
                    // Update your notification example below
                    // setTimeout(
                    //   () =>
                    //     update({
                    //       eventCode: 'dbUpdateSuccess',
                    //       message: 'Hint notification reason resolved!',
                    //       type: 'success',
                    //       autoDismiss: 5000
                    //     }),
                    //   4000
                    // )
                    setTimeout(
                      () =>
                        // use the dismiss method returned or add an autoDismiss prop to the notification
                        dismiss(),
                      4000
                    )
                  }}
                >
                  Custom Hint Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <Footer /> */}
    </main>
  )
}

export default App
