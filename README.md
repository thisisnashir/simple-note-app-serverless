# Simple Notes App

We are going to create a simple note application that performs create, read, update and delete operation. We are going to use aws-serverless feature for this.

And for infrastructure as code, we are going to use `serverless` framework and `cloudformation`.

So lets install our node version `16.14.0` (which will be used to build this project).

```console
nvm install 14.16.0
nvm use 14.16.0
node --version
npm install -g serverless@2
serverless --version
```

so our node version is:  `14.16.0` and serverless framework version: `2.72.3`

now lets create a user with `administrator access` (`admin group`) and create an acess key for `cli` activity.

Now from the official [serverless](https://www.serverless.com/) website, we go through the documenation to get the command for `AWS - Config Credentials` which will setup our default cli credential for aws.

```console
serverless config credentials --provider aws --key <access_key> --secret <access_secret>
```

Now lets create a aws-nodejs serverless project from template,

```console
serverless create -t aws-nodejs
```
we create a new `package.json` file for the packages that we will be using later on.

```console
npm init -y
```

Now we modify to create our `createNote` lambda function that return a success code and a dummy response that a note has been created. 

After that, we modify our `serverless.yml` accordingly. We also use it to create the api-gateway (with  the method and the path) that invokes the lambda function (as an event/trigger)

Finally, we deploy our lambda function using the following command:

```console
serverless deploy
```

now after `serverless` framework finishes, it shows the link to access our api-gateway and invoke the lambda.
we make a `post` reaction to the url and we get our dummy response that a note has been created.

Now similarly we user `serverless.yml` to create the other dummy endpoints and invoke the related dummy lambda function and it all seems to work now!

The things to be noted here are:

1. `path: notes/{id}` is how you define a dynamic path with a `pathParameter`.
2. `event.pathParameters.id` is how you access the path-parameter in your lambda function.


## How our console looks with the resources ?
___

Okay, so now if we traverse our aws console to observe the resources that was created and managed for us:

1. We have a `Api-gateway` created for us with the name `dev-notes-api`. So serverless took the `stage` name and our `service`name and appended them with a `-` to name our api-gateway.

2. In the `s3 bucket` we also see a s3 bucket was created for storing the `.zip` file of our lambda function.

it was named : `notes-api-dev-serverlessdeploymentbucket-<somegibberishvalue>`

so first our `service` name and then our `stage` name and then the suffix `serverlessdeploymentbucket` and some gibberish value.

3. our lambda functions are named - `<service>-<stage>-<function_name>`

4. We see our path with the appropriate method were created and they invoke associated lambda function in a `proxy-integration` way.

![proxy integration](./readmeResources/sc-001.JPG)

Which means, our entire request is passed to our lambda function (api-gateway is doing no filtering and passing on the entire payload like a proxy). And the lambda response is similarly passed to the client as it was without any moderation by api-gateway.

5. Now although they invoke their own lambda function (createNote,deleteNote etc.) if we click on the lambda function (from the api-gateway UI), we taken to the same `handler.js` file where all the lambda function resides. 

![lambda code](./readmeResources/sc-002.JPG)

So all the lambda function are created with in the same `.js` file, like in our local machine.

6. We also notice the graphical representation that the api-gateway is triggering this lambda function.

![visual representation](./readmeResources/sc-003.jpg)

## Lets add dynamoDb table to our implementation
___

Now we add our dynamoDb table using `cloudformation` template inside serverless framework.
We can simply google `dynamodb cloudformation` to get the proper syntax.

In our template, we mention 

`BillingMode` (`PAY_PER_REQUEST`), `AttributeDefinitions` and `KeySchema` (the last 2 are required).
We could give it the table a name using `TableName` but we wanted to see what name our serverless framework gives to the table if we don't explicitly mention it.

And we find out the name is :  `<service>-<stage>-<LogicalNameOfTable>-<random_gibberish>`
(`notes-api-dev-notesTable-454H6S....`)

So for our sanity's sake, lets give it a simple name: `notesTable`

Now lets deploy again and we see our `notesTable` is created with one attribute which is the `hashkey` (partition key / primary id etc) and its `On-demand(PAY_PER_REQUEST)` modeled.


### lets use the dynamoDb table inside our lambda function
___

We are going to use the dynamoDb table inside our lambda function. And for that we are going to use the `aws-sdk`. For documentation, we just google `dynamodb javascript sdk`. 

Now in the documentation, we can see how to interact with dynamoDb using `aws-sdk` for javascript and instance that is used is `AWS.DynamoDB` but instead of that we are going to use the simpler one `AWS.DynamoDB.DocumentClient`


Now first, we install our aws-sdk (we are going to use the sdk version 2 for this)

```console
npm install aws-sdk@2
```


Then in our lambda file (above code for optimization purpose), we include the instances for communicating with the dynamodb table.

```js
const dynamoDb = require("aws-sdk/clients/dynamodb");
const documentClient = new dynamoDb.DocumentClient({region: 'ap-south-1'});
```


After that, we make the following changes for successful data entry.

1. we parse the event-body by `JSON.parse(event.body)` to get our post-data.
2. we add our context (`context`) and callback (`cb`) parameter too in our `async` lambda.
3. we add a try-catch block for using `await` with `promise`.
4. we `ConditionExpression: "attribute_not_exists(notesId)"` so that dynamodb first checks for the id that is to be created to make sure the item does not already exist.

Now we deploy our app using `sls deploy` (sls is short-form of serverless)

Now we post to our endpoint with the following json data:

```json
{
    "id": "11ab12",
    "title": "my first post",
    "body": "this is my post body"
}
```

but we receive an error.

```
User: arn:aws:sts: : 6517....:assumed-role/notes-api-dev-ap-south-1-lambdaRole/notes-api-dev-createNote is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:ap-south-1: 6651789...4:table/notesTable because no identity-based policy allows the dynamodb:PutItem action
```

So we facing a permission related error. We need to give our lambda function the permission to `putItem` in the dynamoDb table.

Now we can give IAM permission at the top level (so each of our lambda function get the same permission)

Lets add the `PutItem` permission now. We have to mention the resource Arn. For that, we can use the `intrinsic function` (`Fn::GetAtt`).

(google `dynamodb cloudformation` and go to `return value` section)

![Arn of our dynamoDb table](./readmeResources/sc-004.JPG)

so our resource Arn section looks: `Resource: !GetAtt notesTable.Arn`

Now if we deploy our app again and make the post request, we see it works!

And if we check our dynamoDb table, the entry should be there. Now if we make the request a 2nd time with the same object, we should see `The conditional request failed` error as we had put the `ConditionExpression` in our code.

### using serverless-iam-roles-per-function plugin
___

Using iam roles at the top level which is applied for each lambda function is okay in some scenario but no in this one. We gave all our lambda function `put` permission to our dynamoDb table. But what about our delete lambda function? it need delete permission. But if we apply it in the top level then our create lambda function will get the delete permission too.

So we should give each function least amount of privilege(permission) to do the task it needs.

So to apply function level permission, we need a plugin called `serverless-iam-roles-per-function` and we are going to install it as a dev-dependency (wont be install during production/deployment)

```console
npm i --save-dev serverless-iam-roles-per-function
```

In the `package.json` file, it should be added as our dev-dependency.

```json
 "devDependencies": {
    "serverless-iam-roles-per-function": "^3.2.0"
  }
```

Now in our `serverless.yml` file, we add our plugin section and our `serverless-iam-roles-per-function` plugin.

```yml
plugins:
  - serverless-iam-roles-per-function 
```

now we can take the `iamRoleStatements` section from the top level and use it in the function level.

we have now added our `PutItem` permission at the `createNote` lambda function level.

lets deploy again to see if our post endpoint still works! and we see it does!



### Fix our updateNote lambda function
___

So far our updateNote lambda function just returns a dummy message that it has updated the table with the appropriate data.

So lets make actual update to the dynamoDb table. But first, we need to give our lambda function the `UpdateItem` permission.

Now we also do not want to hard code the dynamoDb table name, like we did in the `createNote` function. Instead we can make use of `Environment` variables. We use intrinsic function to get the created table name (`ref`, which returns the table name as we can see in the documentation or in the above posted screenshot) and then store it in an environment variable to be used inside our lambda function.

And we add and use the environment variable similarly inside the `createNote` function as well.

Now for `updateNote`, instead of return a single string as a JSON (using JSON.stringify()) we are sending back the entire updated item as a response when a valid update operation is done.

Now lets try to update the item by making a put request at the proper path(`.../11ab12`) with the following data:

```json
{
    "title": "my first post HAS BEEN UPDATED!",
    "body": "this is my post body (edited)"
}
```

Also we are now adding a method `send` for creating the return object.

Now finally, lets check if the conditional expression works! Try to update data for a non-existing data by requesting to path: (`..\11ab14`) and see the error `"The conditional request failed"`. So everything is working as we wished.


### Fixing deleteNote endpoint 
___

So now we want to make `deleteNote` endpoint functional and the steps for that are pretty much similar to the one we have done.

1. We add environment variable to our `deleteNote` function so we can get our table name with out hardcoding it.
2. We add `iamRoleStatements` so our table has the permission to delete items.
3. We use the `documentClient` to delete our item


### Fixing getAllNote Endpoint 
___

Now fixing the `getAllNotes` endpoint is probably the simplest of all. We need to scan the database for all notes. And For that,

1. We add environment variable for the table name
2. We add the `Scan` IAM permission for the table
3. We scan the table (only need the table name and nothing else) and return the result

(note: when scanning the database there is a limit to how much data that is scanned and fetched. If that limit is reached, dynamoDb sends an additional parameter that works as an offset which you can use as the start point for the next scan operation)

### Optimization
___

So now all our endpoint is functional but we will explore a few optimization tactics.

1. <u> `EmptyEventLoop` latency fix </u>

Since JavaScript uses `event loop` which uses `even queues` for managing asynchronous operations, whenever we are using `cb(200,send(...))` callback function to return the response, sometimes, NodeJS may not immediately call that callback function and return the response and instead, wait for the `event queue` to be empty (assuming there are some task in the `event queue`).

This scenario may add latency to our lambda function. So, to remedy this we set `context.callbackWaitsForEmptyEventLoop` to false.

2. <u> Keep http connection alive for reducing latency </u>

In all our lambda function, we communicate with the dynamoDb using the `dynamoDb.DocumentClient` to communicate with our dynamoDb table. But behind the scene it uses, http call to the table to perform its operation. 

But every time, we make a http call, a latency is added to our function during the `handshake` part of the http call in order to establish that connection.

![handshake](./readmeResources/sc--005.JPG)

Instead we can keep the http connection alive after using it (after some time it will shut down anyway) which allow aws to reuse the same connection sometimes(when it can) and reduce `handshake` latency.

![2 ways to do this](./readmeResources/sc-006.JPG)

We can either use the `environment variable` (`AWS_NODEJS_CONNECTION_REUSE_ENABLED`) to do this which is much simpler or we could use the code which would be a bit cumbersome.

(Note that: we will have to add this `environment variable` to every lambda function that uses that `dynamoDb.DocumentClient` from `aws-sdk`, which is all four of them)

3. <u> DynamoDB timeout problem fix </u>

When we are using lambda with API gateway, we need to know:

![time out of different services](./readmeResources/sc-007.JPG)

- API gateway sends a timeout response to the client after `29 second`
- So lambda though it can run up to `15 minutes` must be configured to run at most `< 29 seconds` to send a response when we are using it with api-gateway in a ***synchronous*** manner.

![right time out configuration](./readmeResources/sc-008.JPG)

- But dynamoDb has latency in `milliseconds`. Yet, sometimes a very small percentage (`.000-something`) of query can take several minutes. By default our `dynamoDb.DocumentClient` is configured to retry up to `10 times` in such cases and take up to `50 seconds` to get a response from the dynamoDb table.

We should over ride this configuration to `3 times` maximum-retry and take `5 seconds` maximum to get a response. Otherwise, return a timeout.

![dynamoDb time out configuration](./readmeResources/sc-009.JPG)

For further reading, the article is pinned [here](https://seed.run/blog/how-to-fix-dynamodb-timeouts-in-serverless-application.html).

Also take a look at [this](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html)

## Add Access Control
___

So to block complete public access there are some measure that we can take.

1. <u> Api Key </u>

We can use `Api Key` for adding some sort of limitation to public access. We go to our `Api gateway` service and open the gateway for our app (`dev-notes-api`)

After that, we go to `API Keys` section and create an API key. But we can not yet use it. In order to use, we first have to create a usage plan from the `Usage Plans` section and associate a `API Resource` and a deployed `Stage` for that resource. (in our usage plan, we can rate limit that would apply to our entire `API Resource` or we can apply rate limit to individual method of that `API resource` too)

Next, we need to connect this usage plan to the `Api Key` we created. Now we go to our `API resource` and choose any endpoint and turn `API Key Required` to true and deploy our `API resource` to the `stage` of the above created usage plan.

And that's it! Now that API endpoint of that stage can not be access without the API key. We have to send a request to that endpoint with a header `x-api-key` and the value of that api-key in order to access it. 

While accessing we can also check the limit we set in the usage plan. After the limit is exceeded we won't be able to access that resource.


Now **API key** can not be used as some sort of authorization as the limitation of it is pretty obvious. 
Below are reason to use it:
![Api key reason](./readmeResources/sc-010.JPG)

2. <u> Lambda Authorizer </u>

Now we are going to add a lambda authorizer to our application. A lambda authorizer is like any other lambda function except this is called every time when an api end point (set up with this lambda authorizer) is hit and this lambda authorizer returns a `Principal & Policy` which determines whether the lambda function associated with that api endpoint should be invoked or not.

![lambda authorizer diagram](./readmeResources/sc-011.JPG)

So lambda authorizer is 2 type:

1. Token type
2. Request type

By default, if we do not configure anything, the lambda authorizer will be of `token` type. In this case, we have to sent the `token` in the request header as the value of `Authorization` key.

Also note that, the returned policy of the lambda authorizer is cached by default for 5 minutes.

So now,

1. We add new file (module) `my-authorizer.js`  where we export our authorizer lambda function `authHandler`.

2. We modify the `serverless.yml` file and give this function a `logical name` (`nashir_lambda_authorizer`)

3. Next, for every lambda function, we created an api endpoint as the trigger/event. For each of this api-endpoint, we add an authorizer and simply mention our `logical name` of our lambda authorizer function (`nashir_lambda_authorizer`)

4. Now we need to modify our lambda authorizer function to return a `authResponse` containing the principalId and the policy. For now, we will simply use dummy string `allow` or `deny` to determine a valid token. In real life, case we would actual verify something like a `jwt` token.

Now the IAM policy that our lambda authorizer has to return a has a particular format. We can go to IAM service and look into any policy (`adminReadUserPolicy` in this case) and we will see the format.

![IAM policy structure](./readmeResources/sc-012.JPG)

That is it. If we now deploy again we should see from console (`Authorizer` section) that our lambda function is created.

![console our lambda authorizer](./readmeResources/sc-013.JPG)

We should also notice that each api end point now has a authorizer (our lambda authorizer)

![lambda authorizer set for api end point](./readmeResources/sc-014.JPG)


5.  Now lets make a request to the `/notes` endpoint to see all the notes and we get a response that we are not authorized.

We add a header to our request with the key `Authorization` and the value `allow` and see that we are getting our responses successfully.

Now if we changed the header value to `deny` we should see the **'unauthorized'** response again.

But if we changed to value to anything other that `allow` or `deny` we see `message` object with `null` value. But in our code, we returned **"Error: Invalid token"** error which we should see in the CloudWatch logs for our lambda authorizer.

![Invalid response in CloudWatch](./readmeResources/sc-015.JPG)

7. We should note that, we can also return a `context` object in our `authResponse` from the lambda authorizer. This context object can have many useful information that our `inner` lambda function can use (like more information about the user that are fetched from the database etc.).

And so, this context object is also available in our inner lambda function `event` object. Lets console log this in our `getAllNotes` lambda function and make a request to the `/notes` endpoint to see all the notes with `Authorization` header and `allow` value.

Now lets see our `getAllNotes` function's log in CloudWatch to see that the context object with the dummy key **'foo'**  and dummy value **'bar'** is there along with the `PrincipalId`

![Context from lambda authorizer passed to inner lambda](./readmeResources/sc-017.JPG)

We also see that the policy that our lambda function returns is available in our inner function.

![policy from lambda authorizer passed to inner lambda](./readmeResources/sc-016.JPG)
