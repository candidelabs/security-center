import React from 'react';
import { Button, Card, CardActions, CardContent, Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature, faBolt } from "@fortawesome/free-solid-svg-icons";

export const RecoveryRequestCard = (props) => {
  const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' });

  const { request, minimumSignatures, onClickSign } = props;

  return (
    <Card variant="outlined" style={{
      background: "#1F2546",
      borderRadius: "15px",
      margin: "10px",
    }} width={"100%"} centered>
      <CardContent>
        <Typography sx={{ fontSize: 14, fontFamily: "Gilroy" }} color="#F8ECE1" gutterBottom>
          Created {dateFormat.format(Date.parse(request.createdAt))}
        </Typography>
        <Typography variant='h6' noWrap color="#F8ECE1">
          {request.walletAddress}
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: "Gilroy" }} color="#F8ECE1">
          Collected {request.signaturesAcquired ?? "0"} out of {minimumSignatures ?? "1"} minimum signatures
        </Typography>
        <Typography sx={{ mb: 1.5, fontFamily: "Gilroy" }} color="#F8ECE1">
          {request.signaturesAcquired !== minimumSignatures
            ? "Only sign if these emojis match those on the owner's screen"
            : "All signatures have been collected! You now need to submit this transaction to recover the account."
          }
        </Typography>
        <Typography variant={'h5'} sx={{ mb: 1.5 }}>
          {request.emoji}
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
          startIcon={
            request.signaturesAcquired !== minimumSignatures
              ? (
                <FontAwesomeIcon icon={faSignature} />
              ) : (
                <FontAwesomeIcon icon={faBolt} />
              )
          }
          onClick={onClickSign}
        >
          {request.signaturesAcquired !== minimumSignatures ? "Sign" : "Submit"}
        </Button>
      </CardActions>
    </Card>
  )
}