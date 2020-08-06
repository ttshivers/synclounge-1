import Vue from 'vue';
import Clipboard from 'v-clipboard';
import VueChatScroll from 'vue-chat-scroll';

import vuetify from './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueChatScroll);
Vue.use(Clipboard);

Vue.config.productionTip = false;

router.beforeEach(async (to, from, next) => {
  if (!store.getters.GET_CONFIG) {
    await store.dispatch('FETCH_CONFIG');
  }

  if (!store.getters['plex/IS_AUTHENTICATED']
    && to.matched.some((record) => record.meta.requiresAuth)) {
    if (to.matched.some((record) => record.meta.redirectAfterAuth)) {
      next({
        name: 'Signin',
        query: {
          redirect: to.fullPath,
        },
      });
    } else {
      next({ name: 'Signin' });
    }
  } else if (to.matched.some((record) => record.meta.requiresNoAuth) && store.getters['plex/IS_AUTHENTICATED']) {
    next({ name: 'CreateRoom' });
  } else if (!store.getters['synclounge/IS_IN_ROOM'] && to.matched.some((record) => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    next({ name: 'CreateRoom' });
  } else {
    next();
  }
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
