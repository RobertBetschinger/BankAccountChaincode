# BankAccountChaincode
Bank Account CC for  HF with Read After Write Attack





This is an basic chaincode for an Bank Account, which implements basic functions like.
-- Create Assets. -- Invoke Assets. -- addMoneyToAccount. -- removeMoneyFromAccount. -- TransferMoney. --ConfirmRemove. --GetHistoryForAsset
--I did implement an ReadAfterWrite Vulnerbility --> Maybe you can find it.

--If you Need an other function--> Just Ask!

Within you HF-test Network you can Deploy it with:
./network.sh up createChannel -ca

//Remove the Application Folder.
./network.sh deployCC -ccn basic -ccp ../bank-account/ -ccl javascript

run from Application Folder:
node app.js

