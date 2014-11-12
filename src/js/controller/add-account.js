'use strict';

var appCtrl = require('../app-controller');

var AddAccountCtrl = function($scope, $location, $routeParams, mailConfig) {
    if (!appCtrl._auth && !$routeParams.dev) {
        $location.path('/'); // init app
        return;
    }

    $scope.getAccountSettings = function() {
        if ($scope.form.$invalid) {
            $scope.errMsg = 'Please enter a valid email address!';
            return;
        }

        $scope.busy = true;
        $scope.errMsg = undefined; // reset error msg

        return mailConfig.get($scope.emailAddress).then(function(config) {
            $scope.busy = false;
            $scope.state.login = {
                mailConfig: config,
                emailAddress: $scope.emailAddress
            };

            var hostname = config.imap.hostname;
            if (appCtrl._auth.useOAuth(hostname)) {
                // check for oauth support
                $scope.oauthPossible();
            } else {
                // use standard password login
                $scope.setCredentials();
            }

        }).catch(function() {
            $scope.busy = false;
            $scope.errMsg = 'Error fetching IMAP settings for that email address!';
        });
    };

    $scope.oauthPossible = function() {
        // ask user to use the platform's native OAuth api
        $scope.onError({
            title: 'Google Account Login',
            message: 'You are signing into a Google account. Would you like to sign in with Google or just continue with a password login?',
            positiveBtnStr: 'Google sign in',
            negativeBtnStr: 'Password',
            showNegativeBtn: true,
            faqLink: 'https://github.com/whiteout-io/mail-html5/wiki/FAQ#how-does-sign-in-with-google-work',
            callback: function(granted) {
                if (granted) {
                    // query oauth token
                    getOAuthToken();
                } else {
                    // use normal user/password login
                    $scope.setCredentials();
                    $scope.$apply();
                }
            }
        });

        function getOAuthToken() {
            // fetches the email address from the chrome identity api
            appCtrl._auth.getOAuthToken(function(err) {
                if (err) {
                    return $scope.onError(err);
                }
                $scope.setCredentials();
                $scope.$apply();
            });
        }
    };

    $scope.setCredentials = function() {
        $location.path('/login-set-credentials');
    };
};

module.exports = AddAccountCtrl;