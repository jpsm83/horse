- theme selector on profile page does not update the theme





you said "Invite fallback (when no results): horse name + owner email → creates an OwnershipTransfer with
  connect_sire / connect_dam." and that is a critical error, we do not create a OwnershipTransfer when we invite a horse owner on the sire/dam pedigree connection. what we do is just ask the owner of the sire/dam to accept, in other works aknoledge that my horse is a child of his horse. this relation will be save on the database but i wont have any kind of ownership with the sire/dam horse related. the behavier here is just to display wich horse are the parents of mine and for that i need the acceptance of the owner to clarify that my horse in indeed a child of his horse.
  ownershiptransfer is a totaly different feature not related to what we are doing right now but you pointed out: "createOwnershipTransfer does not send any email. It only creates a pending transfer" but that is also a critical mistake, on ownership transfer we must send an email describing exactly what is that about and given the reciever the option to accept or reject it.
  on the model, at least one of the properties registryId / microchipId / passportNumber is required, not all but at least one so we have a unique property to link the horse. udpate all the models and files necessary.
  for the search we must sanitize the input, cleaning empty spaces, not case sencitive and ignoring symbols among other to make the search more optimize.