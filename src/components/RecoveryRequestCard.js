import React from 'react';
import { Button, Card, CardActions, CardContent, Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature } from "@fortawesome/free-solid-svg-icons";

export const RecoveryRequestCard = (props) => {
  const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' });

  return (
    <div>
      <Card variant="outlined" style={{
        background: "#1F2546",
        borderRadius: "15px",
        margin: "10px",
      }} width={"100%"} centered>
        <CardContent>
          <Typography sx={{ fontSize: 14, fontFamily: "Gilroy" }} color="#F8ECE1" gutterBottom>
            Created last {dateFormat.format(Date.parse(props.request.createdAt))}
          </Typography>
          <Typography variant='h6' noWrap color="#F8ECE1">
            {props.request.walletAddress}
          </Typography>
          <Typography sx={{ mb: 1.5, fontFamily: "Gilroy" }} color="#F8ECE1">
            Collected {props.request.signaturesAcquired ?? "0"} out of {props.minimumSignatures ?? "1"} minimum signatures
          </Typography>
          <Typography sx={{ mb: 1.5, fontFamily: "Gilroy" }} color="#F8ECE1">
            Only sign if these emojis match those on the owner's screen
          </Typography>
          <Typography variant={'h5'} sx={{ mb: 1.5 }}>
            {props.request.emoji}
          </Typography>
        </CardContent>
        <CardActions sx={{ mr: 5 }}>
          <Button
            variant="contained"
            style={{
              background: "#F8ECE1",
              padding: "0.55rem 1.4rem",
              color: "#1F2546",
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