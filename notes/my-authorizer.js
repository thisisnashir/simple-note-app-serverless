'use strict';

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: "ap-south-1_UF0U9n2W3",
  tokenUse: "id",
  clientId: "585124vhn0hi45p0qf6l2lndd4"
})

const generatePolicy = (principalId, effect, resource) => {
  let authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    let policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Resource: resource,
          Action: "execute-api:Invoke",
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }
  authResponse.context = {
    foo: "bar",
  };
  console.log(JSON.stringify(authResponse));
  return authResponse;
};

module.exports.authHandler = async (event, context, callback) => {
  // lambda authorizer code
  var token = event.authorizationToken;
  console.log(token);
  // Validate the token
  try {
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));
    callback(null, generatePolicy("user", "Allow", event.methodArn));
  } catch (err) {
    callback("Error: Invalid token");
  }

  // var token = event.authorizationToken; // allow or deny
  // switch(token){
  //     case "allow":
  //         callback(null,generatePolicy("user","allow",event.methodArn));
  //         break;
  //     case "deny":
  //         callback(null,generatePolicy("user","deny",event.methodArn));
  //         break;
  //     default:
  //         callback("Error: Invalid token");
  // }
}