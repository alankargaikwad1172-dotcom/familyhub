/*
 * api.js
 * Talks to the backend server.
 * Every page uses this to send and receive data.
 */
var API = {
    BASE: '/api',

    getToken: function() {
        return localStorage.getItem('token');
    },

    setToken: function(token) {
        localStorage.setItem('token', token);
    },

    clearToken: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    setUser: function(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser: function() {
        var d = localStorage.getItem('user');
        return d ? JSON.parse(d) : null;
    },

    request: function(method, path, body) {
        var self = this;
        var options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        var token = this.getToken();
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }
        if (body) {
            options.body = JSON.stringify(body);
        }
        return fetch(this.BASE + path, options)
            .then(function(response) {
                return response.json().then(function(data) {
                    if (!response.ok) {
                        throw new Error(data.detail || 'Something went wrong');
                    }
                    return data;
                });
            })
            .catch(function(error) {
                if (error.message === 'Invalid or expired token') {
                    self.clearToken();
                    window.location.reload();
                }
                throw error;
            });
    },

    get: function(path) {
        return this.request('GET', path);
    },

    post: function(path, data) {
        return this.request('POST', path, data);
    },

    put: function(path, data) {
        return this.request('PUT', path, data);
    },

    del: function(path) {
        return this.request('DELETE', path);
    }
};