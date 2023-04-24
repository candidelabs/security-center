import React, { useCallback, useEffect, useState } from 'react'
import { Button, Card, CardActions, CardContent, Typography } from "@mui/material"
import { useConnectWallet, useNotifications, useSetChain } from '@web3-onboard/react'
import { ethers } from "ethers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faBolt } from '@fortawesome/free-solid-svg-icons'
import { NetworksConfig } from '../utils/network';

const FinilizeCard = (props) => {
    const {
        lostAccountContractInstance,
        lostAccountAddress,
        setLoadingActive,
        setSnackBarMessage,
        setOpenSnackBar,
        readyToTransact,
        showFetchingError,
    } = props;

    const [_notifications, customNotification, _updateNotify] = useNotifications();
    const [{ connectedChain }] = useSetChain()
    const [{ wallet }] = useConnectWallet();
    const [latestBlockTimeStamp, setLatestBlockTimeStamp] = useState();

    const [insufficientBalance, setInsufficientBalance] = useState(false);
    const [recoveryBlockTimestamp, setRecoveryBlockTimestamp] = useState();
    const [toBeFinilizedRecoveryRequest, setToBeFinilizedRecoveryRequest] = useState([]);


    useEffect(() => {
        if (wallet && wallet.provider) {
            const signer = new ethers.providers.Web3Provider(wallet.provider, 'any');
            getLatestBlockTimestamp(signer);
        }
        setInsufficientBalance(false)
    }, [wallet]);

    const getLatestBlockTimestamp = async (ethereumProvider) => {
        const timestamp = (await ethereumProvider.getBlock("latest")).timestamp;

        setLatestBlockTimeStamp(timestamp);
    }

    const fetchToBeFinilizedRecoveryRequests = useCallback(async (address) => {
        if (lostAccountContractInstance) {
            const recoveryRequest = await lostAccountContractInstance.getRecoveryRequest(address);

            if (recoveryRequest.length > 0) {
                const timestamp = Number(recoveryRequest[2]);

                if (timestamp !== 0) {
                    setRecoveryBlockTimestamp(timestamp);
                    setToBeFinilizedRecoveryRequest(recoveryRequest);
                } else {
                    setToBeFinilizedRecoveryRequest([]);
                }
            } else {
                setToBeFinilizedRecoveryRequest([]);
            }
        }
    }, [lostAccountContractInstance]);

    useEffect(() => {
        fetchToBeFinilizedRecoveryRequests(lostAccountAddress);
    }, [lostAccountAddress, fetchToBeFinilizedRecoveryRequests]);


    const finilizeRecovery = async (address) => {
        try {
            setLoadingActive(true);
            const finilizeTransaction = await lostAccountContractInstance.finalizeRecovery(address);

            // transation submited to the mempool
            const { update, dismiss } = customNotification({
                eventCode: 'txPool',
                type: 'pending',
                message: 'Transaction submitted. This may take a few secs',
                onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${finilizeTransaction.hash}`),
            });

            const transactionResponse = await finilizeTransaction.wait();
            dismiss();

            if (transactionResponse.status === 1) {
                update({
                    eventCode: 'success',
                    message: 'Transaction success',
                    type: 'success',
                    onClick: () => window.open(`${NetworksConfig[Number(connectedChain.id)].blockExplorer}/tx/${transactionResponse.transactionHash}`)
                });

                setTimeout(async () =>
                    await fetchToBeFinilizedRecoveryRequests(lostAccountAddress),
                    3000,
                );

                setTimeout(setLoadingActive(false), 3000);
            }
        }
        catch (e) {
            if (e.code === 'INSUFFICIENT_FUNDS') {
                setInsufficientBalance(true)
                setSnackBarMessage(`Insufficient balance to cover networks fees`);
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
            setLoadingActive(false);
        }
    };

    const onClickFinilize = async (address) => {
        const ready = await readyToTransact();
        if (!ready) return

        try {
            await finilizeRecovery(address);
        } catch (e) {
            setSnackBarMessage('User cancelled submit operation')
            setOpenSnackBar(true)
            return
        }
    };

    const isReadyToFinilize = recoveryBlockTimestamp &&
        latestBlockTimeStamp &&
        (recoveryBlockTimestamp - latestBlockTimeStamp) < 0;

    return (
        toBeFinilizedRecoveryRequest.length > 0 ? (
            <Card
                variant="outlined"
                style={isReadyToFinilize ? {
                    background: ' #35b566',
                    borderRadius: '15px',
                    margin: '10px'
                } : {
                    background: '#1F2546',
                    borderRadius: '15px',
                    margin: '10px'
                }}
                width={'100%'} >
                <CardContent>
                    <Typography variant="h6" noWrap color={isReadyToFinilize ? "black" : "white"}>
                        {isReadyToFinilize ?
                            'You can now recover the Account' :
                            `A grace period just started. You will be able to recover your account on ${new Date(recoveryBlockTimestamp * 1000).toLocaleString()}`}
                    </Typography>
                    <Typography sx={{ mb: 1.5, fontFamily: 'Gilroy' }} color={isReadyToFinilize ? "black" : "white"}>
                        If you didn't initiate this recovery request, or want to cancel it, head over to the Security Tab on your mobile app
                    </Typography>
                </CardContent>
                <CardActions>
                    {insufficientBalance ? (
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
                        </Button>) : (<Button
                            variant="contained"
                            style={isReadyToFinilize ? {
                                background: '#F8ECE1',
                                padding: '0.55rem 1.4rem',
                                color: '#1F2546'
                            } : {
                                background: 'grey',
                                padding: '0.55rem 1.4rem',
                                color: '#1F2546',
                            }}
                            startIcon={<FontAwesomeIcon icon={faBolt} />}
                            onClick={() => onClickFinilize(lostAccountAddress)}
                            disabled={!isReadyToFinilize}
                        >
                            Recover
                        </Button>
                    )}
                </CardActions>
            </Card >
        ) : null
    )
};

export default FinilizeCard;