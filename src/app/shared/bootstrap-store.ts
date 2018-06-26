import { core, getApplicationConfiguration, getCurrentApplication, getCurrentUser, settings, store } from '@springtree/eva-sdk-redux';
/**
 * Describes a configuration file
 */
export interface IEnvironment {
  applicationId: number;
  defaultToken: string;
  endPointURL: string;
}


/**
 * This will bootstrap the store by initalizing it with the loaded environment file
 * It will also do other essential things like loading the current application configuration and fetch the current user
 * */
export const bootstrapStore = (env: IEnvironment): Promise<any[]> => {

  // Enable potential discount options (GWP)
  //
  settings.enablePotentialDiscountOptions = false;

  // Provide our application details for the EVA user agent
  //
  settings.appName = 'eva-tester-v2';
  settings.appVersion = '1.0.0';

  // Setting the user token
  //
  settings.userToken = localStorage.getItem('userToken');

  // Setting the session id
  //
  const sessionId = localStorage.getItem('sessionId');

  // Initialize the SDK
  //
  core.init(env.defaultToken, env.endPointURL, sessionId);

  /** Actions we will be dispatching after the store has been initalized */
  const actions = [
    getApplicationConfiguration.createFetchAction(),
    getCurrentApplication.createFetchAction(),
    getCurrentUser.createFetchAction()
  ];

  const promises: Promise<any>[] = actions.map(action => {
    store.dispatch(action[0]);

    return action[1];
  });

  const promise = Promise.all(promises);

  return promise;
};
