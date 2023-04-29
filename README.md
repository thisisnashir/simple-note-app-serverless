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


### Add Authorization