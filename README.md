# Simple Notes App

We are going to create a simple note application that performs create, read, update and delete operation. We are going to use aws-serverless feature for this.

And for infrastructure as code, we are going to use `serverless` framework and `cloudformation`.

So lets install our node version `16.14.0` (which will be used to build this project).

```bash
nvm install 14.16.0
nvm use 14.16.0
node --version
npm install -g serverless@2
serverless --version
```

so our node version is:  `14.16.0` and serverless framework version: `2.72.3`

now lets create a user with `administrator access` (`admin group`) and create an acess key for `cli` activity.

Now from the official [serverless](https://www.serverless.com/) website, we go through the documenation to get the command for `AWS - Config Credentials` which will setup our default cli credential for aws.

```bash
serverless config credentials --provider aws --key <access_key> --secret <access_secret>
```

Now lets create a aws-nodejs serverless project from template,

```bash
serverless create -t aws-nodejs
```
we create a new `package.json` file for the packages that we will be using later on.

```bash
npm init -y
```

Now we modify to create our `createNote` lambda function that return a success code and a dummy response that a note has been created. 

After that, we modify our `serverless.yml` accordingly. We also use it to create the api-gateway (with  the method and the path) that invokes the lambda function (as an event/trigger)

Finally, we deploy our lambda function using the following command:

```bash
serverless deploy
```

now after `serverless` framework finishes, it shows the link to access our api-gateway and invoke the lambda.
we make a `post` reaction to the url and we get our dummy response that a note has been created.

Now similarly we user `serverless.yml` to create the other dummy endpoints and invoke the related dummy lambda function and it all seems to work now!

The things to be noted here are:

1. `path: notes/{id}` is how you define a dynamic path with a `pathParameter`.
2. `event.pathParameters.id` is how you access the path-parameter in your lambda function.


