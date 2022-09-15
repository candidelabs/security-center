import React, { Component }  from 'react';
import {Button, Card, CardActions, CardContent, Typography} from "@mui/material";
import {isValid} from "../utils/address";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSignature} from "@fortawesome/free-solid-svg-icons";

export const RecoveryRequestCard = (props) => {
  const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' });

  return (
      <div>
          <Card variant="outlined" style={{display: 'flex', flexGrow: 1, background: "#F8ECE1", borderRadius: "15px", marginBottom: "10px"}} width={"100%"} centered>
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Created last {dateFormat.format(Date.parse(props.request.createdAt))}
              </Typography>
              <Typography variant="h5" component="div">
                {props.request.walletAddress}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                Collected {props.request.signaturesAcquired ?? "0"} out of {props.minimumSignatures ?? "1"} minimum signatures
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                This set of emojis ensure you are signing the correct recovery request, if you're not sure what this is, please abort recovery process
              </Typography>
              <Typography variant={'h5'} sx={{ mb: 1.5 }} color="text.primary" centered>
                {props.request.emoji}
              </Typography>
            </CardContent>
            <CardActions sx={{mr: 5}}>
              <Button
                variant="contained"
                style={{
                  background: "#1F2546",
                  padding: "0.55rem 1.4rem",
                  color: "#F8ECE1",
                }}
                startIcon={<FontAwesomeIcon icon={faSignature} />}
                onClick={props.onClickSign}
              >
                Sign</Button>
            </CardActions>
          </Card>
      </div>
    )
}