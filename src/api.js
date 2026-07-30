(function () {
  'use strict';

  var API_BASE = '/api';

  function apiUrl(path) {
    return API_BASE + path;
  }

  async function fetchJson(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  window.AgroApi = {
    async listProducts() {
      var body = await fetchJson(apiUrl('/products'));
      return body.data;
    },

    async getProduct(slug) {
      var body = await fetchJson(apiUrl('/products/' + encodeURIComponent(slug)));
      return body.data;
    },

    async listProjects() {
      var body = await fetchJson(apiUrl('/projects'));
      return body.data;
    },

    async getProject(slug) {
      var body = await fetchJson(apiUrl('/projects/' + encodeURIComponent(slug)));
      return body.data;
    },
  };
})();
