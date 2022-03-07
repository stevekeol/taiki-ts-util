# ts-injection-with-decorator
Dependency Inject using typescript decorator

#### Skip ahead!

Dependency injection is a well known software development technique that is based off of one of the SOLID principles - dependency inversion. It allows us to abstract the creation of classes to be separate from their implementation, which make it easier for us to make changes on classes that depend on those implementations in the future.


In this article, we will be building an extremely small and lightweight dependency injection service using the experimental decorators that TypeScript provides. You may have seen these about before, such as with Angular’s `@Component`, `@Injectable` and `@Pipe` decorators. These decorators allow us to wrap existing implementations and alter their contents or provide extra functionality without having to change the code of the items itself.


> Please note, I wouldn’t recommend rolling out your own dependency injection service for use within your applications. There are already existing services such as tsyringe and inversify which will have much better support for what you will need. This article is just a learning excercise.

Without further ado, let’s get started.

Getting set up
--------------

Firstly, we’ll need to create a new NPM project and install TypeScript and lodash within that project.


Then, in your `tsconfig.json` file, make sure you uncomment and fill in the following lines - these are necessary in order to use the experimental decorators.

##### tsconfig.json

    {
      "lib": ["es2015", "dom"],
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    }
    

How our DI service is going to work
-----------------------------------

With our dependency injection service, to make a class available for dependency injection we will add an `@Injectable` decorator that accepts a token to identify it. This will instantiate our class and add it in to a global container.


To inject other classes in to our class, we will use an `@Inject` decorator on a class property that takes the token of the desired class as an argument and fetches the respective class from the global container. Our dependency tree can go as deep as possible, with classes that are injected also being able to inject other classes.

Building our container
----------------------

For any dependency injection service, there is always some form of centralised container. This container will store all of the instances of the initialised classes in our application, while also providing methods for requesting them.

##### container.ts

    import { find } from 'lodash';
    
    export class Container {
      private _providers: { [key: string]: any } = {};
    
      public resolve(token: string) {
        const matchedProvider = find(
          this._providers,
          (_provider, key) => key === token
        );
    
        if (matchedProvider) {
          return matchedProvider;
        } else {
          throw new Error(`No provider found for ${token}!`);
        }
      }
    }
    
    export const container = new Container();
    


Lets step through each bit of the code:

*   First off, we initialise an empty object of `providers`. This is where we will store the instances of our injectable classes, indexed by the key that the consumer of the service uses to provide for that instance.
*   Next, we have a `resolve` method. This method will take a string token that is provided by the consumer, and use lodash’ `find` method (which can iterate through an object as well as an array) to iterate through the providers object in order to find the matching instance.
*   If an instance is found, return it. If not, throw an error.


At the end of this file we also export an instance of the container. We want to export the instance and not the un-constructed class because we want this to be a single instance that is shared across our whole application. This is known as a `singleton`.

Specifying our injectable classes
---------------------------------

In order to register our classes to be able to inject them in to other classes, we need a way of adding them to our container. We can do this in a nice and clean way by using TypeScript decorators.


A typescript decorator is just a normal javascript function. When we use it on a class, the first argument is the constructor of that class.

##### injectable.ts

    import { container } from '../instances/container';
    
    export function Injectable(token: string): Function {
      return function(target: { new () }): void {
        container.providers[token] = new target();
      };
    }
    


In the above snippet, our function actually _returns_ the function for our decorator to use. We’ve done this so that we are able to pass in our own parameter `token` to the decorator, and then still return the function that will use the arguments that the decorator provides.


We take the token as provided by the user (e.g. with `@Injectable('myService')`), and then initialise a new instance of the class as provided by the `target`. We then use the token to assign our instantiated class to the `providers` object in our global `container`.


Using this decorator looks like this:

    @Injectable('myInjectable')
    export class MyInjectable {}
    

Injecting classes
-----------------

Now that we have our decorator for declaring our injectable classes, we can start work on injecting them. We will make a decorator that wraps a class property which will it will assign the value of the injected class to.


Similarly to our `injectable` function, we will take a token as a parameter and return a function that will be executed.

##### inject.ts

    import { container } from '../instances/container';
    
    export function Inject(token: string) {
      return function(target: any, key: string) {
        Object.defineProperty(target, key, {
          get: () => container.resolve(token),
          enumerable: true,
          configurable: true
        });
      };
    }
    

In this function, the `target` parameter is the class containing our property, and `key` is the name of our property.


We use `Object.defineProperty` here in order to set our injected class. For the `get` field, we call our previously defined `resolve` method on our container with the `token` argument provided in the `@Inject` decorator. We use this decorator inside a class like so:

    @Inject('myInjectable') private myInjectable;
    

Making it unit testable
-----------------------


Now, if you’re not interested in unit testing, you’re free to end your journey here. However, one of the main benefits of dependency injection is that it makes testing our classes much more straight forward, allowing us to pass in custom mock classes instead of the real implementation. Lets dig in to how we can do this.


In our container, let’s add another method called `provide`.


##### container.ts

    export interface IContainerProvider {
      useValue: any;
      token: string;
    }
    
    export class Container {
      // Rest of the class
    
      public provide(details: IContainerProvider): void {
        this.providers[details.token] = details.useValue;
      }
    }
    

With this method, we can manually override the value that is stored for a specific token. This helps us a lot in testing, as we can provide custom values for our injected classes instead of using the real thing. This way, we can focus on testing our component in isolation.


Let’s throw together some sample classes and test them.

##### consumer.ts

    @Injectable('timeService')
    export class TimeService {
      public getCurrentDate(): Date {
        return new Date(Date.now());
      }
    }
    
    @Injectable('consumer')
    export class Consumer {
      @Inject('timeService') private timeService: TimeService;
    
      public currentDate: string;
    
      constructor() {
        this.currentDate = this.timeService.getCurrentDate();
      }
    }
    

If you’re an avid unit tester, you’ll probably notice what the problem would be here. Because our injected service gets the current date, the value that it returns will always be changing - hence not consistently unit testable. We need to provide a mock object in order to prevent our service from returning different results for the unit tests every time.

In the test file for our `Consumer` class (I am using Jest here, but the concepts will remain the same), we can now override the value of our injected class by using the `provide` method that we just added to our container.

##### consumer.spec.ts

    import { container } from './container';
    
    describe('Consumer', () => {
      let consumer: Consumer, timeServiceMock: TimeService;
    
      beforeEach(() => {
        timeServiceMock = { getCurrentDate: jest.fn() };
        (timeServiceMock.getCurrentDate as jest.Mock).mockReturnValue('12/08/2020');
    
        container.provide({
          token: 'timeService',
          useValue: timeServiceMock
        });
    
        consumer = new Consumer();
      });
    
      it('should fetch the date', () => {
        expect(timeServiceMock.getCurrentDate).toHaveBeenCalledWith();
      });
    
      it('should set the date', () => {
        expect(consumer.currentDate).toBe('12/08/2020');
      });
    });
    

In the code snippet above, we have:

*   Created a mock object `timeServiceMock` to use in place of the real `TimeService`.
*   Mocked the return value of the `getCurrentDate` method in order to return a static string.
*   Used the `provide` method that we just added to our container in order to assign our mock to the token that our class will use to inject the `TimeService`.
*   Checked that both the `getCurrentDate` service was called, and that the value it returned was correctly assigned to the `currentDate` property in our `Consumer` instance.