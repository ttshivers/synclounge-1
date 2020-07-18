import { detect } from 'detect-browser';
import { intersection } from 'lodash-es';
import { makeUrl } from '@/utils/fetchutils';

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

const browser = detect();

const plexDeviceName = () => {
  switch (browser.name) {
    case 'edge-chromium': {
      // Plex doesn't like edge-chromium device name, so send it what plex web does
      return 'Microsoft Edge';
    }

    default: {
      return capitalizeFirstLetter(browser.name);
    }
  }
};

export default {
  IS_AUTHENTICATED: (state, getters, rootState, rootGetters) => !!rootGetters['settings/GET_PLEX_AUTH_TOKEN']
    && getters.IS_USER_AUTHORIZED,

  GET_PLEX_PRODUCT_HEADER: () => 'SyncLounge',
  GET_PLEX_DEVICE_DEVICE_HEADER: () => browser.os,
  GET_PLEX_DEVICE_NAME_HEADER: () => plexDeviceName(),
  GET_PLEX_PLATFORM_HEADER: () => plexDeviceName(),

  GET_PLEX_INITIAL_AUTH_PARAMS: (state, getters, rootState, rootGetters) => ({
    'X-Plex-Product': getters.GET_PLEX_PRODUCT_HEADER,
    'X-Plex-Version': rootGetters.getAppVersion,
    'X-Plex-Client-Identifier': rootGetters['settings/GET_CLIENTIDENTIFIER'],
    'X-Plex-Platform': getters.GET_PLEX_PLATFORM_HEADER,
    'X-Plex-Platform-Version': browser.version,
    // 'X-Plex-Sync-Version': 2,
    'X-Plex-Features': 'external-media,indirect-media',
    'X-Plex-Model': 'hosted',
    'X-Plex-Device': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
    'X-Plex-Device-Name': getters.GET_PLEX_DEVICE_NAME_HEADER,
    'X-Plex-Device-Screen-Resolution':
      `${window.screen.availWidth}x${window.screen.availHeight},${window.screen.width}x${window.screen.height}`,
    'X-Plex-Language': 'en',
  }),

  GET_PLEX_BASE_PARAMS: (state, getters, rootState, rootGetters) => (accessToken) => ({
    ...getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    'X-Plex-Token': accessToken || rootGetters['settings/GET_PLEX_AUTH_TOKEN'],
  }),

  GET_PLEX_AUTH_URL: (state, getters, rootState, rootGetters) => (code) => {
    const urlParams = {
      'context[device][product]': getters.GET_PLEX_PRODUCT_HEADER,
      'context[device][environment]': 'bundled',
      'context[device][layout]': 'desktop',
      'context[device][platform]': getters.GET_PLEX_PLATFORM_HEADER,
      'context[device][device]': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
      clientID: rootGetters['settings/GET_CLIENTIDENTIFIER'],
      code,
    };

    return makeUrl('https://app.plex.tv/auth#', urlParams);
  },

  IS_DONE_FETCHING_DEVICES: (state) => state.doneFetchingDevices,
  GET_DEVICE_FETCH_PROMISE: (state) => state.deviceFetchPromise,
  GET_PLEX_USER: (state) => state.user,

  IS_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => getters
    .IS_AUTHENTICATION_TYPE_NONE
    || rootGetters['plexservers/DOES_USER_HAVE_AUTHORIZED_SERVER']
    || getters.IS_PLEX_USER_AUTHORIZED,

  IS_PLEX_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => rootGetters
    .GET_AUTHENTICATION.type
  && rootGetters.GET_AUTHENTICATION.type.includes('user')
    && intersection(
      [getters.GET_PLEX_USER.username, getters.GET_PLEX_USER.email],
      rootGetters.GET_AUTHENTICATION.authorized,
    ).length > 0,

  IS_AUTHENTICATION_TYPE_NONE: (state, getters, rootState, rootGetters) => rootGetters
    .GET_AUTHENTICATION.mechanism === 'none',
};
