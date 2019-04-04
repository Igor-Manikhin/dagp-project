var myApp = angular.module('myApp', ['ngRoute', 'ngCookies'])
   .config(function($routeProvider, $httpProvider,$locationProvider){

    $routeProvider
    .when('/', {
    	templateUrl: "../pages/main.html",
    	controller: "mainController"
    })

    .when('/determination', {
        resolve: {
            check:  function($location, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                    },
        },
        templateUrl: "../pages/determination.html",
        controller: "determinationController"
    })

    .when('/account', {
        resolve: {
            check:  function($location, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                    },
        },
        templateUrl: "../pages/account.html",
        controller: "accountController"
    })

    .when('/autorization', {
    	templateUrl: "../pages/autoriz.html",
    	controller: "autorizController"
    })

    .when('/registration', {
        templateUrl: "../pages/registration.html",
        controller: "registrController"
    })
    
    .when('/logout', {
        resolve: {
            deadResolve: function($location, user){
                            user.clearData();
                            $location.path('/autorization');
                        }
        }
    })
    
    .when('/recovery', {
        templateUrl: "../pages/recoveryPassword.html",
        controller: "recoveryController"
    })

    .when('/support', {
        templateUrl: "../pages/support.html",
        controller: "supportController"
    })
    
    .otherwise({
		redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});


